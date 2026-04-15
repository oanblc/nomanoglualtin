import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Lock, Building2 } from 'lucide-react';

export default function IsletmeLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('businessToken') : null;
    if (!token) return;
    axios.get(`${apiUrl}/api/business/verify`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => router.replace('/isletme-fiyatlari'))
      .catch(() => localStorage.removeItem('businessToken'));
  }, [apiUrl, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/business/login`, { password });
      if (res.data.success) {
        localStorage.setItem('businessToken', res.data.token);
        router.push('/isletme-fiyatlari');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>İşletme Girişi</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4 shadow-lg">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İşletme Fiyatları</h1>
            <p className="text-gray-600">Şube içi erişim</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="İşletme şifresi"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
