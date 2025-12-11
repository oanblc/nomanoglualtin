import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  // İletişim Bilgileri
  const [contactPhone, setContactPhone] = useState('+90 (XXX) XXX XX XX');
  const [contactEmail, setContactEmail] = useState('info@nomanoglu.com');
  const [contactAddress, setContactAddress] = useState('Istanbul, Turkiye');
  const [workingHours, setWorkingHours] = useState('Pzt - Cmt: 09:00 - 19:00');
  const [workingHoursNote, setWorkingHoursNote] = useState('Pazar: Kapali');

  // Sosyal Medya
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('905322904601');

  useEffect(() => {
    // Ayarları sadece bir kez yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const s = data.data;
          setLogoBase64(s.logoBase64 || '');
          setLogoHeight(s.logoHeight || 48);
          setLogoWidth(s.logoWidth || 'auto');
          // İletişim bilgileri
          setContactPhone(s.contactPhone || '+90 (XXX) XXX XX XX');
          setContactEmail(s.contactEmail || 'info@nomanoglu.com');
          setContactAddress(s.contactAddress || 'Istanbul, Turkiye');
          setWorkingHours(s.workingHours || 'Pzt - Cmt: 09:00 - 19:00');
          setWorkingHoursNote(s.workingHoursNote || 'Pazar: Kapali');
          // Sosyal medya
          setSocialFacebook(s.socialFacebook || '');
          setSocialTwitter(s.socialTwitter || '');
          setSocialInstagram(s.socialInstagram || '');
          setSocialYoutube(s.socialYoutube || '');
          setSocialWhatsapp(s.socialWhatsapp || '905322904601');
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
      logoBase64, logoHeight, logoWidth, isLoaded,
      contactPhone, contactEmail, contactAddress, workingHours, workingHoursNote,
      socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialWhatsapp
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
