import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PriceTable = ({ prices }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fiyatları kategoriye göre filtrele
  const filteredPrices = useMemo(() => {
    let filtered = prices;

    // Kategori filtresi
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.category === filter);
    }

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [prices, filter, searchTerm]);

  // Fiyat yönü ikonu
  const DirectionIcon = ({ direction }) => {
    if (direction === 'up') return <TrendingUp className="text-green-500" size={16} />;
    if (direction === 'down') return <TrendingDown className="text-red-500" size={16} />;
    return <Minus className="text-gray-500" size={16} />;
  };

  // Fiyat formatla
  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  // Kategori badge rengi
  const getCategoryColor = (category) => {
    const colors = {
      altin: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
      doviz: 'bg-green-500/30 text-green-300 border-green-500/50',
      gumus: 'bg-gray-500/30 text-gray-300 border-gray-500/50',
      diger: 'bg-blue-500/30 text-blue-300 border-blue-500/50'
    };
    return colors[category] || colors.diger;
  };

  return (
    <div className="space-y-4">
      {/* Tabs - Mobil Gibi */}
      <div className="flex bg-[#1a1034] border-b-2 border-[#4c1d95] mb-6 rounded-t-xl">
        <div className="flex-1 text-center py-4 text-white text-sm font-bold border-b-4 border-white">
          Birim ↕
        </div>
        <div className="flex-1 text-center py-4 text-[#9ca3af] text-sm font-semibold hover:text-white transition-colors cursor-pointer">
          Alış
        </div>
        <div className="flex-1 text-center py-4 text-[#9ca3af] text-sm font-semibold hover:text-white transition-colors cursor-pointer">
          Satış
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-[#1a1034] rounded-2xl p-6 mb-6 border border-[#4c1d95] shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Kategori filtreleri */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                filter === 'all'
                  ? 'bg-[#fbbf24] text-black shadow-lg'
                  : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'
              }`}
            >
              Tümü ({prices.length})
            </button>
            <button
              onClick={() => setFilter('altin')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                filter === 'altin'
                  ? 'bg-[#fbbf24] text-black shadow-lg'
                  : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'
              }`}
            >
              Altın
            </button>
            <button
              onClick={() => setFilter('doviz')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                filter === 'doviz'
                  ? 'bg-[#fbbf24] text-black shadow-lg'
                  : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'
              }`}
            >
              Döviz
            </button>
            <button
              onClick={() => setFilter('gumus')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                filter === 'gumus'
                  ? 'bg-[#fbbf24] text-black shadow-lg'
                  : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'
              }`}
            >
              Gümüş
            </button>
          </div>

          {/* Arama */}
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-5 py-3 rounded-xl bg-[#374151] text-white placeholder-[#9ca3af] border border-[#4b5563] focus:border-[#fbbf24] focus:outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Fiyat Listesi - Mobil Tarzı */}
      <div className="bg-[rgba(26,16,52,0.8)] rounded-2xl overflow-hidden border border-[rgba(76,29,149,0.5)] shadow-2xl">
        <div className="divide-y divide-[rgba(76,29,149,0.3)]">
              {filteredPrices.map((price, index) => {
                const changePercent = (Math.random() * 0.5).toFixed(2);
                const changeDir = price.direction?.satis_dir || '';
                const changeColor = changeDir === 'up' ? 'text-green-400' : changeDir === 'down' ? 'text-red-400' : 'text-gray-400';

                return (
                  <div
                    key={price.code}
                    className="flex items-center justify-between px-6 py-5 hover:bg-[rgba(139,92,246,0.2)] transition-all cursor-pointer"
                  >
                    {/* Sol: Ürün Adı ve Saat */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-white text-base font-bold">{price.code}</span>
                        <span className="text-[#9ca3af] text-xs font-medium">
                          ⏱ {new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                      <div className="text-[#9ca3af] text-sm">{price.name}</div>
                    </div>

                    {/* Orta: Alış */}
                    <div className="text-right mr-8">
                      <div className="text-white text-lg font-bold font-mono">
                        {formatPrice(price.calculatedAlis)}
                      </div>
                    </div>

                    {/* Sağ: Satış ve Değişim */}
                    <div className="text-right min-w-[120px]">
                      <div className="text-white text-lg font-bold font-mono">
                        {formatPrice(price.calculatedSatis)}
                      </div>
                      <div className={`text-sm font-bold ${changeColor}`}>
                        %{changePercent}
                      </div>
                    </div>
                  </div>
                );
              })}
          {filteredPrices.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[#9ca3af] text-lg font-semibold">Gösterilecek fiyat bulunamadı</div>
              <div className="text-[#6b7280] text-sm mt-2">Filtreleri değiştirerek tekrar deneyin</div>
            </div>
          )}
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="text-sm text-[#9ca3af] text-center mt-6 font-medium">
        Toplam <span className="text-white font-bold">{filteredPrices.length}</span> ürün görüntüleniyor
      </div>
    </div>
  );
};

export default PriceTable;


