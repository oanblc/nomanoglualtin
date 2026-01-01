import { useState, useEffect, createContext, useContext } from 'react';
import { X, Cookie, Shield } from 'lucide-react';

// Cookie consent context
const CookieConsentContext = createContext();

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(null); // null = henüz karar verilmedi
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // localStorage'dan consent durumunu oku
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent !== null) {
      setConsent(savedConsent === 'true');
    }
    setIsLoaded(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setConsent(true);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookieConsent', 'false');
    setConsent(false);
  };

  return (
    <CookieConsentContext.Provider value={{ consent, isLoaded, acceptCookies, rejectCookies }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export default function CookieConsent() {
  const { consent, isLoaded, acceptCookies, rejectCookies } = useCookieConsent();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Consent henüz verilmemişse banner'ı göster
    if (isLoaded && consent === null) {
      // Küçük bir gecikme ile göster (sayfa yüklendikten sonra)
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, consent]);

  if (!isVisible || consent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Cookie className="w-6 h-6 text-amber-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Çerez Kullanımı
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Size daha iyi bir deneyim sunmak için çerezler kullanıyoruz.
                Analitik çerezler, sitemizi nasıl kullandığınızı anlamamıza yardımcı olur.
                "Kabul Et" butonuna tıklayarak çerez kullanımını onaylayabilirsiniz.
              </p>

              {/* Privacy note */}
              <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                <Shield size={12} />
                <span>Verileriniz KVKK kapsamında korunmaktadır.</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={rejectCookies}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Reddet
              </button>
              <button
                onClick={acceptCookies}
                className="px-6 py-2.5 text-sm font-semibold text-gray-900 bg-[#f7de00] hover:bg-[#e5cc00] rounded-lg transition-colors shadow-sm"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
