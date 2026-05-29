// MASAK (T.C. Hazine ve Maliye Bakanlığı) malvarlığı dondurulanlar API'si için adapter.
//
// Keşif: masak.hmb.gov.tr React SPA'sının (hmb-portal-client) main bundle'ında bulunan
// gerçek backend endpoint. Public — auth/csrf/recaptcha gerekmiyor (sayfadaki reCAPTCHA
// sadece WP Contact Form 7 formları için).
//
// Yapı:
//   POST /portal/v2/masak/mvd/malvarligi-dondurulanlar
//   Body: { ad, uyruk, orgut, yaptirim }   (her biri "" olabilir; en az birinin dolu
//         olması beklenir — biz yaptirim'i listCode başına dolduruyoruz)
//   Yanıt: { statusCode, columnNames[], numRows, data:[{ad_soyad_unvan, tckn_vkn,
//          uyrugu, yaptirim_turu, anne_adı, baba_adı, dogum_tarihi, dogum_yeri,
//          orgutu, karar_sayisi, diger_adlari, diger_uyruk, sira_no}, ...] }

const axios = require('axios');
const {
  normalizeName,
  splitAliases,
  extractIdNumbers
} = require('../../utils/textNormalize');

const BASE = process.env.MASAK_API_BASE || 'https://masak.hmb.gov.tr';
const ENDPOINT = '/portal/v2/masak/mvd/malvarligi-dondurulanlar';

// listCode → MASAK API yaptirim_turu eşlemesi (form dropdown değerleriyle birebir)
const LIST_TO_YAPTIRIM = {
  '6415_m5': 'BMGK Yaptırımları Kapsamında (6415 sayılı kanun 5. Maddesine istinaden)',
  '6415_m6': 'Yabancı ülke talebi (6415 sayılı kanun 6. Maddesine istinaden)',
  '6415_m7': 'İç Dondurma (6415 sayılı kanun 7. Maddesine istinaden)',
  '7262':    '7262 Sayılı Kanun Kapsamında'
};

// Tek listenin tüm ham kayıtlarını çeker.
async function fetchEntriesForList(listCode) {
  const yaptirim = LIST_TO_YAPTIRIM[listCode];
  if (!yaptirim) throw new Error(`Bilinmeyen listCode: ${listCode}`);

  const res = await axios.post(`${BASE}${ENDPOINT}`, {
    ad: '', uyruk: '', orgut: '', yaptirim
  }, {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'NomanogluBackend/1.0 (+kyc-screening)'
    }
  });

  const body = res.data;
  if (!body || body.statusCode !== 200 || !Array.isArray(body.data)) {
    throw new Error(`MASAK API beklenmeyen yanıt (status=${body?.statusCode})`);
  }
  return body.data;
}

// Ham bir kaydı (MASAK API objesi) SanctionsEntry schema'sına eşler.
// DB yazımı yapmaz; sadece doc nesnesini üretir.
function toSanctionsDoc(entry, listCode) {
  const fullName = String(entry.ad_soyad_unvan || '').trim();
  const aliasesRaw = entry.diger_adlari || '';
  const aliases = splitAliases(aliasesRaw);

  // TCKN/VKN direkt alan + ad/alias içinde geçen pasaport benzeri token'lar
  const idSources = [entry.tckn_vkn, aliasesRaw].filter(Boolean).join(' ');
  const idNumbers = extractIdNumbers(idSources);
  if (entry.tckn_vkn && /^\d{10,12}$/.test(String(entry.tckn_vkn).trim())) {
    // TCKN/VKN'yi öne al — birebir ID eşleşmesinde değerli
    const tckn = String(entry.tckn_vkn).trim();
    if (!idNumbers.includes(tckn)) idNumbers.unshift(tckn);
  }

  return {
    listCode,
    fullName,
    normalizedName: normalizeName(fullName),
    aliases,
    normalizedAliases: aliases.map(normalizeName).filter(Boolean),
    idNumbers,
    nationality: String(entry.uyrugu || '').trim(),
    birthDate: String(entry.dogum_tarihi || '').trim(),
    birthPlace: String(entry.dogum_yeri || '').trim(),
    organization: String(entry.orgutu || '').trim(),
    gazetteRef: '',
    decisionRef: String(entry.karar_sayisi || '').trim(),
    sourceRowRaw: entry,
    isActive: true
  };
}

module.exports = { fetchEntriesForList, toSanctionsDoc, LIST_TO_YAPTIRIM };
