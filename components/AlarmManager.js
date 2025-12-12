import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDeviceId } from '../hooks/useDeviceId';
import { Bell, Plus, Trash2, AlertCircle, X } from 'lucide-react';

const AlarmManager = ({ prices }) => {
  const deviceId = useDeviceId();
  const [alarms, setAlarms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    productCode: '',
    priceType: 'alis',
    condition: 'above',
    targetPrice: ''
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Alarmları yükle
  useEffect(() => {
    if (deviceId) {
      loadAlarms();
    }
  }, [deviceId]);

  const loadAlarms = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/alarms/${deviceId}`);
      if (response.data.success) {
        setAlarms(response.data.data);
      }
    } catch (error) {
      console.error('Alarm yükleme hatası:', error);
    }
  };

  // Yeni alarm oluştur
  const createAlarm = async (e) => {
    e.preventDefault();

    if (!formData.productCode || !formData.targetPrice) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const selectedProduct = prices.find(p => p.code === formData.productCode);
    if (!selectedProduct) {
      alert('Ürün bulunamadı');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/alarms`, {
        deviceId,
        productCode: formData.productCode,
        productName: selectedProduct.name,
        priceType: formData.priceType,
        condition: formData.condition,
        targetPrice: parseFloat(formData.targetPrice)
      });

      if (response.data.success) {
        setAlarms([response.data.data, ...alarms]);
        setFormData({ productCode: '', priceType: 'alis', condition: 'above', targetPrice: '' });
        setShowCreateForm(false);
        
        // Browser notification izni iste
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch (error) {
      console.error('Alarm oluşturma hatası:', error);
      alert('Alarm oluşturulamadı');
    }
  };

  // Alarmı sil
  const deleteAlarm = async (alarmId) => {
    if (!confirm('Bu alarmı silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`${apiUrl}/api/alarms/${alarmId}`);
      setAlarms(alarms.filter(a => a._id !== alarmId));
    } catch (error) {
      console.error('Alarm silme hatası:', error);
    }
  };

  return (
    <div className="bg-[rgba(26,16,52,0.8)] rounded-2xl p-8 border border-[rgba(76,29,149,0.5)] shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#fbbf24] rounded-xl flex items-center justify-center">
            <Bell className="text-black" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">Fiyat Alarmları</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-6 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-xl transition-all font-bold shadow-lg"
        >
          {showCreateForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showCreateForm ? 'İptal' : 'Yeni Alarm'}</span>
        </button>
      </div>

      {/* Alarm Oluşturma Formu */}
      {showCreateForm && (
        <form onSubmit={createAlarm} className="mb-6 p-6 bg-[rgba(76,29,149,0.3)] rounded-2xl space-y-5 border border-[rgba(139,92,246,0.5)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">Ürün</label>
              <select
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                className="w-full px-4 py-3 bg-[#374151] border border-[#4b5563] rounded-xl text-white placeholder-[#9ca3af] focus:border-[#fbbf24] focus:outline-none text-sm font-medium"
                required
              >
                <option value="">Seçiniz</option>
                {prices.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">Fiyat Tipi</label>
              <select
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                className="w-full px-4 py-3 bg-[#374151] border border-[#4b5563] rounded-xl text-white placeholder-[#9ca3af] focus:border-[#fbbf24] focus:outline-none text-sm font-medium"
              >
                <option value="alis">Alış</option>
                <option value="satis">Satış</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">Koşul</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-3 bg-[#374151] border border-[#4b5563] rounded-xl text-white placeholder-[#9ca3af] focus:border-[#fbbf24] focus:outline-none text-sm font-medium"
              >
                <option value="above">Üstüne çıkınca (≥)</option>
                <option value="below">Altına düşünce (≤)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">Hedef Fiyat</label>
              <input
                type="number"
                step="0.01"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#374151] border border-[#4b5563] rounded-xl text-white placeholder-[#9ca3af] focus:border-[#fbbf24] focus:outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-xl font-bold transition-all shadow-lg text-base"
          >
            Alarm Oluştur
          </button>
        </form>
      )}

      {/* Alarm Listesi */}
      <div className="space-y-3">
        {alarms.length === 0 && (
          <div className="text-center py-12 text-[#9ca3af]">
            <AlertCircle className="mx-auto mb-3 text-[#6b7280]" size={40} />
            <p className="font-semibold text-base">Henüz alarm oluşturmadınız</p>
            <p className="text-sm mt-2 text-[#6b7280]">Yeni Alarm butonuna tıklayarak başlayın</p>
          </div>
        )}

        {alarms.map(alarm => (
          <div
            key={alarm._id}
            className={`p-5 rounded-2xl border ${
              alarm.isTriggered
                ? 'bg-green-500/20 border-green-500/50 shadow-lg'
                : alarm.isActive
                ? 'bg-[rgba(76,29,149,0.3)] border-[rgba(139,92,246,0.5)]'
                : 'bg-[rgba(76,29,149,0.2)] border-[rgba(139,92,246,0.3)]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-white text-lg">{alarm.productName}</h3>
                  {alarm.isTriggered && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-medium">
                      Tetiklendi
                    </span>
                  )}
                </div>
                <p className="text-base text-[#d1d5db]">
                  {alarm.priceType === 'alis' ? 'Alış' : 'Satış'} fiyatı{' '}
                  {alarm.condition === 'above' ? '≥' : '≤'}{' '}
                  <span className="text-[#fbbf24] font-bold text-lg">
                    {alarm.targetPrice.toFixed(2)} TL
                  </span>
                </p>
                {alarm.isTriggered && alarm.triggeredAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alarm.triggeredAt).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteAlarm(alarm._id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlarmManager;

