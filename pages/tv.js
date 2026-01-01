import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { TrendingUp, TrendingDown, RefreshCw, ArrowLeft } from 'lucide-react';

export default function TVDisplay() {
  const { prices: websocketPrices, isConnected } = useWebSocket();
  const { logoBase64, faviconBase64 } = useSettings();
  const [prices, setPrices] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [orientation, setOrientation] = useState('landscape'); // landscape veya portrait
  const [currentTime, setCurrentTime] = useState('');
  const [showBackLink, setShowBackLink] = useState(true); // Siteye dön linki görünürlüğü

  // Custom fiyatları filtrele
  useEffect(() => {
    if (websocketPrices && websocketPrices.length > 0) {
      const customPrices = websocketPrices.filter(p => p.isCustom === true);
      if (customPrices.length > 0) {
        setPrices(customPrices);
        setLastUpdate(new Date());
      }
    }
  }, [websocketPrices]);

  // Saat güncelleme
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ekran yönünü algıla
  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // URL parametresinden mod al
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'portrait' || mode === 'landscape') {
      setOrientation(mode);
    }

    // Her 6 saatte bir sayfayı yenile (21600000 ms = 6 saat)
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Mouse/touch hareketi ile "Siteye Dön" linkini göster/gizle
  useEffect(() => {
    let hideTimeout;

    const showLink = () => {
      setShowBackLink(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setShowBackLink(false);
      }, 5000); // 5 saniye sonra gizle
    };

    // İlk yüklemede 5 saniye sonra gizle
    hideTimeout = setTimeout(() => {
      setShowBackLink(false);
    }, 5000);

    // Event listeners
    window.addEventListener('mousemove', showLink);
    window.addEventListener('touchstart', showLink);
    window.addEventListener('click', showLink);

    return () => {
      clearTimeout(hideTimeout);
      window.removeEventListener('mousemove', showLink);
      window.removeEventListener('touchstart', showLink);
      window.removeEventListener('click', showLink);
    };
  }, []);

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    return lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Portrait modda 2 sütun halinde göster
  const isPortrait = orientation === 'portrait';

  // Fiyatları 2 sütuna böl (portrait mod için)
  const halfIndex = Math.ceil(prices.length / 2);
  const leftColumn = prices.slice(0, halfIndex);
  const rightColumn = prices.slice(halfIndex);

  return (
    <>
      <Head>
        <title>Canlı Fiyatlar - TV Gösterimi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <style>{`
          html, body {
            overflow: hidden;
            margin: 0;
            padding: 0;
            background: #f7de00;
          }

          /* TV için optimize edilmiş font boyutları */
          .tv-text-xs { font-size: clamp(0.75rem, 1.5vmin, 1rem); }
          .tv-text-sm { font-size: clamp(0.875rem, 2vmin, 1.25rem); }
          .tv-text-base { font-size: clamp(1rem, 2.5vmin, 1.5rem); }
          .tv-text-lg { font-size: clamp(1.25rem, 3vmin, 2rem); }
          .tv-text-xl { font-size: clamp(1.5rem, 3.5vmin, 2.5rem); }
          .tv-text-2xl { font-size: clamp(2rem, 4vmin, 3rem); }

          /* Portrait mod için */
          .portrait .tv-text-xs { font-size: clamp(0.6rem, 1.2vmin, 0.875rem); }
          .portrait .tv-text-sm { font-size: clamp(0.75rem, 1.5vmin, 1rem); }
          .portrait .tv-text-base { font-size: clamp(0.875rem, 1.8vmin, 1.25rem); }
          .portrait .tv-text-lg { font-size: clamp(1rem, 2vmin, 1.5rem); }

          /* Tabular nums for price alignment */
          .tabular-nums {
            font-variant-numeric: tabular-nums;
          }

          /* Fiyat değişim animasyonu */
          @keyframes priceFlash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .price-flash {
            animation: priceFlash 0.3s ease-out;
          }

          /* Siteye Dön linki animasyonu */
          .back-link {
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          .back-link.hidden {
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
          }
          .back-link.visible {
            opacity: 1;
            transform: translateY(0);
          }
        `}</style>
      </Head>

      <div className={`h-screen w-screen flex flex-col bg-[#f7de00] ${isPortrait ? 'portrait' : ''}`}>
        {/* Header */}
        <header className="flex-shrink-0 bg-[#f7de00] px-[2vmin] py-[1.5vmin]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              {logoBase64 ? (
                <img
                  src={logoBase64}
                  alt="Logo"
                  className="object-contain"
                  style={{ height: isPortrait ? '6vmin' : '8vmin', maxHeight: '80px' }}
                />
              ) : (
                <span className="tv-text-2xl font-bold text-gray-900 tracking-tight">NOMANOĞLU</span>
              )}
            </div>

            {/* Saat ve Bağlantı Durumu */}
            <div className="flex items-center space-x-[2vmin]">
              {/* Son Güncelleme */}
              <div className="text-right">
                <p className="tv-text-xs text-gray-700 opacity-80">Son Güncelleme</p>
                <p className="tv-text-lg font-bold text-gray-900">{formatLastUpdate()}</p>
              </div>

              {/* Refresh İkonu */}
              <div className="p-[1vmin]">
                <RefreshCw className="text-gray-900" style={{ width: '3vmin', height: '3vmin' }} />
              </div>

              {/* Siteye Dön Linki */}
              <Link
                href="/"
                className={`back-link ${showBackLink ? 'visible' : 'hidden'} flex items-center space-x-[1vmin] px-[2vmin] py-[1vmin] bg-gray-900 text-white rounded-[1vmin] hover:bg-gray-800 transition-colors`}
                style={{ fontSize: 'clamp(0.75rem, 1.5vmin, 1rem)' }}
              >
                <ArrowLeft style={{ width: '2vmin', height: '2vmin' }} />
                <span className="font-medium">Siteye Dön</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Fiyat Tablosu */}
        <main className="flex-1 overflow-hidden px-[2vmin] pb-[2vmin]">
          {prices.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-[8vmin] h-[8vmin] border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-[2vmin]" />
                <p className="tv-text-lg text-gray-900">Fiyatlar yükleniyor...</p>
              </div>
            </div>
          ) : isPortrait ? (
            /* Portrait Mod - 2 Sütun */
            <div className="h-full grid grid-cols-2 gap-[1.5vmin]">
              {/* Sol Sütun */}
              <div className="bg-white rounded-[1vmin] overflow-hidden flex flex-col">
                <table className="w-full table-fixed flex-1">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="text-left py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[45%]">Ürün</th>
                      <th className="text-right py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[27.5%]">Alış</th>
                      <th className="text-right py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[27.5%]">Satış</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leftColumn.map((price, index) => {
                      const isRising = price.direction?.alis_dir === 'up' || price.direction?.satis_dir === 'up';
                      const isFalling = price.direction?.alis_dir === 'down' || price.direction?.satis_dir === 'down';

                      return (
                        <tr key={price.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-[0.8vmin] px-[1.5vmin]">
                            <p className="text-gray-900 font-semibold tv-text-base truncate">{price.name}</p>
                          </td>
                          <td className="py-[0.8vmin] px-[1.5vmin] text-right">
                            <div className="flex items-center justify-end space-x-[0.5vmin]">
                              {isRising && <TrendingUp className="text-green-600" style={{ width: '2vmin', height: '2vmin' }} />}
                              {isFalling && <TrendingDown className="text-red-600" style={{ width: '2vmin', height: '2vmin' }} />}
                              <span className={`font-bold tv-text-base tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedAlis)}
                              </span>
                            </div>
                          </td>
                          <td className="py-[0.8vmin] px-[1.5vmin] text-right">
                            <span className={`font-bold tv-text-base tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(price.calculatedSatis)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sağ Sütun */}
              <div className="bg-white rounded-[1vmin] overflow-hidden flex flex-col">
                <table className="w-full table-fixed flex-1">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="text-left py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[45%]">Ürün</th>
                      <th className="text-right py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[27.5%]">Alış</th>
                      <th className="text-right py-[1vmin] px-[1.5vmin] text-white font-bold tv-text-sm w-[27.5%]">Satış</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rightColumn.map((price, index) => {
                      const isRising = price.direction?.alis_dir === 'up' || price.direction?.satis_dir === 'up';
                      const isFalling = price.direction?.alis_dir === 'down' || price.direction?.satis_dir === 'down';

                      return (
                        <tr key={price.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-[0.8vmin] px-[1.5vmin]">
                            <p className="text-gray-900 font-semibold tv-text-base truncate">{price.name}</p>
                          </td>
                          <td className="py-[0.8vmin] px-[1.5vmin] text-right">
                            <div className="flex items-center justify-end space-x-[0.5vmin]">
                              {isRising && <TrendingUp className="text-green-600" style={{ width: '2vmin', height: '2vmin' }} />}
                              {isFalling && <TrendingDown className="text-red-600" style={{ width: '2vmin', height: '2vmin' }} />}
                              <span className={`font-bold tv-text-base tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedAlis)}
                              </span>
                            </div>
                          </td>
                          <td className="py-[0.8vmin] px-[1.5vmin] text-right">
                            <span className={`font-bold tv-text-base tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(price.calculatedSatis)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Landscape Mod - Tek Tablo */
            <div className="h-full bg-white rounded-[1vmin] overflow-hidden flex flex-col">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="text-left py-[1.5vmin] px-[2vmin] text-white font-bold tv-text-lg w-[40%]">Ürün</th>
                    <th className="text-right py-[1.5vmin] px-[2vmin] text-white font-bold tv-text-lg w-[30%]">Alış</th>
                    <th className="text-right py-[1.5vmin] px-[2vmin] text-white font-bold tv-text-lg w-[30%]">Satış</th>
                  </tr>
                </thead>
              </table>
              <div className="flex-1 overflow-hidden">
                <table className="w-full table-fixed">
                  <tbody>
                    {prices.map((price, index) => {
                      const isRising = price.direction?.alis_dir === 'up' || price.direction?.satis_dir === 'up';
                      const isFalling = price.direction?.alis_dir === 'down' || price.direction?.satis_dir === 'down';

                      return (
                        <tr key={price.code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-[1.2vmin] px-[2vmin] w-[40%]">
                            <p className="text-gray-900 font-semibold tv-text-xl truncate">{price.name}</p>
                          </td>
                          <td className="py-[1.2vmin] px-[2vmin] text-right w-[30%]">
                            <div className="flex items-center justify-end space-x-[1vmin]">
                              {isRising && <TrendingUp className="text-green-600" style={{ width: '3vmin', height: '3vmin' }} />}
                              {isFalling && <TrendingDown className="text-red-600" style={{ width: '3vmin', height: '3vmin' }} />}
                              <span className={`font-bold tv-text-xl tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedAlis)}
                              </span>
                            </div>
                          </td>
                          <td className="py-[1.2vmin] px-[2vmin] text-right w-[30%]">
                            <span className={`font-bold tv-text-xl tabular-nums ${isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(price.calculatedSatis)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
