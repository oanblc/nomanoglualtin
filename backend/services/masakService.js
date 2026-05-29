// MASAK yaptırım/malvarlığı dondurma listelerini periyodik çeken + parse eden servis.
// priceService.js desenini taklit eder: server.js boot'ta start...() çağırır,
// setInterval ile tekrarlar. CSV/Excel dosyalarını Windows-1254 decode ederek işler.
//
// NOT: MASAK siteleri JS-render SPA olduğundan otomatik çekim, keşfedilen GERÇEK
// dosya indirme URL'leri (MASAK_LIST_URLS env'i) üzerinden yapılır. URL yoksa job
// uyarı verip atlar; liste admin panelden manuel yüklenerek (ingestBuffer) beslenir.

const axios = require('axios');
const iconv = require('iconv-lite');
const XLSX = require('xlsx');
const { parse: parseCsvSync } = require('csv-parse/sync');

const SanctionsEntry = require('../models/SanctionsEntry');
const screeningService = require('./screeningService');
const masakHmb = require('./masakAdapters/masakHmb');
const {
  normalizeName,
  splitAliases,
  extractIdNumbers
} = require('../utils/textNormalize');

const SYNC_INTERVAL = parseInt(process.env.MASAK_SYNC_INTERVAL, 10) || 24 * 60 * 60 * 1000; // 24s
let syncTimer = null;
let lastSync = { at: null, ok: false, results: [], error: null };

// ── Kodlama tespiti ve decode ──────────────────────────────────────────────
function decodeBuffer(buffer) {
  // UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.toString('utf8');
  }
  const utf8 = buffer.toString('utf8');
  // Geçerli UTF-8 ise replacement karakteri içermez
  if (!utf8.includes('�')) return utf8;
  // Türk devlet siteleri genelde Windows-1254 (Latin-5)
  return iconv.decode(buffer, 'win1254');
}

// ── Parse: dosya türüne göre satır dizisi (array-of-arrays) üret ─────────────
function bufferToRows(buffer, filename = '') {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  }
  // CSV/TXT
  const text = decodeBuffer(buffer);
  const firstLine = text.split('\n')[0] || '';
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  return parseCsvSync(text, {
    delimiter,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
}

// ── Başlık satırını ve kolon eşlemesini bul ─────────────────────────────────
const FIELD_KEYWORDS = {
  name: ['ad soyad', 'adi soyadi', 'unvan', 'ad soyad unvan'],
  aliases: ['diger isim', 'kullandigi', 'bilinen diger', 'takma'],
  id: ['tckn', 'kimlik', 'pasaport', 'vkn', 'ulusal kimlik'],
  nationality: ['uyruk', 'uyrugu'],
  birthDate: ['dogum tarih'],
  birthPlace: ['dogum yer'],
  organization: ['orgut', 'baglantili oldugu'],
  gazetteRef: ['resmi gazete', 'gazete'],
  decisionRef: ['karar sayisi', 'karar']
};

function matchField(normHeader) {
  for (const [field, kws] of Object.entries(FIELD_KEYWORDS)) {
    if (kws.some((kw) => normHeader.includes(kw))) return field;
  }
  return null;
}

function findHeaderAndMap(rows) {
  // İlk 6 satır içinde "ad..." + (uyruk|kimlik|diger isim) içeren satırı başlık say
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const cells = (rows[i] || []).map((c) => normalizeName(c));
    const hasName = cells.some((c) => c.includes('ad soyad') || c.includes('unvan') || /^ad\b/.test(c));
    const hasAux = cells.some((c) => /uyruk|kimlik|pasaport|diger isim|tckn/.test(c));
    if (hasName && hasAux) {
      const map = {};
      cells.forEach((c, idx) => {
        const f = matchField(c);
        if (f && map[f] === undefined) map[f] = idx;
      });
      return { headerIndex: i, map };
    }
  }
  return { headerIndex: 0, map: {} };
}

// ── Bir kaynaktan gelen satırları DB'ye yaz (bulkWrite + stale pasifleştirme) ─
async function ingestRows(rows, listCode) {
  const { headerIndex, map } = findHeaderAndMap(rows);
  if (map.name === undefined) {
    throw new Error('İsim kolonu bulunamadı (başlık eşlenemedi)');
  }

  const syncBatch = `${listCode}-${Date.now()}`;
  const ops = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const fullName = String(row[map.name] || '').trim();
    if (!fullName || fullName.length < 2) continue;

    const aliasesRaw = map.aliases !== undefined ? row[map.aliases] : '';
    const idRaw = map.id !== undefined ? row[map.id] : '';
    const aliases = splitAliases(aliasesRaw);

    const doc = {
      listCode,
      fullName,
      normalizedName: normalizeName(fullName),
      aliases,
      normalizedAliases: aliases.map(normalizeName).filter(Boolean),
      idNumbers: extractIdNumbers(idRaw),
      nationality: map.nationality !== undefined ? String(row[map.nationality] || '').trim() : '',
      birthDate: map.birthDate !== undefined ? String(row[map.birthDate] || '').trim() : '',
      birthPlace: map.birthPlace !== undefined ? String(row[map.birthPlace] || '').trim() : '',
      organization: map.organization !== undefined ? String(row[map.organization] || '').trim() : '',
      gazetteRef: map.gazetteRef !== undefined ? String(row[map.gazetteRef] || '').trim() : '',
      decisionRef: map.decisionRef !== undefined ? String(row[map.decisionRef] || '').trim() : '',
      sourceRowRaw: row,
      syncBatch,
      isActive: true,
      updatedAt: Date.now()
    };

    ops.push({
      updateOne: {
        filter: { listCode, fullName: doc.fullName },
        update: { $set: doc, $setOnInsert: { createdAt: Date.now() } },
        upsert: true
      }
    });
  }

  if (ops.length) {
    await SanctionsEntry.bulkWrite(ops, { ordered: false });
  }

  // Bu listede güncel batch'e ait olmayan eski kayıtları pasifleştir (soft delete)
  await SanctionsEntry.updateMany(
    { listCode, syncBatch: { $ne: syncBatch } },
    { $set: { isActive: false, updatedAt: Date.now() } }
  );

  screeningService.invalidateCache();
  return ops.length;
}

// Admin panelden manuel yüklenen dosyayı işle (otomatik çekim güvenlik ağı / ilk seed)
async function ingestBuffer(buffer, { listCode, filename }) {
  const rows = bufferToRows(buffer, filename);
  const count = await ingestRows(rows, listCode);
  return count;
}

// Bir URL'den dosya indirip işle
async function fetchAndIngestUrl(url, listCode) {
  const res = await axios.get(url, { timeout: 20000, responseType: 'arraybuffer' });
  const buffer = Buffer.from(res.data);
  const filename = url.split('?')[0];
  return ingestBuffer(buffer, { listCode, filename });
}

// Hazır şekildeki doc'ları (adapter çıktısı) DB'ye yazar; stale kayıtları pasifleştirir.
// Bulk upsert, kalan: isActive=false. CSV yolundaki ingestRows ile aynı sözleşmeyi paylaşır.
async function ingestSanctionDocs(docs, listCode) {
  const syncBatch = `${listCode}-${Date.now()}`;
  const ops = [];

  for (const base of docs) {
    if (!base.fullName || base.fullName.length < 2) continue;
    const doc = { ...base, syncBatch, updatedAt: Date.now() };
    ops.push({
      updateOne: {
        filter: { listCode, fullName: doc.fullName },
        update: { $set: doc, $setOnInsert: { createdAt: Date.now() } },
        upsert: true
      }
    });
  }

  if (ops.length) {
    await SanctionsEntry.bulkWrite(ops, { ordered: false });
  }
  await SanctionsEntry.updateMany(
    { listCode, syncBatch: { $ne: syncBatch } },
    { $set: { isActive: false, updatedAt: Date.now() } }
  );

  screeningService.invalidateCache();
  return ops.length;
}

// Tek listenin MASAK API'den çekilip ingest edilmesi
async function syncFromHmbApi(listCode) {
  const raw = await masakHmb.fetchEntriesForList(listCode);
  const docs = raw.map((entry) => masakHmb.toSanctionsDoc(entry, listCode));
  return ingestSanctionDocs(docs, listCode);
}

// Tüm yapılandırılmış MASAK kaynaklarını senkronize et.
// Birincil yol: HMB API adapter (4 listeyi tek tek çeker — varsayılan açık).
// İkincil yol: MASAK_LIST_URLS env'inde dosya URL'leri varsa onlar da işlenir.
async function syncMasakLists() {
  const results = [];

  // 1) HMB API üzerinden 4 liste (varsayılan açık)
  if ((process.env.MASAK_AUTO_FETCH || 'true').toLowerCase() !== 'false') {
    for (const listCode of Object.keys(masakHmb.LIST_TO_YAPTIRIM)) {
      try {
        const count = await syncFromHmbApi(listCode);
        console.log(`✅ MASAK API senkron: ${listCode} — ${count} kayıt`);
        results.push({ source: 'hmb_api', listCode, count, ok: true });
      } catch (e) {
        console.error(`❌ MASAK API senkron hatası (${listCode}):`, e.message);
        results.push({ source: 'hmb_api', listCode, ok: false, error: e.message });
      }
    }
  } else {
    console.log('ℹ️ MASAK_AUTO_FETCH=false — HMB API çekimi devre dışı');
  }

  // 2) Ek dosya kaynakları (geriye dönük, opsiyonel)
  let fileSources = [];
  try { fileSources = JSON.parse(process.env.MASAK_LIST_URLS || '[]'); }
  catch (e) { console.warn('⚠️ MASAK_LIST_URLS JSON parse edilemedi:', e.message); }
  for (const src of fileSources) {
    try {
      const count = await fetchAndIngestUrl(src.url, src.listCode);
      console.log(`✅ MASAK dosya senkron: ${src.listCode} — ${count} kayıt`);
      results.push({ source: 'file_url', listCode: src.listCode, count, ok: true });
    } catch (e) {
      console.error(`❌ MASAK dosya senkron hatası (${src.listCode}):`, e.message);
      results.push({ source: 'file_url', listCode: src.listCode, ok: false, error: e.message });
    }
  }

  const ok = results.length > 0 && results.every((r) => r.ok);
  lastSync = { at: new Date(), ok, results, error: results.length ? null : 'no_sources' };
  return lastSync;
}

// Boot'ta çağrılır: ilk senkron + periyodik tekrar
function startMasakSync() {
  if (syncTimer) clearInterval(syncTimer);
  console.log(`🔄 MASAK liste senkronizasyonu başlatıldı (interval: ${SYNC_INTERVAL / 3600000} saat)`);
  // İlk çekimi gecikmeli yap (boot'ta DB hazır olsun)
  setTimeout(() => { syncMasakLists().catch((e) => console.error('MASAK ilk senkron hatası:', e.message)); }, 15000);
  syncTimer = setInterval(() => {
    syncMasakLists().catch((e) => console.error('MASAK senkron hatası:', e.message));
  }, SYNC_INTERVAL);
}

// Admin status için liste durumu
async function getStatus() {
  const agg = await SanctionsEntry.aggregate([
    { $group: {
      _id: '$listCode',
      total: { $sum: 1 },
      active: { $sum: { $cond: ['$isActive', 1, 0] } },
      lastUpdated: { $max: '$updatedAt' }
    } }
  ]);
  return {
    lists: agg.map((a) => ({ listCode: a._id, total: a.total, active: a.active, lastUpdated: a.lastUpdated })),
    lastSync,
    threshold: screeningService.THRESHOLD
  };
}

module.exports = {
  startMasakSync,
  syncMasakLists,
  syncFromHmbApi,
  ingestSanctionDocs,
  ingestBuffer,
  fetchAndIngestUrl,
  getStatus
};
