const MobileFeaturedCards = ({ prices }) => {
  // Üstte gösterilecek 3 fiyat (mobil gibi)
  const featured = [
    prices.find(p => p.code === 'USDTRY') || { code: 'USDTRY', calculatedSatis: 0, direction: {} },
    prices.find(p => p.code === 'EURTRY') || { code: 'EURTRY', calculatedSatis: 0, direction: {} },
    prices.find(p => p.code === 'JPYTRY') || { code: 'JPYTRY', calculatedSatis: 0, direction: {} }
  ];

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const getChangeData = (direction) => {
    const change = (Math.random() * 0.5).toFixed(2);
    if (direction === 'up') return { value: `%${change}`, color: 'text-green-400' };
    if (direction === 'down') return { value: `%${change}`, color: 'text-red-400' };
    return { value: `%${change}`, color: 'text-gray-400' };
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-8 px-4 py-4">
      {featured.map((price, index) => {
        const changeData = getChangeData(price.direction?.satis_dir);

        return (
          <div
            key={price.code}
            className="bg-[rgba(139,92,246,0.3)] border border-[rgba(139,92,246,0.5)] rounded-2xl p-6 hover:bg-[rgba(139,92,246,0.4)] transition-all"
          >
            <div className="text-[#e9d5ff] text-sm font-bold mb-3">{price.code}</div>
            <div className="text-white text-3xl font-bold mb-2 font-mono">
              {formatPrice(price.calculatedSatis)}
            </div>
            <div className={`text-sm font-bold ${changeData.color} flex items-center`}>
              {changeData.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileFeaturedCards;

