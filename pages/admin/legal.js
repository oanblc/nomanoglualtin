import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import Link from 'next/link';
import { FileText, ArrowLeft, Save, Edit2, Eye, EyeOff, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

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

export default function LegalAdmin() {
  const authAxios = useMemo(() => createAuthAxios(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'terms'
  const [message, setMessage] = useState({ type: '', text: '' });

  // Privacy Policy state
  const [privacyData, setPrivacyData] = useState({
    title: 'Gizlilik Politikası',
    content: '',
    lastUpdated: '',
    isActive: true
  });

  // Terms of Service state
  const [termsData, setTermsData] = useState({
    title: 'Kullanım Koşulları',
    content: '',
    lastUpdated: '',
    isActive: true
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadLegalPages();
  }, []);

  const loadLegalPages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/legal`);
      if (response.data.success) {
        const pages = response.data.data;
        const privacy = pages.find(p => p.type === 'privacy');
        const terms = pages.find(p => p.type === 'terms');

        if (privacy) {
          setPrivacyData({
            title: privacy.title || 'Gizlilik Politikası',
            content: privacy.content || '',
            lastUpdated: privacy.lastUpdated || '',
            isActive: privacy.isActive !== false
          });
        }

        if (terms) {
          setTermsData({
            title: terms.title || 'Kullanım Koşulları',
            content: terms.content || '',
            lastUpdated: terms.lastUpdated || '',
            isActive: terms.isActive !== false
          });
        }
      }
    } catch (error) {
      console.error('Legal sayfalar yüklenemedi:', error);
      setMessage({ type: 'error', text: 'Sayfalar yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (type) => {
    try {
      setSaving(true);
      const data = type === 'privacy' ? privacyData : termsData;

      const response = await authAxios.put(`${apiUrl}/api/legal/${type}`, {
        title: data.title,
        content: data.content,
        lastUpdated: data.lastUpdated || new Date().toLocaleDateString('tr-TR'),
        isActive: data.isActive
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Sayfa başarıyla kaydedildi!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setMessage({ type: 'error', text: 'Kaydetme sırasında bir hata oluştu.' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Tüm içerikler App Store/Google Play uyumlu varsayılan içeriklerle değiştirilecek. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setResetting(true);
      const response = await authAxios.post(`${apiUrl}/api/legal/reset-to-defaults`);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Tüm sayfalar varsayılan içeriklere sıfırlandı!' });
        await loadLegalPages(); // Yeniden yükle
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Sıfırlama hatası:', error);
      setMessage({ type: 'error', text: 'Sıfırlama sırasında bir hata oluştu.' });
    } finally {
      setResetting(false);
    }
  };

  const currentData = activeTab === 'privacy' ? privacyData : termsData;
  const setCurrentData = activeTab === 'privacy' ? setPrivacyData : setTermsData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Yasal Sayfalar | Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <FileText size={24} className="text-amber-500" />
                    <span>Yasal Sayfalar</span>
                  </h1>
                  <p className="text-sm text-gray-500">Gizlilik politikası ve kullanım koşullarını yönetin</p>
                </div>
              </div>
              <button
                onClick={resetToDefaults}
                disabled={resetting}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 disabled:bg-amber-50 text-amber-700 rounded-lg transition-colors font-medium text-sm"
              >
                <RotateCcw size={16} className={resetting ? 'animate-spin' : ''} />
                <span>{resetting ? 'Sıfırlanıyor...' : 'Varsayılana Sıfırla'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Message */}
        {message.text && (
          <div className={`max-w-7xl mx-auto px-6 mt-4`}>
            <div className={`flex items-center space-x-2 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 mt-4">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'privacy'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText size={18} />
                  <span>Gizlilik Politikası</span>
                  {!privacyData.isActive && <EyeOff size={14} className="text-gray-400" />}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'terms'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText size={18} />
                  <span>Kullanım Koşulları</span>
                  {!termsData.isActive && <EyeOff size={14} className="text-gray-400" />}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === 'privacy' ? 'Gizlilik Politikası' : 'Kullanım Koşulları'}
              </h2>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentData.isActive}
                    onChange={(e) => setCurrentData({ ...currentData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600 flex items-center space-x-1">
                    {currentData.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{currentData.isActive ? 'Aktif' : 'Pasif'}</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa Başlığı</label>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => setCurrentData({ ...currentData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>

              {/* Son Güncelleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Son Güncelleme Tarihi</label>
                <input
                  type="text"
                  value={currentData.lastUpdated}
                  onChange={(e) => setCurrentData({ ...currentData, lastUpdated: e.target.value })}
                  placeholder="örn: 02.01.2026"
                  className="w-full md:w-64 px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Bu tarih sayfada gösterilecektir</p>
              </div>

              {/* İçerik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sayfa İçeriği (HTML)
                </label>
                <textarea
                  value={currentData.content}
                  onChange={(e) => setCurrentData({ ...currentData, content: e.target.value })}
                  rows={20}
                  placeholder="<h2>Başlık</h2>&#10;<p>Paragraf içeriği...</p>"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  HTML etiketleri kullanabilirsiniz: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
                </p>
              </div>

              {/* Önizleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Önizleme</label>
                <div
                  className="border-2 border-gray-200 rounded-lg p-6 bg-white overflow-auto max-h-[500px]"
                  style={{ lineHeight: '1.6' }}
                >
                  <style jsx>{`
                    div :global(h2) { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937; }
                    div :global(h3) { font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: #374151; }
                    div :global(p) { margin-bottom: 0.75rem; color: #4b5563; }
                    div :global(ul) { margin-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: disc; }
                    div :global(li) { margin-bottom: 0.25rem; color: #4b5563; }
                    div :global(strong) { font-weight: 600; color: #1f2937; }
                    div :global(em) { font-style: italic; }
                    div :global(a) { color: #d97706; text-decoration: underline; }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: currentData.content }} />
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => savePage(activeTab)}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-semibold"
              >
                <Save size={18} />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Önemli Bilgiler:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Bu sayfalar App Store ve Google Play için zorunludur</li>
                  <li>Mobil uygulama bu içerikleri API üzerinden çekecektir</li>
                  <li>Web sitesinde footer'daki linklerden erişilebilir olacaktır</li>
                  <li>Sayfaları pasif yaparsanız web sitesinde görünmez</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
