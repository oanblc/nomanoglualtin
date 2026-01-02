import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Search, BarChart3, Code, Save, ArrowLeft, Globe, FileText, Tag, Image, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminSeo() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('seo');
  const [message, setMessage] = useState({ type: '', text: '' });

  // SEO State
  const [seoData, setSeoData] = useState({
    // SEO
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    canonicalUrl: '',
    robotsContent: 'index, follow',
    googleSiteVerification: '',
    bingSiteVerification: '',
    // Analytics
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: '',
    // Custom Scripts
    headScripts: '',
    bodyStartScripts: '',
    bodyEndScripts: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/seo`);
      const data = await res.json();

      if (data.success && data.data) {
        setSeoData(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('SEO verisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const res = await fetch(`${apiUrl}/api/seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(seoData)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'SEO ayarları başarıyla kaydedildi!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Kaydetme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu: ' + error.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChange = (field, value) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'scripts', label: 'Özel Kodlar', icon: Code }
  ];

  return (
    <>
      <Head>
        <title>SEO & Analytics - Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SEO & Analytics</h1>
                  <p className="text-sm text-gray-500">Site geneli SEO ve takip kodları</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Message */}
        {message.text && (
          <div className={`max-w-7xl mx-auto px-4 mt-4`}>
            <div className={`flex items-center space-x-2 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Temel SEO */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Globe size={20} className="text-blue-600" />
                      <span>Temel SEO Ayarları</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Başlığı (Title)
                        </label>
                        <input
                          type="text"
                          value={seoData.siteTitle}
                          onChange={(e) => handleChange('siteTitle', e.target.value)}
                          placeholder="Nomanoğlu Kuyumculuk - Altın ve Döviz Fiyatları"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Önerilen: 50-60 karakter</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Açıklaması (Description)
                        </label>
                        <textarea
                          value={seoData.siteDescription}
                          onChange={(e) => handleChange('siteDescription', e.target.value)}
                          placeholder="Anlık altın ve döviz fiyatları. 1967'den bu yana güvenilir kuyumculuk hizmeti."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Önerilen: 150-160 karakter</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Anahtar Kelimeler (Keywords)
                        </label>
                        <input
                          type="text"
                          value={seoData.siteKeywords}
                          onChange={(e) => handleChange('siteKeywords', e.target.value)}
                          placeholder="altın fiyatları, döviz kurları, gram altın, çeyrek altın"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Virgülle ayırarak yazın</p>
                      </div>
                    </div>
                  </div>

                  {/* Open Graph */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Image size={20} className="text-blue-600" />
                      <span>Sosyal Medya (Open Graph)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OG Image URL
                        </label>
                        <input
                          type="text"
                          value={seoData.ogImage}
                          onChange={(e) => handleChange('ogImage', e.target.value)}
                          placeholder="https://example.com/og-image.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Önerilen: 1200x630 piksel</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OG Type
                        </label>
                        <select
                          value={seoData.ogType}
                          onChange={(e) => handleChange('ogType', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                          <option value="website">website</option>
                          <option value="article">article</option>
                          <option value="business.business">business</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Twitter Card
                        </label>
                        <select
                          value={seoData.twitterCard}
                          onChange={(e) => handleChange('twitterCard', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                          <option value="summary">summary</option>
                          <option value="summary_large_image">summary_large_image</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Canonical URL
                        </label>
                        <input
                          type="text"
                          value={seoData.canonicalUrl}
                          onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                          placeholder="https://nomanoglualtin.com.tr"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Robots & Verification */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FileText size={20} className="text-blue-600" />
                      <span>Robots & Doğrulama</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Robots Meta
                        </label>
                        <select
                          value={seoData.robotsContent}
                          onChange={(e) => handleChange('robotsContent', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                          <option value="index, follow">index, follow (Önerilen)</option>
                          <option value="index, nofollow">index, nofollow</option>
                          <option value="noindex, follow">noindex, follow</option>
                          <option value="noindex, nofollow">noindex, nofollow</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Google Site Verification
                        </label>
                        <input
                          type="text"
                          value={seoData.googleSiteVerification}
                          onChange={(e) => handleChange('googleSiteVerification', e.target.value)}
                          placeholder="Google doğrulama kodu"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bing Site Verification
                        </label>
                        <input
                          type="text"
                          value={seoData.bingSiteVerification}
                          onChange={(e) => handleChange('bingSiteVerification', e.target.value)}
                          placeholder="Bing doğrulama kodu"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Google Analytics */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <BarChart3 size={20} className="text-blue-600" />
                      <span>Google Analytics</span>
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google Analytics ID (GA4)
                      </label>
                      <input
                        type="text"
                        value={seoData.googleAnalyticsId}
                        onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Google Analytics 4 ölçüm ID'si. Örnek: G-ABC123XYZ
                      </p>
                    </div>
                  </div>

                  {/* Google Tag Manager */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Tag size={20} className="text-blue-600" />
                      <span>Google Tag Manager</span>
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GTM Container ID
                      </label>
                      <input
                        type="text"
                        value={seoData.googleTagManagerId}
                        onChange={(e) => handleChange('googleTagManagerId', e.target.value)}
                        placeholder="GTM-XXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Google Tag Manager container ID'si. Örnek: GTM-ABC123
                      </p>
                    </div>
                  </div>

                  {/* Meta Pixel */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Meta (Facebook) Pixel</span>
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Pixel ID
                      </label>
                      <input
                        type="text"
                        value={seoData.metaPixelId}
                        onChange={(e) => handleChange('metaPixelId', e.target.value)}
                        placeholder="123456789012345"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Facebook/Instagram reklamları için Meta Pixel ID. Örnek: 123456789012345
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scripts Tab */}
              {activeTab === 'scripts' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-800 text-sm font-medium">Dikkat!</p>
                        <p className="text-amber-700 text-sm">
                          Buraya eklenen kodlar doğrudan sayfaya enjekte edilir. Sadece güvendiğiniz kaynaklardan kod ekleyin.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Head Scripts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Head Script'leri (&lt;head&gt; içine)
                    </label>
                    <textarea
                      value={seoData.headScripts}
                      onChange={(e) => handleChange('headScripts', e.target.value)}
                      placeholder="<!-- Örnek: Tawk.to, Hotjar, vb. -->"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chat widget'ları, heatmap araçları vb. için script'ler
                    </p>
                  </div>

                  {/* Body Start Scripts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Başlangıç Script'leri (&lt;body&gt; açılışında)
                    </label>
                    <textarea
                      value={seoData.bodyStartScripts}
                      onChange={(e) => handleChange('bodyStartScripts', e.target.value)}
                      placeholder="<!-- Örnek: Google Tag Manager noscript -->"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      GTM noscript veya benzeri kodlar için
                    </p>
                  </div>

                  {/* Body End Scripts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Bitiş Script'leri (&lt;/body&gt; öncesinde)
                    </label>
                    <textarea
                      value={seoData.bodyEndScripts}
                      onChange={(e) => handleChange('bodyEndScripts', e.target.value)}
                      placeholder="<!-- Örnek: Custom tracking scripts -->"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sayfa yüklendikten sonra çalışacak script'ler
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
