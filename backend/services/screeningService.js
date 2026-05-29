// MASAK yaptırım listesine karşı isim/kimlik eşleştirmesi yapan servis.
// Aktif liste kayıtları bellekte cache'lenir (DB'yi her işlemde taramamak için).
const SanctionsEntry = require('../models/SanctionsEntry');
const { normalizeName, normalizeId } = require('../utils/textNormalize');

// Eşleşme eşiği (0–1). İsim benzerliği bu değerin üstündeyse eşleşme sayılır.
const THRESHOLD = parseFloat(process.env.MASAK_MATCH_THRESHOLD) || 0.88;
const CACHE_TTL = 10 * 60 * 1000; // 10 dakika

let cache = { entries: [], loadedAt: 0 };

// Levenshtein mesafesi (kısa stringler için yeterince hızlı)
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

function ratio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a, b) / maxLen;
}

// Token sıralamalı benzerlik: "ali veli" ~ "veli ali" durumunu yakalar.
function tokenSortRatio(a, b) {
  const sa = a.split(' ').sort().join(' ');
  const sb = b.split(' ').sort().join(' ');
  return ratio(sa, sb);
}

function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  return Math.max(ratio(a, b), tokenSortRatio(a, b));
}

// Ucuz ön filtre: ortak token veya benzer uzunluk yoksa pahalı hesaplamayı atla.
function shareToken(aTokens, normTarget) {
  if (!normTarget) return false;
  for (const t of aTokens) {
    if (t.length >= 3 && normTarget.includes(t)) return true;
  }
  return false;
}

async function loadCache(force = false) {
  if (!force && cache.entries.length && Date.now() - cache.loadedAt < CACHE_TTL) {
    return cache.entries;
  }
  const docs = await SanctionsEntry.find({ isActive: true })
    .select('listCode fullName normalizedName normalizedAliases idNumbers')
    .lean();
  cache = { entries: docs, loadedAt: Date.now() };
  return docs;
}

// Liste güncellendiğinde (sync/upload sonrası) cache'i geçersiz kıl.
function invalidateCache() {
  cache.loadedAt = 0;
}

// Ana eşleştirme. { fullName, identityNumber } -> { matched, status, score, matches[] }
async function screen({ fullName, identityNumber }) {
  const screenedAt = new Date();
  const normName = normalizeName(fullName);
  const normId = normalizeId(identityNumber);
  const nameTokens = normName ? normName.split(' ') : [];

  let entries;
  try {
    entries = await loadCache();
  } catch (e) {
    // DB/cache hatası: işlemi bloke etmeyip "error" durumu döndür (fail-open).
    // Kararı route katmanı verir; varsayılan olarak işleme izin verilir ama iz bırakılır.
    return { matched: false, status: 'error', score: 0, screenedAt, matches: [], error: e.message };
  }

  const matches = [];
  for (const e of entries) {
    let score = 0;
    let reason = '';

    if (normId && normId.length >= 5 && Array.isArray(e.idNumbers) && e.idNumbers.includes(normId)) {
      score = 1;
      reason = 'id';
    } else if (normName && (shareToken(nameTokens, e.normalizedName) ||
               (e.normalizedAliases || []).some((al) => shareToken(nameTokens, al)))) {
      let best = nameSimilarity(normName, e.normalizedName || '');
      for (const al of (e.normalizedAliases || [])) {
        const s = nameSimilarity(normName, al);
        if (s > best) best = s;
      }
      if (best >= THRESHOLD) {
        score = best;
        reason = 'name';
      }
    }

    if (score >= THRESHOLD) {
      matches.push({
        entryId: e._id,
        listCode: e.listCode,
        name: e.fullName,
        score: Math.round(score * 100) / 100,
        reason
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const matched = matches.length > 0;
  return {
    matched,
    status: matched ? 'blocked' : 'cleared',
    score: matched ? matches[0].score : 0,
    screenedAt,
    matches: matches.slice(0, 10)
  };
}

// Mobil/çalışana dönecek maskeli eşleşme bilgisi (PII sızdırmadan).
function redactForClient(match) {
  return {
    listCode: match.listCode,
    score: match.score,
    reason: match.reason
  };
}

module.exports = { screen, invalidateCache, redactForClient, THRESHOLD };
