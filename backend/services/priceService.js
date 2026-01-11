const axios = require('axios');
const Coefficient = require('../models/Coefficient');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePrices = require('../models/SourcePrices');

// PHP API URL (Harem Altın fiyatları burada kaydediliyor)
const PHP_API_URL = process.env.PHP_API_URL || 'https://piyasa.akakuyumculuk.com/fiyat/api.php';
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL) || 60000; // 60 saniye (webhook varken yedek)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'nomanoglu_webhook_2024_gizli';

let pollingTimer = null;
let serverIO = null;
let currentPrices = {};
let lastWebhookTime = 0; // Son webhook zamanı

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
// ADIM 1: PHP API'den fiyatları çek
// ============================================
const fetchFromPHPApi = async () => {
  try {
    const response = await axios.get(`${PHP_API_URL}?action=current`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NomanogluBackend/1.0'
      }
    });

    if (response.data && response.data.success && response.data.prices) {
      console.log(`🌐 PHP API'den ${response.data.prices.length} fiyat çekildi`);
      return response.data.prices;
    }

    throw new Error('Geçersiz API yanıtı');
  } catch (err) {
    console.error('❌ PHP API hatası:', err.message);
    return null;
  }
};

// ============================================
// PHP API verisini kaynak formatına dönüştür ve kaydet
// ============================================
const saveSourcePrices = async (apiPrices) => {
  if (!apiPrices || !Array.isArray(apiPrices) || apiPrices.length === 0) return null;

  const newPrices = apiPrices.map(item => ({
    code: item.code,
    name: productNames[item.code] || item.name || item.code,
    rawAlis: parseFloat(item.alis || 0),
    rawSatis: parseFloat(item.satis || 0),
    direction: {},
    dusuk: 0,
    yuksek: 0,
    kapanis: 0,
    tarih: item.tarih || new Date().toISOString()
  }));

  // MongoDB'ye kaydet
  try {
    await SourcePrices.findOneAndUpdate(
      { key: 'source_prices' },
      {
        key: 'source_prices',
        prices: newPrices,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`💾 ${newPrices.length} kaynak fiyat MongoDB'ye kaydedildi`);

    return newPrices;
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
// ANA FONKSİYON: Fiyatları çek ve işle
// ============================================
const fetchAndProcessPrices = async () => {
  try {
    // 1. PHP API'den fiyatları çek
    const apiPrices = await fetchFromPHPApi();
    if (!apiPrices || apiPrices.length === 0) {
      console.log('⚠️ PHP API\'den fiyat alınamadı');
      return;
    }

    // 2. Kaynak fiyatları kaydet
    const sourcePrices = await saveSourcePrices(apiPrices);
    if (!sourcePrices || sourcePrices.length === 0) {
      console.log('⚠️ Kaynak fiyat kaydedilemedi');
      return;
    }

    // 3. Custom fiyatları hesapla
    const calculatedPrices = await calculateCustomPrices(sourcePrices);
    if (calculatedPrices.length === 0) {
      console.log('⚠️ Hesaplanmış fiyat yok');
      return;
    }

    // 4. Cache'e kaydet
    await saveCachedPrices(calculatedPrices);

    // 5. Memory'de tut
    currentPrices = calculatedPrices.reduce((acc, p) => {
      acc[p.code] = p;
      return acc;
    }, {});

    // 6. Socket.IO ile frontend'e gönder
    if (serverIO) {
      serverIO.emit('priceUpdate', {
        meta: { time: new Date().toISOString() },
        prices: calculatedPrices
      });
      console.log(`📡 ${calculatedPrices.length} fiyat frontend'e gönderildi`);
    }

    // 7. Fiyat geçmişine kaydet (opsiyonel)
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
// Polling başlat (WebSocket yerine)
// ============================================
const startPolling = (io) => {
  serverIO = io;

  console.log(`🔄 PHP API Polling başlatılıyor (${POLLING_INTERVAL / 1000} saniye aralıkla)`);
  console.log(`📡 API URL: ${PHP_API_URL}`);

  // İlk çekim
  fetchAndProcessPrices();

  // Belirli aralıklarla tekrarla
  pollingTimer = setInterval(fetchAndProcessPrices, POLLING_INTERVAL);

  console.log('✅ Polling başlatıldı');
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log('⏹️ Polling durduruldu');
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

  // Socket.IO ile frontend'e gönder
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

// ============================================
// WEBHOOK: PHP'den anlık fiyat bildirimi al
// ============================================
const handleWebhook = async (prices, secret) => {
  // Secret kontrolü
  if (secret !== WEBHOOK_SECRET) {
    console.log('❌ Webhook: Geçersiz secret key');
    return { success: false, error: 'Geçersiz secret key' };
  }

  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    console.log('❌ Webhook: Geçersiz veri');
    return { success: false, error: 'Geçersiz veri' };
  }

  console.log(`🔔 Webhook: ${prices.length} fiyat alındı`);
  lastWebhookTime = Date.now();

  try {
    // 1. Kaynak fiyatları kaydet
    const sourcePrices = await saveSourcePrices(prices);
    if (!sourcePrices || sourcePrices.length === 0) {
      return { success: false, error: 'Kaynak fiyat kaydedilemedi' };
    }

    // 2. Custom fiyatları hesapla
    const calculatedPrices = await calculateCustomPrices(sourcePrices);
    if (calculatedPrices.length === 0) {
      return { success: false, error: 'Hesaplanmış fiyat yok' };
    }

    // 3. Cache'e kaydet
    await saveCachedPrices(calculatedPrices);

    // 4. Memory'de tut
    currentPrices = calculatedPrices.reduce((acc, p) => {
      acc[p.code] = p;
      return acc;
    }, {});

    // 5. Socket.IO ile frontend'e ANLIK gönder
    if (serverIO) {
      serverIO.emit('priceUpdate', {
        meta: { time: new Date().toISOString(), source: 'webhook' },
        prices: calculatedPrices
      });
      console.log(`📡 Webhook: ${calculatedPrices.length} fiyat frontend'e gönderildi`);
    }

    return { success: true, processed: calculatedPrices.length };
  } catch (error) {
    console.error('❌ Webhook işleme hatası:', error);
    return { success: false, error: error.message };
  }
};

// Webhook secret'ı al
const getWebhookSecret = () => WEBHOOK_SECRET;

module.exports = {
  startPolling,
  stopPolling,
  getCurrentPrices,
  refreshPrices,
  getSourcePrices,
  handleWebhook,
  getWebhookSecret,
  // Backward compatibility
  startWebSocket: startPolling,
  stopWebSocket: stopPolling,
  calculatePrice: (rawPrice, coefficient) => {
    if (!coefficient || rawPrice === null || rawPrice === undefined) {
      return parseFloat(rawPrice) || 0;
    }
    return (parseFloat(rawPrice) * coefficient.multiplier) + coefficient.addition;
  }
};
