import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Upload, RefreshCw, AlertCircle, CheckCircle, Check, Clock } from 'lucide-react';
import { getAuth, hasPermission } from '../../lib/auth';

// Auth header ile axios instance oluştur
const createAuthAxios = () => {
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
};

const LIST_LABELS = {
  '6415_m5': '6415 s.K. m.5 — BMGK Yaptırımları',
  '6415_m6': '6415 s.K. m.6 — Yabancı ülke talebi',
  '6415_m7': '6415 s.K. m.7 — İç Dondurma',
  '7262':    '7262 s.K. — Kitle imha fin.'
};

export default function MasakAdmin() {
  const authAxios = useMemo(() => createAuthAxios(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'manage'
  const [message, setMessage] = useState({ type: '', text: '' });

  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState(null);

  // Yükleme formu
  const [uploadListCode, setUploadListCode] = useState('6415_m5');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const a = getAuth();
    if (!a) {
      router.push('/admin/login');
      return;
    }
    if (!hasPermission(a, 'masak')) {
      router.push('/admin/dashboard');
      return;
    }
    loadAll();
  }, []);

  const flash = (type, text) => {
    setMessage({ type, text });
    if (type === 'success') setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadMatches(), loadStatus()]);
    setLoading(false);
  };

  const loadMatches = async () => {
    try {
      const res = await authAxios.get(`${apiUrl}/api/masak/matches`);
      if (res.data.success) setMatches(res.data.data);
    } catch (e) {
      console.error('Eşleşmeler yüklenemedi:', e);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await authAxios.get(`${apiUrl}/api/masak/status`);
      if (res.data.success) setStatus(res.data.data);
    } catch (e) {
      console.error('Durum yüklenemedi:', e);
    }
  };

  const handleOverride = async (id) => {
    if (!confirm('Bu işlemi "temiz / yanlış pozitif" olarak işaretlemek istediğinize emin misiniz?')) return;
    try {
      const notes = prompt('İsterseniz bir not ekleyin (opsiyonel):', '') || '';
      const res = await authAxios.post(`${apiUrl}/api/masak/override/${id}`, { notes });
      if (res.data.success) {
        flash('success', 'İşlem temiz olarak işaretlendi.');
        loadMatches();
      }
    } catch (e) {
      flash('error', 'Override başarısız.');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      flash('error', 'Lütfen bir CSV/Excel dosyası seçin.');
      return;
    }
    try {
      setUploading(true);
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });
      const res = await authAxios.post(`${apiUrl}/api/masak/upload`, {
        listCode: uploadListCode,
        filename: uploadFile.name,
        dataBase64
      });
      if (res.data.success) {
        flash('success', `${res.data.count} kayıt işlendi.`);
        setUploadFile(null);
        loadStatus();
      }
    } catch (e) {
      flash('error', e.response?.data?.message || 'Yükleme başarısız.');
    } finally {
      setUploading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await authAxios.post(`${apiUrl}/api/masak/sync`, {});
      if (res.data.success) {
        const r = res.data.data;
        if (r.error === 'no_sources') {
          flash('error', 'Otomatik kaynak (MASAK_LIST_URLS) tanımlı değil. Manuel yükleme kullanın.');
        } else {
          flash('success', 'Senkronizasyon tamamlandı.');
        }
        loadStatus();
      }
    } catch (e) {
      flash('error', 'Senkronizasyon başarısız.');
    } finally {
      setSyncing(false);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleString('tr-TR') : '-');
  const fmtAmount = (n) => `${Number(n || 0).toLocaleString('tr-TR')} TL`;

  return (
    <>
      <Head><title>MASAK Kontrolleri - Admin</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="text-red-600" size={22} />
                <h1 className="text-lg font-bold text-gray-800">MASAK Kontrolleri</h1>
              </div>
            </div>
            <button onClick={loadAll} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
              <RefreshCw size={16} /> <span>Yenile</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Mesaj */}
          {message.text && (
            <div className={`mb-4 flex items-center space-x-2 px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Sekmeler */}
          <div className="flex space-x-2 mb-6">
            <button onClick={() => setActiveTab('matches')} className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'matches' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              Eşleşmeler {matches.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{matches.length}</span>}
            </button>
            <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'manage' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              Liste Yönetimi
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
          ) : activeTab === 'matches' ? (
            /* ── Eşleşmeler ── */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {matches.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
                  <p>Bloke edilmiş / incelenecek işlem yok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Tarih</th>
                        <th className="px-4 py-3 font-medium">Müşteri</th>
                        <th className="px-4 py-3 font-medium">Şube</th>
                        <th className="px-4 py-3 font-medium">Tutar</th>
                        <th className="px-4 py-3 font-medium">Skor / Liste</th>
                        <th className="px-4 py-3 font-medium">Durum</th>
                        <th className="px-4 py-3 font-medium">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matches.map((t) => {
                        const sr = t.screeningResult || {};
                        const top = (sr.matches && sr.matches[0]) || {};
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{fmtDate(t.createdAt)}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{t.fullName}</div>
                              <div className="text-gray-400 text-xs">{t.identityNumber}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{t.branchId?.name || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{fmtAmount(t.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-red-600">{sr.score ?? top.score ?? '-'}</span>
                              <div className="text-gray-400 text-xs">{LIST_LABELS[top.listCode] || top.listCode || ''}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.screeningStatus === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {t.screeningStatus === 'blocked' ? 'Bloke' : 'İnceleme'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleOverride(t.id)} className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                <Check size={14} /> <span>Temiz işaretle</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ── Liste Yönetimi ── */
            <div className="space-y-6">
              {/* Durum */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <Clock size={18} className="text-gray-400" /> <span>Liste Durumu</span>
                </h3>
                {status?.lists?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {status.lists.map((l) => (
                      <div key={l.listCode} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                        <div className="text-xs text-gray-500">{LIST_LABELS[l.listCode] || l.listCode}</div>
                        <div className="text-2xl font-bold text-gray-800">{l.active}</div>
                        <div className="text-xs text-gray-400">aktif kayıt (toplam {l.total})</div>
                        <div className="text-xs text-gray-400 mt-1">Güncellendi: {fmtDate(l.lastUpdated)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Henüz liste yüklenmemiş. Aşağıdan CSV/Excel yükleyin.</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>Eşik (threshold): {status?.threshold ?? '-'}</span>
                  <span>Son otomatik senkron: {fmtDate(status?.lastSync?.at)}</span>
                </div>
              </div>

              {/* Manuel yükleme */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center space-x-2">
                  <Upload size={18} className="text-gray-400" /> <span>Manuel Liste Yükleme</span>
                </h3>
                <p className="text-xs text-gray-400 mb-4">MASAK'tan indirdiğiniz CSV/Excel dosyasını seçip ilgili listeye yükleyin. Bu, otomatik çekim çalışmasa da listeyi günceller.</p>
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Liste</label>
                    <select value={uploadListCode} onChange={(e) => setUploadListCode(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      {Object.entries(LIST_LABELS).map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Dosya (.csv / .xlsx)</label>
                    <input type="file" accept=".csv,.xls,.xlsx,text/csv" onChange={(e) => setUploadFile(e.target.files[0])} className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-700 file:font-medium" />
                  </div>
                  <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                    {uploading ? 'Yükleniyor...' : 'Yükle'}
                  </button>
                </div>
              </div>

              {/* Otomatik senkron */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Otomatik Senkronizasyon</h3>
                  <p className="text-xs text-gray-400">MASAK kaynaklarından (MASAK_LIST_URLS) listeyi şimdi çek.</p>
                </div>
                <button onClick={handleSync} disabled={syncing} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium">
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> <span>{syncing ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
