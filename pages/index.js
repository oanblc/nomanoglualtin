import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import SeoHead from '../components/SeoHead';
import { Menu, Search, TrendingUp, TrendingDown, DollarSign, Euro, Coins, Gem, Star, Maximize2, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Youtube, CheckCircle, AlertCircle, X, ChevronRight, Zap, Shield, Award } from 'lucide-react';

export default function Home() {
  const { prices: websocketPrices, isConnected, lastUpdate: wsLastUpdate } = useWebSocket();
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64, priceTableImage, isLoaded: logoLoaded,
    contactPhone, contactEmail, contactAddress, workingHours, workingHoursNote,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialTiktok, socialWhatsapp
  } = useSettings();
  const [prices, setPrices] = useState([]);
  const previousPricesRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [highlightedPrices, setHighlightedPrices] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // İçerik state'leri
  const [familyCards, setFamilyCards] = useState([]);
  const [articles, setArticles] = useState([]);

  // Sayfa açıldığında cache'den fiyatları çek
  useEffect(() => {
    const fetchCachedPrices = async () => {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api/prices/cached');
        const data = await res.json();
        if (data.success && data.data?.prices?.length > 0) {
          let customPrices = data.data.prices.filter(p => p.isCustom !== false);
          // Order'a göre sırala
          customPrices = customPrices.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          if (customPrices.length > 0) {
            setPrices(customPrices);
            previousPricesRef.current = customPrices;
            setLastUpdate(new Date(data.updatedAt));
          }
        }
      } catch (error) {
        // Cache fiyat çekme hatası
      }
    };
    fetchCachedPrices();
  }, []);

  // WebSocket'ten gelen fiyatları güncelle
  useEffect(() => {
    // Geçersiz veri gelirse mevcut fiyatları koru
    if (!websocketPrices || !Array.isArray(websocketPrices) || websocketPrices.length === 0) {
      // Önceki fiyatlar varsa onları koru, yoksa hiçbir şey yapma
      if (previousPricesRef.current.length > 0 && prices.length === 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    let customPrices = websocketPrices.filter(p => p.isCustom === true);

    // Custom fiyat yoksa mevcut fiyatları koru
    if (customPrices.length === 0) {
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    // Order'a göre sırala
    customPrices = customPrices.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Fiyat değişikliklerini kontrol et ve highlight yap
    const newHighlighted = {};
    customPrices.forEach(newPrice => {
      const oldPrice = previousPricesRef.current.find(p => p.code === newPrice.code);
      if (oldPrice && (oldPrice.calculatedAlis !== newPrice.calculatedAlis || oldPrice.calculatedSatis !== newPrice.calculatedSatis)) {
        newHighlighted[newPrice.code] = true;
        setTimeout(() => {
          setHighlightedPrices(prev => ({ ...prev, [newPrice.code]: false }));
        }, 1000);
      }
    });

    if (Object.keys(newHighlighted).length > 0) {
      setHighlightedPrices(prev => ({ ...prev, ...newHighlighted }));
    }

    // Yeni fiyatları kaydet
    setPrices(customPrices);
    previousPricesRef.current = customPrices;
    setLastUpdate(new Date());
  }, [websocketPrices]);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/family-cards')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFamilyCards(data.data || []);
        }
      })
      .catch(() => {});

    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticles(data.data || []);
        }
      })
      .catch(() => {});

    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/branches')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setBranches(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Canlı saat güncellemesi
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (value, decimals = 0) => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };


  const getIconForFamily = (iconName, size = 16) => {
    switch(iconName) {
      case 'TrendingUp': return <TrendingUp size={size} strokeWidth={2} />;
      case 'CheckCircle': return <CheckCircle size={size} strokeWidth={2} />;
      case 'Star': return <Star size={size} strokeWidth={2} />;
      case 'Coins': return <Coins size={size} strokeWidth={2} />;
      default: return <TrendingUp size={size} strokeWidth={2} />;
    }
  };

  const getIconForArticle = (iconName, size = 20) => {
    switch(iconName) {
      case 'Coins': return <Coins size={size} strokeWidth={2} />;
      case 'Gem': return <Gem size={size} strokeWidth={2} />;
      case 'TrendingUp': return <TrendingUp size={size} strokeWidth={2} />;
      case 'CheckCircle': return <CheckCircle size={size} strokeWidth={2} />;
      case 'Star': return <Star size={size} strokeWidth={2} />;
      case 'DollarSign': return <DollarSign size={size} strokeWidth={2} />;
      default: return <Coins size={size} strokeWidth={2} />;
    }
  };

  return (
    <>
      <SeoHead />
      <Head>
        <style>{`
          @keyframes pulse-gold {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-pulse-gold { animation: pulse-gold 2s ease-in-out infinite; }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
          .price-flash { animation: price-highlight 0.8s ease-out; }
          @keyframes price-highlight {
            0% { background-color: rgba(247, 222, 0, 0.3); }
            50% { background-color: rgba(247, 222, 0, 0.15); }
            100% { background-color: transparent; }
          }

          /* Custom scrollbar */
          .custom-scrollbar::-webkit-scrollbar { width: 10px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cfd5dd;
            border-radius: 999px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #b0b7c3; }

          /* Fullscreen mode */
          #price-table-container:fullscreen { background: #fafafa; padding: 1.5rem; }
          #price-table-container:fullscreen .fullscreen-hide { display: none !important; }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header - Gold Theme */}
        <header className="sticky top-0 z-50 bg-[#F3BA1C]">
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
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`
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
                <Link href="/" className="px-4 py-2 text-base font-normal text-gray-900 bg-white/30 rounded-lg">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="px-4 py-2 text-base font-normal text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Piyasalar
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-base font-normal text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {/* WhatsApp Button */}
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-base font-normal rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Destek</span>
                  </a>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-900 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/30 animate-slide-up">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    İletişim
                  </Link>
                </nav>

                {/* Mobile WhatsApp */}
                {socialWhatsapp && (
                  <div className="mt-4 pt-4 border-t border-white/30">
                    <a
                      href={`https://wa.me/${socialWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>WhatsApp Destek</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Price Table - New Design */}
          <div id="price-table-container" className="mb-8">
            {prices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#b88a2b] rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Fiyatlar yükleniyor...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
                {/* Sol - Fiyat Tablosu */}
                <section className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6 pb-4 sm:p-6 sm:pb-4 px-2">
                  <h2 className="text-center text-[22px] tracking-[0.08em] text-[#111827] font-normal mb-3">
                    ALTIN FİYATLARI
                  </h2>
                  <div className="h-px bg-[#e9ecef] mb-3"></div>

                  <div className="h-[470px] overflow-auto border-t border-[#e9ecef] custom-scrollbar">
                    {/* Desktop Table */}
                    <table className="w-full border-collapse table-fixed hidden sm:table">
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[23%]" />
                        <col className="w-[23%]" />
                        <col className="w-[24%]" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="py-3.5 px-1.5 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                            {currentTime}
                          </th>
                          <th className="py-3.5 px-1.5 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                            Alış
                          </th>
                          <th className="py-3.5 px-1.5 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                            Satış
                          </th>
                          <th className="py-3.5 px-1.5 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                            Fark
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prices.map((price) => {
                          const isHighlighted = highlightedPrices[price.code];
                          const spread = price.calculatedSatis && price.calculatedAlis
                            ? ((price.calculatedSatis - price.calculatedAlis) / price.calculatedAlis * 100)
                            : 0;
                          const dirUp = price.direction?.alis_dir === 'up' || price.direction?.satis_dir === 'up';
                          const dirDown = price.direction?.alis_dir === 'down' || price.direction?.satis_dir === 'down';

                          return (
                            <tr
                              key={price.code}
                              className={`transition-all duration-200 hover:bg-[#F3BA1C]/10 ${isHighlighted ? 'price-flash' : ''}`}
                            >
                              <td className="py-2.5 px-1.5 border-b border-[#e9ecef] align-middle">
                                <div className="font-bold text-lg text-[#111827] tracking-wide uppercase">
                                  {price.name}
                                </div>
                                <div className="mt-1 text-sm text-[#9aa0a6] font-normal uppercase">
                                  {price.code}
                                </div>
                              </td>
                              <td className="py-2.5 px-1.5 border-b border-[#e9ecef] align-middle">
                                <span className="text-[22px] font-normal text-[#111827] whitespace-nowrap">
                                  {formatPrice(price.calculatedAlis, price.decimals)}
                                </span>
                              </td>
                              <td className="py-2.5 px-1.5 border-b border-[#e9ecef] align-middle">
                                <span className="text-[22px] font-normal text-[#111827] whitespace-nowrap">
                                  {formatPrice(price.calculatedSatis, price.decimals)}
                                </span>
                              </td>
                              <td className="py-2.5 px-1.5 border-b border-[#e9ecef] align-middle">
                                <span className={`text-lg font-medium whitespace-nowrap ${
                                  dirUp ? 'text-[#23a455]' : dirDown ? 'text-red-500' : 'text-[#23a455]'
                                }`}>
                                  <span className="mr-1.5">{dirUp ? '↑' : dirDown ? '↓' : '↑'}</span>
                                  %{spread.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Mobile Table */}
                    <div className="sm:hidden">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="py-2.5 px-1.5 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">{currentTime}</th>
                            <th className="py-2.5 px-1.5 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">Alış</th>
                            <th className="py-2.5 px-1.5 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">Satış</th>
                            <th className="py-2.5 px-1.5 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">Fark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prices.map((price) => {
                            const isHighlighted = highlightedPrices[price.code];
                            const spread = price.calculatedSatis && price.calculatedAlis
                              ? ((price.calculatedSatis - price.calculatedAlis) / price.calculatedAlis * 100)
                              : 0;
                            const dirUp = price.direction?.alis_dir === 'up' || price.direction?.satis_dir === 'up';
                            const dirDown = price.direction?.alis_dir === 'down' || price.direction?.satis_dir === 'down';

                            return (
                              <tr key={price.code} className={`${isHighlighted ? 'price-flash' : ''}`}>
                                <td className="py-2.5 px-1.5 border-b border-[#e9ecef] text-base font-bold text-[#111827] uppercase leading-tight">{price.name}</td>
                                <td className="py-2.5 px-1.5 border-b border-[#e9ecef] text-base text-[#111827] text-right whitespace-nowrap">{formatPrice(price.calculatedAlis, price.decimals)}</td>
                                <td className="py-2.5 px-1.5 border-b border-[#e9ecef] text-base text-[#111827] text-right whitespace-nowrap">{formatPrice(price.calculatedSatis, price.decimals)}</td>
                                <td className={`py-2.5 px-1.5 border-b border-[#e9ecef] text-sm text-right font-semibold whitespace-nowrap ${dirUp ? 'text-[#23a455]' : dirDown ? 'text-red-500' : 'text-[#23a455]'}`}>
                                  {dirUp ? '↑' : dirDown ? '↓' : '↑'}%{spread.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Sağ - Görsel (Mobilde gizli) */}
                <aside className="hidden lg:block bg-white rounded-[10px] overflow-hidden h-[570px]">
                  {priceTableImage ? (
                    <img
                      src={priceTableImage}
                      alt="Altın"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1610371316114-2bb0104a0f74?auto=format&fit=crop&w=1200&q=70"
                      alt="Altın"
                      className="w-full h-full object-cover"
                    />
                  )}
                </aside>
              </div>
            )}

            {/* TV Gösterimi Button */}
            {prices.length > 0 && (
              <div className="mt-6 text-center fullscreen-hide">
                <Link
                  href="/tv"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all"
                >
                  <Maximize2 size={18} />
                  <span className="text-sm font-medium">TV Gösterimi</span>
                </Link>
              </div>
            )}
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 fullscreen-hide">
            {/* Contact Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3BA1C]/20 flex items-center justify-center">
                  <Phone size={16} className="text-[#b8860b]" />
                </div>
                <span>İletişim</span>
              </h3>
              <div className="space-y-3">
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">{contactPhone}</span>
                  </a>
                )}
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">{contactEmail}</span>
                  </a>
                )}
                {workingHours && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">{workingHours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Card with Slider */}
            {branches.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-bold flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F3BA1C]/20 flex items-center justify-center">
                      <MapPin size={16} className="text-[#b8860b]" />
                    </div>
                    <span>Şubelerimiz</span>
                  </h3>
                  {branches.length > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentBranchIndex(prev => prev === 0 ? branches.length - 1 : prev - 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight size={18} className="text-gray-400 rotate-180" />
                      </button>
                      <span className="text-xs text-gray-400 min-w-[40px] text-center">
                        {currentBranchIndex + 1}/{branches.length}
                      </span>
                      <button
                        onClick={() => setCurrentBranchIndex(prev => prev === branches.length - 1 ? 0 : prev + 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight size={18} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900 font-semibold text-sm">{branches[currentBranchIndex]?.name}</p>
                  <p className="text-gray-500 text-sm line-clamp-2">{branches[currentBranchIndex]?.address}</p>
                  {branches[currentBranchIndex]?.phone && (
                    <a
                      href={`tel:${branches[currentBranchIndex].phone}`}
                      className="flex items-center space-x-1 text-gray-600 text-sm hover:text-gray-900"
                    >
                      <Phone size={12} />
                      <span>{branches[currentBranchIndex].phone}</span>
                    </a>
                  )}
                  {branches[currentBranchIndex]?.mapLink && (
                    <a
                      href={branches[currentBranchIndex].mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-[#b8860b] text-sm font-medium hover:underline"
                    >
                      <span>Yol Tarifi</span>
                      <ChevronRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Media Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-gray-900 font-bold mb-4">Bizi Takip Edin</h3>
              <div className="flex items-center space-x-2">
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-pink-100 flex items-center justify-center transition-colors group">
                    <Instagram size={18} className="text-gray-500 group-hover:text-pink-600" />
                  </a>
                )}
                {socialTiktok && (
                  <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group">
                    <svg className="w-[18px] h-[18px] text-gray-500 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                )}
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors group">
                    <Facebook size={18} className="text-gray-500 group-hover:text-blue-600" />
                  </a>
                )}
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-sky-100 flex items-center justify-center transition-colors group">
                    <Twitter size={18} className="text-gray-500 group-hover:text-sky-500" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-[#F3BA1C]/10 border border-[#F3BA1C]/30 rounded-2xl p-6 sm:p-8 mb-8 fullscreen-hide">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                NOMANOĞLU <span className="text-[#b8860b]">Ailesi</span>
              </h2>
              <p className="text-gray-600 text-sm">Yarım asrı aşkın tecrübesiyle, altına dair her şey.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {familyCards.length > 0 ? (
                familyCards.map((card) => (
                  <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F3BA1C] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#F3BA1C] flex items-center justify-center mb-4">
                      <span className="text-gray-900">{getIconForFamily(card.icon, 22)}</span>
                    </div>
                    <p className="text-[#b8860b] text-xs font-semibold uppercase tracking-wider mb-2">{card.label}</p>
                    <h3 className="text-gray-900 font-bold mb-2">{card.title}</h3>
                    <p className="text-gray-500 text-sm">{card.description}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F3BA1C] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#F3BA1C] flex items-center justify-center mb-4">
                      <Award size={22} className="text-gray-900" />
                    </div>
                    <p className="text-[#b8860b] text-xs font-semibold uppercase tracking-wider mb-2">1967'den Beri</p>
                    <h3 className="text-gray-900 font-bold mb-2">Yarım Asırlık Deneyim</h3>
                    <p className="text-gray-500 text-sm">1967'den bugüne güvenilir ve kaliteli hizmet.</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F3BA1C] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#F3BA1C] flex items-center justify-center mb-4">
                      <Shield size={22} className="text-gray-900" />
                    </div>
                    <p className="text-[#b8860b] text-xs font-semibold uppercase tracking-wider mb-2">Geniş Ağ</p>
                    <h3 className="text-gray-900 font-bold mb-2">19 Mağaza, 6 Üretim</h3>
                    <p className="text-gray-500 text-sm">Türkiye genelinde yaygın hizmet ağı.</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F3BA1C] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[#F3BA1C] flex items-center justify-center mb-4">
                      <Zap size={22} className="text-gray-900" />
                    </div>
                    <p className="text-[#b8860b] text-xs font-semibold uppercase tracking-wider mb-2">Global Pazar</p>
                    <h3 className="text-gray-900 font-bold mb-2">Uluslararası İhracat</h3>
                    <p className="text-gray-500 text-sm">Birçok ülkeye kaliteli ürün ihracatı.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Articles Section */}
          {articles.length > 0 && (
            <div className="mb-8 fullscreen-hide">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bilgi & Rehber</h2>
                <Link href="/articles" className="text-[#b8860b] text-sm font-medium hover:underline flex items-center space-x-1">
                  <span>Tümünü Gör</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {articles.slice(0, 4).map((article) => (
                  <Link key={article.id} href={`/articles/${article.id}`}>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#F3BA1C] transition-all cursor-pointer group h-full">
                      <div className="w-10 h-10 rounded-lg bg-[#F3BA1C]/20 flex items-center justify-center mb-4">
                        <span className="text-[#b8860b]">{getIconForArticle(article.icon, 20)}</span>
                      </div>
                      <p className="text-[#b8860b] text-xs font-semibold uppercase tracking-wider mb-2">{article.category}</p>
                      <h3 className="text-gray-900 font-semibold text-sm mb-2 group-hover:text-[#b8860b] transition-colors">{article.title}</h3>
                      <p className="text-gray-500 text-xs line-clamp-2">{article.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 fullscreen-hide">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs leading-relaxed">
                Burada yer alan fiyatlar bilgi amaçlıdır ve yatırım danışmanlığı kapsamında değildir.
                Fiyatlar gerçek zamanlı olarak güncellenmekte olup, işlem yapmadan önce şubelerimizle iletişime geçmenizi öneririz.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 fullscreen-hide">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  {logoBase64 ? (
                    <img
                      src={logoBase64}
                      alt="Logo"
                      className="object-contain"
                      style={{
                        height: `${Math.min(logoHeight, 50)}px`,
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`
                      }}
                    />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-[#F3BA1C] flex items-center justify-center">
                        <Coins size={18} className="text-gray-900" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">NOMANOĞLU</span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  1967'den bu yana güvenilir kuyumculuk hizmeti.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">Hızlı Linkler</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Fiyatlar</Link></li>
                  <li><Link href="/piyasalar" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Piyasalar</Link></li>
                  <li><Link href="/iletisim" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">İletişim</Link></li>
                  <li><Link href="/gizlilik-politikasi" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Gizlilik Politikası</Link></li>
                  <li><Link href="/kullanim-kosullari" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Kullanım Koşulları</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">İletişim</h4>
                <ul className="space-y-2">
                  {contactPhone && (
                    <li>
                      <a href={`tel:${contactPhone}`} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                        {contactPhone}
                      </a>
                    </li>
                  )}
                  {contactEmail && (
                    <li>
                      <a href={`mailto:${contactEmail}`} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                        {contactEmail}
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {/* App Download */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">Mobil Uygulama</h4>
                <div className="flex flex-col space-y-2">
                  <a href="#" className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="text-white text-xs font-medium">App Store</span>
                  </a>
                  <a href="#" className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm10.84-8.5l2.64-2.64 4.37 2.52c.5.29.5 1.05 0 1.34l-4.37 2.52L13.84 12zM3.85 3.65L13.69 12 3.85 20.35V3.65z"/>
                    </svg>
                    <span className="text-white text-xs font-medium">Google Play</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-xs">
                © {new Date().getFullYear()} Nomanoğlu Kuyumculuk. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center space-x-4">
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Facebook size={18} />
                  </a>
                )}
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors">
                    <Twitter size={18} />
                  </a>
                )}
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                    <Instagram size={18} />
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
