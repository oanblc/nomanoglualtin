import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, MapPin, Phone, Mail, Clock, Building2, Navigation, ExternalLink, Facebook, Twitter, Instagram, Youtube, Coins } from 'lucide-react';

export default function İletişim() {
  const {
    logoBase64, logoHeight, logoWidth,
    contactPhone, contactEmail, contactAddress, workingHours,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialWhatsapp
  } = useSettings();
  const [branches, setBranches] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/branches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranches(data.data);
        }
      })
      .catch(err => console.error('Şube yükleme hatası:', err));

    const loadAlarmCount = () => {
      const savedAlarms = localStorage.getItem('priceAlarms');
      if (savedAlarms) {
        const alarms = JSON.parse(savedAlarms);
        const activeCount = alarms.filter(a => !a.triggered).length;
        setActiveAlarmsCount(activeCount);
      }
    };
    loadAlarmCount();
  }, []);

  const cities = [...new Set(branches.map(b => b.city))].sort();
  const filteredBranches = selectedCity === 'all'
    ? branches
    : branches.filter(b => b.city === selectedCity);

  return (
    <>
      <Head>
        <title>İletişim & Şubelerimiz - NOMANOĞLU Kuyumculuk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                      height: `${Math.min(logoHeight, 40)}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxWidth: '180px'
                    }}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <Coins size={20} className="text-gray-900" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">NOMANOGLU</span>
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
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Alarmlar
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Destek</span>
                  </a>
                )}

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
              <div className="md:hidden py-4 border-t border-white/30">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarmsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarmsCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                    İletişim
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">İletişim & Şubelerimiz</h1>
            <p className="text-gray-500 text-sm">Türkiye Genelinde {branches.length} Şubemizle Hizmetinizdeyiz</p>
          </div>

          {/* Filter Section */}
          {cities.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCity('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    selectedCity === 'all'
                      ? 'bg-[#f7de00] text-gray-900'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Tümü ({branches.length})
                </button>
                {cities.map(city => {
                  const count = branches.filter(b => b.city === city).length;
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                        selectedCity === city
                          ? 'bg-[#f7de00] text-gray-900'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {city} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Branches Grid */}
          {filteredBranches.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 mb-8">
              <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Şube Eklenmedi</h3>
              <p className="text-gray-500 text-sm">Admin panelinden şube ekleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredBranches.map((branch, index) => (
                <div
                  key={branch._id || index}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#f7de00] transition-colors"
                >
                  {/* Branch Header */}
                  <div className="bg-[#f7de00] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{branch.name}</h3>
                        <div className="flex items-center space-x-2 text-gray-800">
                          <MapPin size={14} />
                          <span className="text-sm font-medium">{branch.city}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                        <Building2 size={20} className="text-gray-900" />
                      </div>
                    </div>
                  </div>

                  {/* Branch Details */}
                  <div className="p-4 space-y-3">
                    {/* Address */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f7de00]/20 flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-[#b8860b]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-1">Adres</p>
                        <p className="text-gray-900 text-sm">{branch.address}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    {branch.phone && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Telefon</p>
                          <a href={`tel:${branch.phone}`} className="text-gray-900 text-sm font-semibold hover:text-green-600 transition-colors">
                            {branch.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {branch.email && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">E-posta</p>
                          <a href={`mailto:${branch.email}`} className="text-gray-900 text-sm hover:text-blue-600 transition-colors">
                            {branch.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Working Hours */}
                    {branch.workingHours && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Çalışma Saatleri</p>
                          <p className="text-gray-900 text-sm font-medium">{branch.workingHours}</p>
                        </div>
                      </div>
                    )}

                    {/* Map Link */}
                    {branch.mapLink && (
                      <a
                        href={branch.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 w-full py-2.5 bg-[#f7de00] hover:bg-[#e5cc00] text-gray-900 font-semibold rounded-lg transition-all mt-4"
                      >
                        <Navigation size={16} />
                        <span className="text-sm">Haritada Göster</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* General Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Genel İletişim</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {contactPhone && (
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#f7de00] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Phone size={24} className="text-gray-900" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Telefon</h3>
                  <a href={`tel:${contactPhone}`} className="text-gray-600 hover:text-[#b8860b] transition-colors">
                    {contactPhone}
                  </a>
                </div>
              )}

              {contactEmail && (
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#f7de00] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Mail size={24} className="text-gray-900" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">E-posta</h3>
                  <a href={`mailto:${contactEmail}`} className="text-gray-600 hover:text-[#b8860b] transition-colors">
                    {contactEmail}
                  </a>
                </div>
              )}

              {workingHours && (
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#f7de00] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-gray-900" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Çalışma Saatleri</h3>
                  <p className="text-gray-600">{workingHours}</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
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
                        height: `${Math.min(logoHeight, 40)}px`,
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                        maxWidth: '160px'
                      }}
                    />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-[#f7de00] flex items-center justify-center">
                        <Coins size={18} className="text-gray-900" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">NOMANOGLU</span>
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
                  <li><Link href="/alarms" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Alarmlar</Link></li>
                  <li><Link href="/iletisim" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">İletişim</Link></li>
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
                © 2024 Nomanoğlu Kuyumculuk. Tüm hakları saklıdır.
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
