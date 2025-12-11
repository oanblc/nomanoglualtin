import { TrendingUp, TrendingDown } from 'lucide-react';

const FeaturedPrices = ({ prices }) => {
  // En önemli 3 fiyatı seç (USDTRY, EURTRY, ALTIN)
  const featured = [
    prices.find(p => p.code === 'USDTRY'),
    prices.find(p => p.code === 'EURTRY'),
    prices.find(p => p.code === 'ALTIN')
  ].filter(Boolean);

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const getChangeColor = (dir) => {
    if (dir === 'up') return 'text-green-400';
    if (dir === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {featured.map((price) => {
        if (!price) return null;
        
        const direction = price.direction?.satis_dir || '';
        const change = Math.random() * 2 - 1; // Gerçek değişim yüzdesini buraya ekleyebilirsiniz

        return (
          <div
            key={price.code}
            className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-purple-900/80 to-blue-900/80 border border-purple-700/50 backdrop-blur-sm"
          >
            {/* Arka plan deseni */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">{price.code}</h3>
                {direction && (
                  <div className={`flex items-center space-x-1 ${getChangeColor(direction)}`}>
                    {direction === 'up' ? (
                      <TrendingUp size={16} />
                    ) : direction === 'down' ? (
                      <TrendingDown size={16} />
                    ) : null}
                    <span className="text-xs">%{Math.abs(change).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold text-white mb-1">
                  {formatPrice(price.calculatedSatis)}
                </div>
                <div className="text-sm text-gray-400">{price.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-700/30">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Alış</div>
                  <div className="text-lg font-semibold text-white">
                    {formatPrice(price.calculatedAlis)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Satış</div>
                  <div className="text-lg font-semibold text-white">
                    {formatPrice(price.calculatedSatis)}
                  </div>
                </div>
              </div>

              {/* Mini chart placeholder */}
              <div className="mt-4 h-12 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 40">
                  <path
                    d="M 0 20 Q 25 10 50 15 T 100 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-purple-400"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedPrices;

