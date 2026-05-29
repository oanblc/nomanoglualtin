// MASAK yaptırım listesi eşleştirmesi için metin normalizasyon yardımcıları.
// Amaç: Türkçe karakter ve translit (Arapça->Latin) varyasyonlarını tek bir
// karşılaştırılabilir forma indirgemek. Kaynak listeler Windows-1254 kökenli
// olabildiği için decode masakService tarafında yapılır; burada saf metin gelir.

// Türkçe karaktere özel ASCII eşlemesi (toLowerCase'in locale sorunlarını atlamak için).
const TR_MAP = {
  'İ': 'i', 'I': 'i', 'ı': 'i', 'i': 'i',
  'Ş': 's', 'ş': 's',
  'Ğ': 'g', 'ğ': 'g',
  'Ü': 'u', 'ü': 'u',
  'Ö': 'o', 'ö': 'o',
  'Ç': 'c', 'ç': 'c',
};

// İsim/ünvanı normalize et: Türkçe karakterleri ASCII'ye indir, diğer aksanları
// kaldır, küçük harfe çevir, alfanümerik dışını boşluğa çevir, boşlukları sıkıştır.
function normalizeName(input) {
  if (input === undefined || input === null) return '';
  let s = String(input);
  s = s.replace(/[İIıiŞşĞğÜüÖöÇç]/g, (ch) => TR_MAP[ch] || ch);
  // Diğer Latin aksanlarını ayır ve combining işaretlerini sil (é -> e, â -> a ...)
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  return s;
}

// Kimlik/pasaport numarasını normalize et: harf+rakam dışını sil, büyük harf.
function normalizeId(input) {
  if (input === undefined || input === null) return '';
  return String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Serbest metinden (ör. "Yemen pasaport numarası 00344994 ...") aday kimlik/pasaport
// numaralarını çıkar. En az 5 karakterlik, rakam içeren token'ları döndürür.
function extractIdNumbers(rawText) {
  if (!rawText) return [];
  const text = String(rawText);
  const found = new Set();

  // 1) Saf rakam dizileri (>= 5 hane) — TCKN/VKN/kimlik no
  const digitRuns = text.match(/\d{5,}/g) || [];
  digitRuns.forEach((d) => found.add(d));

  // 2) Rakam içeren alfanümerik token'lar (>= 5 karakter) — pasaport (örn BN4196361)
  const tokens = text.split(/[\s,;]+/);
  tokens.forEach((tok) => {
    const norm = normalizeId(tok);
    if (norm.length >= 5 && /\d/.test(norm)) found.add(norm);
  });

  return Array.from(found);
}

// "a) X  b) Y  c) Z" veya satır/; ile ayrılmış takma adları diziye böl.
function splitAliases(raw) {
  if (!raw) return [];
  return String(raw)
    // a) b) c) ç) ı) gibi madde işaretleri ile, ve satır sonu / ; ile böl
    .split(/[\r\n;]+|(?:\b[a-zçğıöşü]\s*\))/i)
    .map((x) => x.trim())
    .filter((x) => x.length > 1);
}

module.exports = { normalizeName, normalizeId, extractIdNumbers, splitAliases };
