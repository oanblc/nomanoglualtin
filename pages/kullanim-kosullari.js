import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, ArrowLeft, Coins, FileText } from 'lucide-react';

export default function TermsOfService() {
  const { logoBase64, logoHeight, logoWidth } = useSettings();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/api/legal/terms`);
        const data = await response.json();
        if (data.success) {
          setPageData(data.data);
        }
      } catch (error) {
        console.error('Sayfa yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Head>
        <title>Kullanım Koşulları | Nomanoğlu Kuyumculuk</title>
        <meta name="description" content="Nomanoğlu Kuyumculuk web sitesi ve mobil uygulama kullanım koşulları." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#f7de00]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Logo"
                    className="object-contain"
                    style={{
                      height: `${logoHeight}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxHeight: '80px'
                    }}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Coins size={20} className="text-gray-900" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">NOMANOĞLU</span>
                  </div>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Piyasalar
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-900 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/30">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    İletişim
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={18} />
            <span>Ana Sayfaya Dön</span>
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f7de00] rounded-full animate-spin" />
            </div>
          ) : pageData ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Page Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f7de00] rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-gray-900" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{pageData.title}</h1>
                    {pageData.lastUpdated && (
                      <p className="text-sm text-gray-500 mt-1">Son güncelleme: {pageData.lastUpdated}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div
                className="px-6 py-8 prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Sayfa bulunamadı.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-xs">
                © {new Date().getFullYear()} Nomanoğlu Kuyumculuk. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/gizlilik-politikasi" className="text-gray-500 hover:text-gray-900 text-xs transition-colors">
                  Gizlilik Politikası
                </Link>
                <Link href="/kullanim-kosullari" className="text-gray-500 hover:text-gray-900 text-xs transition-colors">
                  Kullanım Koşulları
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
