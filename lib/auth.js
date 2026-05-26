// Admin panelinde yetki verilebilen bölümler.
// backend/config/sections.js ile aynı kalmalı.
export const ADMIN_SECTIONS = [
  { id: 'prices',         label: 'Fiyat Yönetimi' },
  { id: 'businessPrices', label: 'İşletme Fiyatları' },
  { id: 'family',         label: 'NOMANOĞLU Ailesi' },
  { id: 'articles',       label: 'Rehber Makaleleri' },
  { id: 'branches',       label: 'Şubeler' },
  { id: 'transactions',   label: 'İşlemler' },
  { id: 'settings',       label: 'Ayarlar' },
  { id: 'seo',            label: 'SEO' },
  { id: 'legal',          label: 'Yasal' },
];

// JWT payload'ını çöz (yalnızca okuma amaçlı; gerçek doğrulama backend'de yapılır)
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// localStorage'daki adminToken'dan oturum bilgisini çıkar
export function getAuth() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;

  // Süresi geçmiş token
  if (payload.exp && Date.now() >= payload.exp * 1000) return null;

  return {
    token,
    role: payload.role,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    name: payload.name || '',
    isAdmin: payload.role === 'admin',
  };
}

// Belirli bir bölüm için yetki var mı? Admin her zaman yetkilidir.
export function hasPermission(auth, section) {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  return auth.permissions.includes(section);
}
