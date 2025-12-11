import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const ModernFeaturedCards = ({ prices }) => {
  // Öne çıkan 4 fiyat
  const featured = [
    prices.find(p => p.code === 'USDTRY'),
    prices.find(p => p.code === 'EURTRY'),
    prices.find(p => p.code === 'ALTIN'),
    prices.find(p => p.code === 'GBPTRY')
  ].filter(Boolean);

  const formatPrice = (price) => {
    if (!price) return '-';
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
    
    return formatted;
  };

  const getChangeData = (direction) => {
    const change = (Math.random() * 1).toFixed(2);
    if (direction === 'up') return { value: `+${change}%`, color: 'text-green-400', bg: 'bg-green-500/20', icon: TrendingUp };
    if (direction === 'down') return { value: `-${change}%`, color: 'text-red-400', bg: 'bg-red-500/20', icon: TrendingDown };
    return { value: `${change}%`, color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Activity };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {featured.map((price, index) => {
        if (!price) return null;
        
        const changeData = getChangeData(price.direction?.satis_dir);
        const Icon = changeData.icon;

        return (
          <div
            key={price.code}
            className="group relative overflow-hidden rounded-3xl glass-card hover:scale-105 transition-all duration-300 cursor-pointer"
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                    <Activity className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-300">{price.code}</h3>
                    <p className="text-xs text-gray-400">{price.name}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${changeData.bg}`}>
                  <Icon size={14} className={changeData.color} />
                  <span className={`text-xs font-bold ${changeData.color}`}>{changeData.value}</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="text-4xl font-black text-white mb-1">
                  {formatPrice(price.calculatedSatis)}
                </div>
                <div className="text-sm text-gray-400">
                  Alış: <span className="text-white font-semibold">{formatPrice(price.calculatedAlis)}</span>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <div className="text-xs text-gray-500">Düşük</div>
                  <div className="text-sm font-bold text-gray-300">{formatPrice(price.dusuk)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Yüksek</div>
                  <div className="text-sm font-bold text-gray-300">{formatPrice(price.yuksek)}</div>
                </div>
              </div>

              {/* Mini Chart Placeholder */}
              <div className="mt-4 h-12 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 30">
                  <path
                    d="M 0 20 Q 25 10 50 15 T 100 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className={changeData.color}
                  />
                </svg>
              </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        );
      })}
    </div>
  );
};

// Keyframe animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

export default ModernFeaturedCards;

