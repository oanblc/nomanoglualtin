import { TrendingUp, TrendingDown } from 'lucide-react';

const FeaturedPricesLight = ({ prices }) => {
  // En önemli fiyatları seç
  const featured = [
    prices.find(p => p.code === 'ALTIN'),
    prices.find(p => p.code === 'USDTRY'),
    prices.find(p => p.code === 'EURTRY'),
    prices.find(p => p.code === 'CEYREK_YENI'),
    prices.find(p => p.code === 'YARIM_YENI'),
    prices.find(p => p.code === 'TEK_YENI')
  ].filter(Boolean).slice(0, 6);

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getChangeColor = (dir) => {
    if (dir === 'up') return 'text-green-600';
    if (dir === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = (dir) => {
    if (dir === 'up') return '▲';
    if (dir === 'down') return '▼';
    return '-';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3">
        <h2 className="text-white font-bold text-lg">ALTIN FİYATLARI</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {featured.map((price, index) => {
          if (!price) return null;
          
          const direction = price.direction?.satis_dir || '';
          const spread = price.calculatedSatis - price.calculatedAlis;

          return (
            <div
              key={price.code}
              className={`flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div>
                  <div className="font-semibold text-gray-900">{price.name}</div>
                  <div className="text-xs text-gray-500">{price.code}</div>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Alış</div>
                  <div className="font-bold text-gray-900">
                    {formatPrice(price.calculatedAlis)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Satış</div>
                  <div className="font-bold text-gray-900">
                    {formatPrice(price.calculatedSatis)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Fark</div>
                  <div className="font-semibold text-yellow-600">
                    {formatPrice(spread)}
                  </div>
                </div>

                <div className={`flex items-center space-x-1 ${getChangeColor(direction)}`}>
                  <span className="text-sm font-bold">{getChangeIcon(direction)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedPricesLight;

