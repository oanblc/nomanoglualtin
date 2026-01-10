const { io: SocketIOClient } = require('socket.io-client');
const Coefficient = require('../models/Coefficient');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePrices = require('../models/SourcePrices');

let haremSocket = null;
let serverIO = null;
let currentPrices = {};

// Türkçe isim mapping
const productNames = {
  'ALTIN': 'Has Altın',
  'ONS': 'Ons',
  'USDKG': 'USD/KG',
  'EURKG': 'EUR/KG',
  'AYAR22': '22 Ayar',
  'KULCEALTIN': 'Gram Altın',
  'CEYREK_YENI': 'Yeni Çeyrek',
  'CEYREK_ESKI': 'Eski Çeyrek',
  'YARIM_YENI': 'Yeni Yarım',
  'YARIM_ESKI': 'Eski Yarım',
  'TEK_YENI': 'Yeni Tam',
  'TEK_ESKI': 'Eski Tam',
  'ATA_YENI': 'Yeni Ata',
  'ATA_ESKI': 'Eski Ata',
  'ATA5_YENI': 'Yeni Ata 5\'li',
  'ATA5_ESKI': 'Eski Ata 5\'li',
  'GREMESE_YENI': 'Yeni Gremse',
  'GREMESE_ESKI': 'Eski Gremse',
  'AYAR14': '14 Ayar',
  'GUMUSTRY': 'Gümüş TL',
  'XAGUSD': 'Gümüş Ons',
  'GUMUSUSD': 'Gümüş USD',
  'XPTUSD': 'Platin Ons',
  'XPDUSD': 'Paladyum Ons',
  'PLATIN': 'Platin/USD',
  'PALADYUM': 'Paladyum/USD',
  'USDTRY': 'Dolar',
  'EURTRY': 'Euro',
  'GBPTRY': 'Sterlin',
  'CHFTRY': 'İsviçre Frangı',
  'JPYTRY': 'Japon Yeni'
};

// Fiyat kategorilerini belirle
const categorizeProduct = (code) => {
  if (code.includes('ALTIN') || code.includes('CEYREK') || code.includes('YARIM') ||
      code.includes('TEK') || code.includes('ATA') || code.includes('GREMESE') ||
      code.includes('AYAR') || code.includes('ONS') || code.includes('KULCE')) {
    return 'altin';
  } else if (code.includes('GUMUS') || code.includes('XAG')) {
    return 'gumus';
  } else if (code.includes('TRY') || code.includes('USD') || code.includes('EUR') ||
             code.includes('GBP') || code.includes('CHF') || code.includes('JPY') ||
             code.includes('AUD') || code.includes('CAD')) {
    return 'doviz';
  }
  return 'diger';
};

// ============================================
// ADIM 1: WebSocket'ten ham veri al ve kaydet (MERGE)
// ============================================
const saveSourcePrices = async (rawData) => {
  if (!rawData || typeof rawData !== 'object') return null;

  const priceData = rawData.data || rawData;
  const newPrices = [];

  Object.keys(priceData).forEach(key => {
    const item = priceData[key];
    if (item && typeof item === 'object' && item.code) {
      newPrices.push({
        code: key,
        name: productNames[key] || key,
        rawAlis: parseFloat(item.alis || 0),
        rawSatis: parseFloat(item.satis || 0),
        direction: item.dir || {},
        dusuk: parseFloat(item.dusuk || 0),
        yuksek: parseFloat(item.yuksek || 0),
        kapanis: parseFloat(item.kapanis || 0),
        tarih: item.tarih || new Date().toISOString()
      });
    }
  });

  if (newPrices.length === 0) return null;

  // MongoDB'den mevcut fiyatları çek ve merge et
  try {
    const existing = await SourcePrices.findOne({ key: 'source_prices' });

    // Mevcut fiyatları map'e çevir
    const priceMap = {};
    if (existing && existing.prices) {
      existing.prices.forEach(p => {
        priceMap[p.code] = p;
      });
    }

    // Yeni gelen fiyatları üzerine yaz veya ekle
    newPrices.forEach(p => {
      priceMap[p.code] = p;
    });

    // Map'i array'e çevir
    const mergedPrices = Object.values(priceMap);

    // MongoDB'ye kaydet
    await SourcePrices.findOneAndUpdate(
      { key: 'source_prices' },
      {
        key: 'source_prices',
        prices: mergedPrices,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`💾 ${mergedPrices.length} kaynak fiyat MongoDB'ye kaydedildi (${newPrices.length} yeni/güncellenen)`);

    return mergedPrices;
  } catch (err) {
    console.error('❌ Kaynak fiyat kaydetme hatası:', err.message);
    return newPrices;
  }
};

// ============================================
// ADIM 2: Kaynak fiyatları MongoDB'den çek
// ============================================
const getSourcePrices = async () => {
  try {
    const source = await SourcePrices.findOne({ key: 'source_prices' });
    if (source && source.prices) {
      return source.prices;
    }
  } catch (err) {
    console.error('❌ Kaynak fiyat çekme hatası:', err.message);
  }
  return [];
};

// ============================================
// ADIM 3: Custom fiyatları hesapla
// ============================================
const calculateCustomPrices = async (sourcePrices) => {
  if (!sourcePrices || sourcePrices.length === 0) return [];

  // Kaynak fiyatları map'e çevir (hızlı erişim için)
  const sourceMap = {};
  sourcePrices.forEach(p => {
    sourceMap[p.code] = p;
  });

  // Custom fiyatları MongoDB'den çek - lean() ile düz obje olarak al (daha hızlı)
  let customPriceConfigs = [];
  try {
    const CustomPrice = require('../models/CustomPrice');
    customPriceConfigs = await CustomPrice.find({ isVisible: true }).sort({ order: 1 }).lean();
    console.log('📋 Custom fiyat sıralaması:', customPriceConfigs.map(c => `${c.code}:${c.order}`).join(', '));
  } catch (err) {
    console.error('❌ Custom fiyat config çekme hatası:', err.message);
    return [];
  }

  const calculatedPrices = [];

  for (const config of customPriceConfigs) {
    const alisSource = sourceMap[config.alisConfig?.sourceCode];
    const satisSource = sourceMap[config.satisConfig?.sourceCode];

    if (!alisSource || !satisSource) {
      console.log(`⚠️ ${config.code}: Kaynak bulunamadı (alis: ${config.alisConfig?.sourceCode}, satis: ${config.satisConfig?.sourceCode})`);
      continue;
    }

    // Alış hesapla
    const alisRaw = config.alisConfig.sourceType === 'alis' ? alisSource.rawAlis : alisSource.rawSatis;
    const calculatedAlis = (alisRaw * config.alisConfig.multiplier) + config.alisConfig.addition;

    // Satış hesapla
    const satisRaw = config.satisConfig.sourceType === 'alis' ? satisSource.rawAlis : satisSource.rawSatis;
    const calculatedSatis = (satisRaw * config.satisConfig.multiplier) + config.satisConfig.addition;

    // Geçerli fiyat kontrolü
    if (calculatedAlis <= 0 || calculatedSatis <= 0 || isNaN(calculatedAlis) || isNaN(calculatedSatis)) {
      continue;
    }

    calculatedPrices.push({
      id: config._id.toString(),
      code: config.code,
      name: config.name,
      category: config.category || categorizeProduct(config.code),
      rawAlis: alisRaw,
      rawSatis: satisRaw,
      calculatedAlis,
      calculatedSatis,
      direction: alisSource.direction || satisSource.direction || {},
      isCustom: true,
      isVisible: config.isVisible,
      order: config.order ?? 999,
      decimals: config.decimals ?? 0,
      tarih: new Date().toISOString()
    });
  }

  // Order'a göre sırala (0 geçerli bir değer olduğu için ?? kullan)
  calculatedPrices.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return calculatedPrices;
};

// ============================================
// ADIM 4: Hesaplanan fiyatları MongoDB'ye kaydet
// ============================================
const saveCachedPrices = async (prices) => {
  if (!prices || prices.length === 0) return;

  try {
    await CachedPrices.findOneAndUpdate(
      { key: 'current_prices' },
      {
        key: 'current_prices',
        prices: prices.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          calculatedAlis: p.calculatedAlis,
          calculatedSatis: p.calculatedSatis,
          rawAlis: p.rawAlis,
          rawSatis: p.rawSatis,
          direction: p.direction,
          isCustom: p.isCustom,
          isVisible: p.isVisible,
          order: p.order,
          decimals: p.decimals ?? 0,
          tarih: p.tarih
        })),
        meta: {
          time: new Date().toISOString(),
          count: prices.length
        },
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`💾 ${prices.length} hesaplanmış fiyat cache'e kaydedildi`);
  } catch (err) {
    console.error('❌ Cache kaydetme hatası:', err.message);
  }
};

// ============================================
// ANA FONKSİYON: WebSocket verisini işle
// ============================================
const handlePriceData = async (rawData) => {
  try {
    // 1. Kaynak fiyatları kaydet
    const sourcePrices = await saveSourcePrices(rawData);
    if (!sourcePrices || sourcePrices.length === 0) {
      console.log('⚠️ Kaynak fiyat bulunamadı');
      return;
    }

    // 2. Custom fiyatları hesapla
    const calculatedPrices = await calculateCustomPrices(sourcePrices);
    if (calculatedPrices.length === 0) {
      console.log('⚠️ Hesaplanmış fiyat yok');
      return;
    }

    // 3. Cache'e kaydet
    await saveCachedPrices(calculatedPrices);

    // 4. Memory'de tut
    currentPrices = calculatedPrices.reduce((acc, p) => {
      acc[p.code] = p;
      return acc;
    }, {});

    // 5. WebSocket ile frontend'e gönder
    if (serverIO) {
      serverIO.emit('priceUpdate', {
        meta: { time: new Date().toISOString() },
        prices: calculatedPrices
      });
      console.log(`📡 ${calculatedPrices.length} fiyat frontend'e gönderildi`);
    }

    // 6. Fiyat geçmişine kaydet (opsiyonel)
    try {
      for (const price of calculatedPrices) {
        await PriceHistory.create({
          code: price.code,
          rawAlis: price.rawAlis,
          rawSatis: price.rawSatis,
          calculatedAlis: price.calculatedAlis,
          calculatedSatis: price.calculatedSatis,
          direction: price.direction
        });
      }
    } catch (err) {
      // History hatası kritik değil, devam et
    }

  } catch (error) {
    console.error('❌ Fiyat işleme hatası:', error);
  }
};

// ============================================
// WebSocket bağlantısı
// ============================================
const startWebSocket = (io) => {
  serverIO = io;
  const wsUrl = process.env.HAREM_ALTIN_WS || 'wss://hrmsocketonly.haremaltin.com:443';

  console.log(`🔌 Harem Altın WebSocket'e bağlanılıyor: ${wsUrl}`);

  haremSocket = SocketIOClient(wsUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  haremSocket.on('connect', () => {
    console.log('✅ Harem Altın WebSocket bağlantısı kuruldu!');
  });

  haremSocket.on('disconnect', (reason) => {
    console.log('❌ Harem Altın bağlantısı kesildi:', reason);
  });

  haremSocket.on('error', (error) => {
    console.error('❌ Harem Altın WebSocket hatası:', error.message);
  });

  // Tüm event'leri dinle
  haremSocket.onAny(async (eventName, data) => {
    if (['connect', 'disconnect', 'error', 'connect_error'].includes(eventName)) return;

    console.log(`📊 Harem Altın'dan ${eventName} event'i alındı`);
    await handlePriceData(data);
  });
};

const stopWebSocket = () => {
  if (haremSocket) {
    haremSocket.disconnect();
    haremSocket = null;
    console.log('⏹️ Harem Altın WebSocket bağlantısı kapatıldı');
  }
};

// ============================================
// Custom fiyat değiştiğinde yeniden hesapla
// ============================================
const refreshPrices = async () => {
  console.log('🔄 Fiyatlar yeniden hesaplanıyor...');

  // MongoDB'den son kaynak fiyatları çek
  const sourcePrices = await getSourcePrices();
  if (sourcePrices.length === 0) {
    console.log('⚠️ Kaynak fiyat bulunamadı, refresh yapılamadı');
    return false;
  }

  // Custom fiyatları hesapla
  const calculatedPrices = await calculateCustomPrices(sourcePrices);
  if (calculatedPrices.length === 0) {
    console.log('⚠️ Hesaplanmış fiyat yok');
    return false;
  }

  // Cache'e kaydet
  await saveCachedPrices(calculatedPrices);

  // Memory'de tut
  currentPrices = calculatedPrices.reduce((acc, p) => {
    acc[p.code] = p;
    return acc;
  }, {});

  // WebSocket ile frontend'e gönder
  if (serverIO) {
    serverIO.emit('priceUpdate', {
      meta: { time: new Date().toISOString() },
      prices: calculatedPrices
    });
    console.log(`📡 ${calculatedPrices.length} fiyat refresh sonrası gönderildi`);
  }

  return true;
};

// Mevcut fiyatları getir
const getCurrentPrices = () => {
  return Object.values(currentPrices);
};

module.exports = {
  startWebSocket,
  stopWebSocket,
  getCurrentPrices,
  refreshPrices,
  getSourcePrices,
  // Backward compatibility
  startPolling: startWebSocket,
  stopPolling: stopWebSocket,
  calculatePrice: (rawPrice, coefficient) => {
    if (!coefficient || rawPrice === null || rawPrice === undefined) {
      return parseFloat(rawPrice) || 0;
    }
    return (parseFloat(rawPrice) * coefficient.multiplier) + coefficient.addition;
  }
};
