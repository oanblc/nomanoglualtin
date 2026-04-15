import { useEffect, useState, useRef, useMemo } from 'react';
import Head from 'next/head';
import axios from 'axios';
import io from 'socket.io-client';
import { LogOut, Lock, Coins } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '../contexts/SettingsContext';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

const formatPrice = (v, decimals = 2) => {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return Number(v).toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export default function IsletmeFiyatlari() {
  const { logoBase64, logoHeight, logoWidth } = useSettings();
  const [status, setStatus] = useState('checking');
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [highlighted, setHighlighted] = useState({});
  const prevPricesRef = useRef([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('businessToken') : null;
    if (!t) { setStatus('login'); return; }
    axios.get(`${apiUrl}/api/business/verify`, { headers: { Authorization: `Bearer ${t}` } })
      .then(() => { setToken(t); setStatus('ready'); })
      .catch(() => { localStorage.removeItem('businessToken'); setStatus('login'); });
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !token) return;
    axios.get(`${apiUrl}/api/business/prices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (res.data.success) setPrices(res.data.data || []); })
      .catch(() => {});
  }, [status, token]);

  useEffect(() => {
    if (status !== 'ready' || !token) return;
    const socket = io(wsUrl, { transports: ['websocket', 'polling'], reconnection: true });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinBusinessRoom', token);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('businessPriceUpdate', (data) => {
      if (!data?.prices) return;
      const newHL = {};
      data.prices.forEach(np => {
        const old = prevPricesRef.current.find(p => p.code === np.code);
        if (old && (old.businessAlis !== np.businessAlis || old.businessSatis !== np.businessSatis)) {
          newHL[np.code] = true;
          setTimeout(() => setHighlighted(prev => ({ ...prev, [np.code]: false })), 1000);
        }
      });
      if (Object.keys(newHL).length > 0) setHighlighted(prev => ({ ...prev, ...newHL }));
      setPrices(data.prices);
      prevPricesRef.current = data.prices;
    });
    return () => socket.close();
  }, [status, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/business/login`, { password });
      if (res.data.success) {
        localStorage.setItem('businessToken', res.data.token);
        setToken(res.data.token);
        setPassword('');
        setStatus('ready');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('businessToken');
    setToken(null);
    setPrices([]);
    setStatus('login');
  };

  const sorted = useMemo(() => [...prices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), [prices]);

  if (status === 'checking') {
    return (
      <>
        <Head><title>İşletme Fiyatları</title><meta name="robots" content="noindex, nofollow" /></Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#b88a2b] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (status === 'login') {
    return (
      <>
        <Head><title>İşletme Girişi</title><meta name="robots" content="noindex, nofollow" /></Head>
        <div className="min-h-screen bg-gray-50">
          <header className="sticky top-0 z-50 bg-[#F3BA1C]">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-20">
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
                    <>
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Coins size={20} className="text-gray-900" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 tracking-tight">NOMANOĞLU</span>
                    </>
                  )}
                </Link>
                <span className="text-sm font-medium text-gray-800">İşletme Girişi</span>
              </div>
            </div>
          </header>

          <main className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-8">
              <h2 className="text-center text-[22px] tracking-[0.08em] text-[#111827] font-normal mb-1">
                İŞLETME FİYATLARI
              </h2>
              <p className="text-center text-sm text-[#9aa0a6] mb-6">Şube içi özel erişim</p>
              <div className="h-px bg-[#e9ecef] mb-6"></div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b0b7c3]" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="İşletme şifresi"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#e9ecef] rounded-lg text-[#111827] placeholder-[#b0b7c3] focus:border-[#F3BA1C] focus:ring-2 focus:ring-[#F3BA1C]/20 focus:outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#F3BA1C] hover:bg-[#d9a418] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-[#9aa0a6] mt-6">
              Şifre admin panelinden belirlenir. Bu sayfa arama motorlarında indekslenmez.
            </p>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>İşletme Fiyatları</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header — mobilde kompakt, desktop'ta ana sayfadaki gibi */}
        <header className="sticky top-0 z-50 bg-[#F3BA1C]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between h-12 sm:h-20">
              <Link href="/" className="flex items-center space-x-2">
                {logoBase64 ? (
                  <>
                    <img
                      src={logoBase64}
                      alt="Logo"
                      className="object-contain max-h-8 sm:max-h-none"
                      style={{
                        height: `${logoHeight}px`,
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`
                      }}
                    />
                    <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-700 animate-pulse' : 'bg-red-700'}`}></span>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Coins size={14} className="text-gray-900 sm:hidden" />
                      <Coins size={20} className="text-gray-900 hidden sm:block" />
                    </div>
                    <span className="text-sm sm:text-xl font-bold text-gray-900 tracking-tight">NOMANOĞLU</span>
                    <span className="sm:hidden w-1 h-1 bg-gray-900/40 rounded-full mx-1"></span>
                    <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-700 animate-pulse' : 'bg-red-700'}`}></span>
                  </>
                )}
              </Link>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg">
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-700 animate-pulse' : 'bg-red-700'}`}></span>
                  <span className="text-xs font-medium text-gray-900">{connected ? 'Canlı' : 'Bağlantı yok'}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-4 py-1 sm:py-2 bg-white/30 hover:bg-white/40 text-gray-900 text-xs sm:text-sm font-medium rounded sm:rounded-lg transition-colors"
                >
                  <LogOut size={12} className="sm:hidden" />
                  <LogOut size={16} className="hidden sm:block" />
                  <span>Çıkış</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ===== MOBİL — KOMPAKT ===== */}
        <main className="sm:hidden max-w-3xl mx-auto px-2 py-2">
          <section className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-[#e9ecef]">
              <h2 className="text-xs tracking-[0.08em] text-[#111827] font-semibold uppercase">İşletme Fiyatları</h2>
              <span className="text-[11px] text-[#9aa0a6] tabular-nums">{currentTime}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 bg-[#fafbfc] border-b border-[#e9ecef] text-[11px] text-[#b0b7c3] font-medium uppercase tracking-wider">
              <div>Ürün</div>
              <div className="text-right w-[72px]">Alış</div>
              <div className="text-right w-[72px]">Satış</div>
            </div>

            {sorted.length === 0 && (
              <div className="py-10 text-center text-[#9aa0a6] text-sm">Fiyat bekleniyor...</div>
            )}
            {sorted.map((p, idx) => (
              <div
                key={p.code}
                className={`grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 items-center transition-colors ${
                  idx !== sorted.length - 1 ? 'border-b border-[#f3f4f6]' : ''
                } ${highlighted[p.code] ? 'bg-[#F3BA1C]/20' : ''}`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] text-[#111827] tracking-wide uppercase truncate leading-tight">
                    {p.name}
                  </div>
                </div>
                <div className="w-[72px] text-right text-[15px] font-medium text-[#111827] tabular-nums leading-tight">
                  {formatPrice(p.businessAlis, p.decimals ?? 2)}
                </div>
                <div className="w-[72px] text-right text-[15px] font-medium text-[#111827] tabular-nums leading-tight">
                  {formatPrice(p.businessSatis, p.decimals ?? 2)}
                </div>
              </div>
            ))}
          </section>
        </main>

        {/* ===== DESKTOP — ANA SAYFA TASARIMI ===== */}
        <main className="hidden sm:block max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
            <section className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6 pb-4 px-2">
              <h2 className="text-center text-[22px] tracking-[0.08em] text-[#111827] font-normal mb-3">
                İŞLETME FİYATLARI
              </h2>
              <div className="h-px bg-[#e9ecef] mb-3"></div>

              <div className="overflow-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[30%]" />
                    <col className="w-[30%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="py-3.5 px-3 text-left text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                        {currentTime}
                      </th>
                      <th className="py-3.5 px-3 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                        Alış
                      </th>
                      <th className="py-3.5 px-3 text-right text-[#b0b7c3] font-normal text-sm border-b border-[#e9ecef] bg-white sticky top-0 z-10">
                        Satış
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 && (
                      <tr><td colSpan={3} className="py-16 text-center text-[#9aa0a6]">Fiyat bekleniyor...</td></tr>
                    )}
                    {sorted.map(p => (
                      <tr
                        key={p.code}
                        className={`transition-all duration-200 hover:bg-[#F3BA1C]/10 ${highlighted[p.code] ? 'bg-[#F3BA1C]/20' : ''}`}
                      >
                        <td className="py-2.5 px-3 border-b border-[#e9ecef] align-middle">
                          <div className="font-bold text-lg text-[#111827] tracking-wide uppercase">
                            {p.name}
                          </div>
                          <div className="mt-1 text-sm text-[#9aa0a6] font-normal uppercase">
                            {p.code}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#e9ecef] align-middle text-right">
                          <span className="text-[22px] font-normal text-[#111827] whitespace-nowrap tabular-nums">
                            {formatPrice(p.businessAlis, p.decimals ?? 2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#e9ecef] align-middle text-right">
                          <span className="text-[22px] font-normal text-[#111827] whitespace-nowrap tabular-nums">
                            {formatPrice(p.businessSatis, p.decimals ?? 2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sağ sütun - bilgi kartı */}
            <aside className="bg-white rounded-[10px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] p-6">
              <h3 className="text-center text-[18px] tracking-[0.08em] text-[#111827] font-normal mb-3">
                BİLGİ
              </h3>
              <div className="h-px bg-[#e9ecef] mb-4"></div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F3BA1C]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Coins size={16} className="text-[#b88a2b]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">Şube İçi Fiyatlar</div>
                    <div className="text-xs text-[#9aa0a6] mt-0.5">Bu sayfadaki fiyatlar şube içi kullanım içindir.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${connected ? 'bg-green-100' : 'bg-red-100'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">{connected ? 'Canlı Yayın Aktif' : 'Bağlantı Yok'}</div>
                    <div className="text-xs text-[#9aa0a6] mt-0.5">{connected ? 'Fiyatlar anlık güncelleniyor.' : 'Bağlantı yeniden kuruluyor...'}</div>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
