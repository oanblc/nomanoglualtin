// Admin panelinde yetki verilebilen bölümlerin tek kaynağı.
// Frontend lib/auth.js içindeki ADMIN_SECTIONS ile aynı kalmalı.
const ADMIN_SECTIONS = [
  { id: 'prices',         label: 'Fiyat Yönetimi' },
  { id: 'businessPrices', label: 'İşletme Fiyatları' },
  { id: 'family',         label: 'NOMANOĞLU Ailesi' },
  { id: 'articles',       label: 'Rehber Makaleleri' },
  { id: 'branches',       label: 'Şubeler' },
  { id: 'transactions',   label: 'İşlemler' },
  { id: 'masak',          label: 'MASAK Kontrolleri' },
  { id: 'settings',       label: 'Ayarlar' },
  { id: 'seo',            label: 'SEO' },
  { id: 'legal',          label: 'Yasal' },
];

const SECTION_IDS = ADMIN_SECTIONS.map((s) => s.id);

module.exports = { ADMIN_SECTIONS, SECTION_IDS };
