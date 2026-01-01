import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');
  const [faviconBase64, setFaviconBase64] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // İletişim Bilgileri - boş başla, API'den gelsin
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [workingHoursNote, setWorkingHoursNote] = useState('');

  // Sosyal Medya - boş başla, API'den gelsin
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');

  // SEO & Analytics
  const [seo, setSeo] = useState({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    canonicalUrl: '',
    robotsContent: 'index, follow',
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: '',
    headScripts: '',
    bodyStartScripts: '',
    bodyEndScripts: '',
    googleSiteVerification: '',
    bingSiteVerification: ''
  });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    // Settings ve SEO'yu paralel yükle
    Promise.all([
      fetch(`${apiUrl}/api/settings`).then(res => res.json()),
      fetch(`${apiUrl}/api/seo`).then(res => res.json())
    ])
      .then(([settingsData, seoData]) => {
        if (settingsData.success) {
          const s = settingsData.data;
          setLogoBase64(s.logoBase64 || '');
          setLogoHeight(s.logoHeight || 48);
          setLogoWidth(s.logoWidth || 'auto');
          setFaviconBase64(s.faviconBase64 || '');
          // İletişim bilgileri
          setContactPhone(s.contactPhone || '');
          setContactEmail(s.contactEmail || '');
          setContactAddress(s.contactAddress || '');
          setWorkingHours(s.workingHours || '');
          setWorkingHoursNote(s.workingHoursNote || '');
          // Sosyal medya
          setSocialFacebook(s.socialFacebook || '');
          setSocialTwitter(s.socialTwitter || '');
          setSocialInstagram(s.socialInstagram || '');
          setSocialYoutube(s.socialYoutube || '');
          setSocialTiktok(s.socialTiktok || '');
          setSocialWhatsapp(s.socialWhatsapp || '');
        }

        if (seoData.success && seoData.data) {
          setSeo(prev => ({ ...prev, ...seoData.data }));
        }

        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Ayarlar yükleme hatası:', err);
        setIsLoaded(true);
      });
  }, []);

  return (
    <SettingsContext.Provider value={{
      logoBase64, logoHeight, logoWidth, faviconBase64, isLoaded,
      contactPhone, contactEmail, contactAddress, workingHours, workingHoursNote,
      socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialTiktok, socialWhatsapp,
      seo
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
