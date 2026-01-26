const axios = require('axios');
const Coefficient = require('../models/Coefficient');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePrices = require('../models/SourcePrices');

// HTTP API URLs (Birincil ve Yedek kaynak)
const API_URL_PRIMARY = process.env.PRICE_API_URL || 'http://37.148.208.13/api.php';
const API_URL_BACKUP = process.env.PRICE_API_URL_BACKUP || 'https://saglamoglualtin.com/component/tab-group/1';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 2000; // 2 saniye
let fallbackTimeoutMs = parseInt(process.env.FALLBACK_TIMEOUT) || 30 * 60 * 1000; // 30 dakika (ms) - değiştirilebilir
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'nomanoglu_webhook_2024_gizli';

let serverIO = null;
let currentPrices = {};
let isConnectedPrimary = false;
let isConnectedBackup = false;
let pollTimer = null;
let pollTimerBackup = null;
let lastPriceHash = null; // Fiyat değişikliği kontrolü için

// API son güncelleme zamanları
let lastUpdatePrimary = null;
let lastUpdateBackup = null;

// Aktif kaynak (global): 'primary' veya 'backup'
let activeGlobalSource = 'primary';
// Manuel olarak değiştirildi mi? (otomatik geri dönüşü engeller)
let manualGlobalOverride = false;

// Saglamoglu API kod eşleştirmesi (API2 name -> API1 code)
const api2CodeMapping = {
  // Altın ürünleri
  'HAS ALTIN': 'ALTIN',
  'Has Altın': 'ALTIN',
  'Gram Altın': 'KULCEALTIN',
  'Altın/ONS': 'ONS',
  'Ons Altın': 'ONS',
  'USD/Ons': 'ONS',
  'USD/KG': 'USDKG',
  'EUR/KG': 'EURKG',
  '22 Ayar': 'AYAR22',
  '14 Ayar': 'AYAR14',
  'Çeyrek Eski': 'CEYREK_ESKI',
  'Çeyrek Yeni': 'CEYREK_YENI',
  'Yarım Eski': 'YARIM_ESKI',
  'Yarım Yeni': 'YARIM_YENI',
  'Tam Eski': 'TEK_ESKI',
  'Tam Yeni': 'TEK_YENI',
  'Ata Eski': 'ATA_ESKI',
  'Ata Yeni': 'ATA_YENI',
  'Ata 5\'li Eski': 'ATA5_ESKI',
  'Ata 5\'li Yeni': 'ATA5_YENI',
  'Gremse Eski': 'GREMESE_ESKI',
  'Gremse Yeni': 'GREMESE_YENI',
  // Gümüş ürünleri
  'GÜM/TL': 'GUMUSTRY',
  'Gümüş TL/Gr': 'GUMUSTRY',
  'Gümüş': 'GUMUSTRY',
  'GÜM/ONS': 'XAGUSD',
  'GÜM/USD': 'GUMUSUSD',
  'GÜM/EUR': 'GUMUSEUR',
  // Döviz kurları
  'USD/TL': 'USDTRY',
  'EUR/TL': 'EURTRY',
  'GBP/TRY': 'GBPTRY',
  'GBP/TL': 'GBPTRY',
  'CHF/TRY': 'CHFTRY',
  'CHF/TL': 'CHFTRY',
  'JPY/TRY': 'JPYTRY',
  'CAD/TRY': 'CADTRY',
  'AUD/TRY': 'AUDTRY',
  'SAR/TRY': 'SARTRY',
  // Çapraz kurlar
  'EUR/USD': 'EURUSD',
  'EUR/GBP': 'EURGBP',
  'GBP/USD': 'GBPUSD',
  'USD/CHF': 'USDCHF',
  'USD/JPY': 'USDJPY',
  'USD/CAD': 'USDCAD',
  'AUD/USD': 'AUDUSD',
  'USD/SAR': 'USDSAR'
};

// Backward compatibility için alias
const API_URL = API_URL_PRIMARY;
const isConnected = () => isConnectedPrimary || isConnectedBackup;

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
// Fiyat hash'i oluştur (değişiklik kontrolü için)
// ============================================
const createPriceHash = (prices) => {
  // Sadece önemli alanları kullanarak basit bir hash oluştur
  const key = prices.map(p => `${p.code}:${p.rawAlis}:${p.rawSatis}`).sort().join('|');
  // Basit hash fonksiyonu
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// ============================================
// VPS WebSocket'ten fiyat geldiğinde işle
// ============================================
const handleVpsPrices = async (data) => {
  try {
    const prices = data.prices || data;
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      console.log('⚠️ VPS: Geçersiz fiyat verisi');
      return;
    }

    // Fiyat değişikliği kontrolü
    const newHash = createPriceHash(prices);
    if (newHash === lastPriceHash) {
      // Fiyat değişmedi, işlem yapma
      return;
    }
    lastPriceHash = newHash;

    console.log(`📡 ${prices.length} fiyat güncellendi`);

    // 1. Kaynak fiyatları kaydet
    const sourcePrices = await saveSourcePrices(prices);
    if (!sourcePrices || sourcePrices.length === 0) {
      console.log('⚠️ Kaynak fiyat kaydedilemedi');
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

    // 5. Socket.IO ile frontend'e gönder
    if (serverIO) {
      serverIO.emit('priceUpdate', {
        meta: { time: new Date().toISOString(), source: 'http-api' },
        prices: calculatedPrices
      });
      console.log(`📤 ${calculatedPrices.length} fiyat frontend'e gönderildi`);
    }

  } catch (error) {
    console.error('❌ Fiyat işleme hatası:', error.message);
  }
};

// ============================================
// Kaynak fiyatları MERGE ederek kaydet (üzerine yazmak yerine güncelle)
// ============================================
const saveSourcePrices = async (apiPrices) => {
  if (!apiPrices || !Array.isArray(apiPrices) || apiPrices.length === 0) return null;

  try {
    // 1. Mevcut fiyatları çek
    const existing = await SourcePrices.findOne({ key: 'source_prices' });
    const existingPrices = existing?.prices || [];

    // 2. Mevcut fiyatları code'a göre map'e çevir
    const priceMap = {};
    existingPrices.forEach(p => {
      priceMap[p.code] = p;
    });

    // 3. Gelen fiyatları güncelle/ekle (merge)
    apiPrices.forEach(item => {
      priceMap[item.code] = {
        code: item.code,
        name: productNames[item.code] || item.name || item.code,
        rawAlis: parseFloat(item.rawAlis || item.alis || 0),
        rawSatis: parseFloat(item.rawSatis || item.satis || 0),
        direction: item.direction || {},
        dusuk: item.dusuk || 0,
        yuksek: item.yuksek || 0,
        kapanis: item.kapanis || 0,
        tarih: item.tarih || new Date().toISOString()
      };
    });

    // 4. Map'i array'e çevir
    const mergedPrices = Object.values(priceMap);

    // 5. MongoDB'ye kaydet
    await SourcePrices.findOneAndUpdate(
      { key: 'source_prices' },
      {
        key: 'source_prices',
        prices: mergedPrices,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`💾 ${apiPrices.length} fiyat güncellendi (toplam: ${mergedPrices.length})`);
    return mergedPrices;
  } catch (err) {
    console.error('❌ Kaynak fiyat kaydetme hatası:', err.message);
    return null;
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
// ADIM 3: Custom fiyatları hesapla (Birincil + Yedek kaynak desteği)
// ============================================
const calculateCustomPrices = async (sourcePrices) => {
  if (!sourcePrices || sourcePrices.length === 0) return [];

  // Birincil kaynak fiyatları map'e çevir
  const primarySourceMap = {};
  sourcePrices.forEach(p => {
    primarySourceMap[p.code] = p;
  });

  // Yedek kaynak fiyatlarını çek
  const backupPrices = await getBackupSourcePrices();
  const backupSourceMap = {};
  backupPrices.forEach(p => {
    backupSourceMap[p.code] = p;
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
    // Hangi kaynağı kullanacağını belirle
    const useBackup = config.activeSource === 'backup';
    const sourceMap = useBackup ? backupSourceMap : primarySourceMap;

    // Kullanılacak config'i seç
    // Yedek kaynak seçiliyse VE yedek config tanımlıysa yedek config kullan
    // Yedek kaynak seçiliyse AMA yedek config tanımlı değilse fiyatı gösterme (fallback yapma)
    let alisConfig, satisConfig;

    if (useBackup) {
      // Yedek kaynak seçili - sadece yedek config kullan
      if (!config.backupAlisConfig?.sourceCode || !config.backupSatisConfig?.sourceCode) {
        // Yedek config tanımlı değil, bu fiyatı atla
        console.log(`⚠️ ${config.code}: Yedek kaynak config tanımlı değil, atlanıyor`);
        continue;
      }
      alisConfig = config.backupAlisConfig;
      satisConfig = config.backupSatisConfig;
    } else {
      // Birincil kaynak seçili
      alisConfig = config.alisConfig;
      satisConfig = config.satisConfig;
    }

    const alisSource = sourceMap[alisConfig?.sourceCode];
    const satisSource = sourceMap[satisConfig?.sourceCode];

    if (!alisSource || !satisSource) {
      console.log(`⚠️ ${config.code}: Kaynak bulunamadı (aktif: ${config.activeSource || 'primary'})`);
      continue;
    }

    const finalAlisSource = alisSource;
    const finalSatisSource = satisSource;
    const finalAlisConfig = alisConfig;
    const finalSatisConfig = satisConfig;

    // Alış hesapla
    const alisRaw = finalAlisConfig.sourceType === 'alis' ? finalAlisSource.rawAlis : finalAlisSource.rawSatis;
    const calculatedAlis = (alisRaw * finalAlisConfig.multiplier) + finalAlisConfig.addition;

    // Satış hesapla
    const satisRaw = finalSatisConfig.sourceType === 'alis' ? finalSatisSource.rawAlis : finalSatisSource.rawSatis;
    const calculatedSatis = (satisRaw * finalSatisConfig.multiplier) + finalSatisConfig.addition;

    // Geçerli fiyat kontrolü
    if (calculatedAlis <= 0 || calculatedSatis <= 0 || isNaN(calculatedAlis) || isNaN(calculatedSatis)) {
      continue;
    }

    // Debug: decimals değerini kontrol et
    if (config.code === 'HAS ALTIN') {
      console.log(`🔍 HAS ALTIN decimals: config.decimals=${config.decimals}, type=${typeof config.decimals}`);
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
      direction: finalAlisSource.direction || finalSatisSource.direction || {},
      isCustom: true,
      isVisible: config.isVisible,
      order: config.order ?? 999,
      decimals: config.decimals ?? 0,
      tarih: new Date().toISOString(),
      activeSource: config.activeSource || 'primary'
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
// BİRİNCİL API'den fiyat çek (API 1)
// ============================================
const fetchPricesFromPrimaryAPI = async () => {
  try {
    const response = await axios.get(API_URL_PRIMARY, { timeout: 10000 });

    if (response.data && response.data.success && response.data.data) {
      const apiData = response.data.data;

      // API verisini array formatına çevir
      const prices = Object.keys(apiData).map(code => {
        const item = apiData[code];
        return {
          code: item.code,
          alis: parseFloat(item.alis) || 0,
          satis: parseFloat(item.satis) || 0,
          rawAlis: parseFloat(item.alis) || 0,
          rawSatis: parseFloat(item.satis) || 0,
          direction: item.dir || {},
          dusuk: parseFloat(item.dusuk) || 0,
          yuksek: parseFloat(item.yuksek) || 0,
          kapanis: parseFloat(item.kapanis) || 0,
          tarih: item.tarih || new Date().toISOString(),
          source: 'primary'
        };
      });

      if (!isConnectedPrimary) {
        isConnectedPrimary = true;
        console.log('✅ Birincil API bağlantısı başarılı!');
      }
      lastUpdatePrimary = Date.now();

      return prices;
    }
    return null;
  } catch (error) {
    if (isConnectedPrimary) {
      isConnectedPrimary = false;
      console.error('❌ Birincil API bağlantı hatası:', error.message);
    }
    return null;
  }
};

// Backward compatibility
const fetchPricesFromAPI = fetchPricesFromPrimaryAPI;

// ============================================
// YEDEK API'den fiyat çek (API 2 - Saglamoglu)
// ============================================
const fetchPricesFromBackupAPI = async () => {
  try {
    const response = await axios.get(API_URL_BACKUP, { timeout: 10000 });

    // Saglamoglu API yapısı: { status: true, tabGroup: { tabs: [...] } }
    if (response.data && response.data.status && response.data.tabGroup && response.data.tabGroup.tabs) {
      const prices = [];

      // Tüm tab'ları dolaş
      for (const tab of response.data.tabGroup.tabs) {
        if (!tab.products) continue;

        for (const product of tab.products) {
          const name = product.name || product.slug || '';
          const mappedCode = api2CodeMapping[name];

          // Forex verisini al
          const forex = product.forex || {};
          // Saglamoglu'nda groups array içinde bid/ask var
          const group = forex.groups && forex.groups[0] ? forex.groups[0] : forex;
          const bid = parseFloat(group.bid) || 0; // Satış (alıcının teklifi = sizin satış fiyatınız)
          const ask = parseFloat(group.ask) || 0; // Alış (satıcının istediği = sizin alış fiyatınız)

          if (bid > 0 && ask > 0) {
            prices.push({
              code: mappedCode || name, // Eşleşme yoksa orijinal adı kullan
              name: name,
              alis: ask,
              satis: bid,
              rawAlis: ask,
              rawSatis: bid,
              direction: {},
              dusuk: parseFloat(forex.lastLow) || 0,
              yuksek: parseFloat(forex.lastHigh) || 0,
              kapanis: parseFloat(forex.lastClose) || 0,
              tarih: new Date().toISOString(),
              source: 'backup'
            });
          }
        }
      }

      if (prices.length > 0) {
        if (!isConnectedBackup) {
          isConnectedBackup = true;
          console.log(`✅ Yedek API bağlantısı başarılı! (${prices.length} ürün)`);
        }
        lastUpdateBackup = Date.now();
        return prices;
      }
    }
    return null;
  } catch (error) {
    if (isConnectedBackup) {
      isConnectedBackup = false;
      console.error('❌ Yedek API bağlantı hatası:', error.message);
    }
    return null;
  }
};

// ============================================
// Fallback kontrolü - 30 dk birincil kaynak gelmezse yedek kaynağa geç
// ============================================
const checkFallback = async () => {
  const now = Date.now();

  // Birincil kaynak belirlenen süre güncellenmedi mi?
  if (lastUpdatePrimary && (now - lastUpdatePrimary > fallbackTimeoutMs)) {
    if (activeGlobalSource === 'primary') {
      console.log(`⚠️ Birincil kaynak ${Math.round(fallbackTimeoutMs/60000)} dk güncellenmedi, yedek kaynağa geçiliyor...`);
      activeGlobalSource = 'backup';

      // Tüm custom price'ları yedek kaynağa geçir (manuel override olmayanları)
      try {
        const CustomPrice = require('../models/CustomPrice');
        await CustomPrice.updateMany(
          { manualSourceOverride: { $ne: true } },
          { activeSource: 'backup' }
        );
        console.log('✅ Tüm fiyatlar yedek kaynağa geçirildi');
      } catch (err) {
        console.error('❌ Kaynak geçiş hatası:', err.message);
      }
    }
  }

  // Birincil kaynak geri geldi mi? (sadece manuel override yoksa otomatik dön)
  if (lastUpdatePrimary && (now - lastUpdatePrimary < 60000) && activeGlobalSource === 'backup' && !manualGlobalOverride) {
    console.log('✅ Birincil kaynak geri geldi, birincil kaynağa dönülüyor...');
    activeGlobalSource = 'primary';

    // Tüm custom price'ları birincil kaynağa geçir (manuel override olmayanları)
    try {
      const CustomPrice = require('../models/CustomPrice');
      await CustomPrice.updateMany(
        { manualSourceOverride: { $ne: true } },
        { activeSource: 'primary' }
      );
      console.log('✅ Tüm fiyatlar birincil kaynağa döndürüldü');
    } catch (err) {
      console.error('❌ Kaynak geçiş hatası:', err.message);
    }
  }
};

// ============================================
// Manuel kaynak değiştirme
// ============================================
const switchSource = async (priceCode, newSource) => {
  try {
    const CustomPrice = require('../models/CustomPrice');
    await CustomPrice.findOneAndUpdate(
      { code: priceCode },
      {
        activeSource: newSource,
        manualSourceOverride: true
      }
    );
    console.log(`🔄 ${priceCode} için kaynak değiştirildi: ${newSource}`);

    // Fiyatları yeniden hesapla
    await refreshPrices();

    return { success: true };
  } catch (err) {
    console.error('❌ Kaynak değiştirme hatası:', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================
// Tüm kaynakları manuel değiştirme
// ============================================
const switchAllSources = async (newSource) => {
  try {
    const CustomPrice = require('../models/CustomPrice');
    await CustomPrice.updateMany(
      {},
      {
        activeSource: newSource,
        manualSourceOverride: true
      }
    );
    activeGlobalSource = newSource;
    manualGlobalOverride = true; // Manuel değişiklik yapıldı, otomatik geri dönüşü engelle
    console.log(`🔄 Tüm fiyatlar için kaynak değiştirildi: ${newSource} (manuel override aktif)`);

    // Fiyatları yeniden hesapla
    await refreshPrices();

    return { success: true };
  } catch (err) {
    console.error('❌ Toplu kaynak değiştirme hatası:', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================
// API durumunu getir
// ============================================
const getApiStatus = () => {
  return {
    primary: {
      connected: isConnectedPrimary,
      lastUpdate: lastUpdatePrimary,
      url: API_URL_PRIMARY
    },
    backup: {
      connected: isConnectedBackup,
      lastUpdate: lastUpdateBackup,
      url: API_URL_BACKUP
    },
    activeSource: activeGlobalSource,
    fallbackTimeout: fallbackTimeoutMs,
    fallbackTimeoutMinutes: Math.round(fallbackTimeoutMs / 60000)
  };
};

// ============================================
// Fallback timeout'u güncelle (dakika cinsinden)
// ============================================
const setFallbackTimeout = (minutes) => {
  const ms = Math.max(1, parseInt(minutes) || 30) * 60 * 1000;
  fallbackTimeoutMs = ms;
  console.log(`⏱️ Fallback timeout güncellendi: ${minutes} dakika (${ms}ms)`);
  return { success: true, minutes, ms: fallbackTimeoutMs };
};

// ============================================
// HTTP API Polling başlat (Her iki API için)
// ============================================
const startVpsWebSocket = (io) => {
  serverIO = io;

  console.log('========================================');
  console.log('  DUAL API POLLING SYSTEM');
  console.log('========================================');
  console.log(`Birincil API: ${API_URL_PRIMARY}`);
  console.log(`Yedek API: ${API_URL_BACKUP}`);
  console.log(`Poll Interval: ${POLL_INTERVAL}ms`);
  console.log(`Fallback Timeout: ${fallbackTimeoutMs / 60000} dakika`);

  // Mevcut timer'ları temizle
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (pollTimerBackup) {
    clearInterval(pollTimerBackup);
    pollTimerBackup = null;
  }

  // Birincil API polling
  const pollPrimaryPrices = async () => {
    const prices = await fetchPricesFromPrimaryAPI();
    if (prices && prices.length > 0) {
      await handleVpsPrices({ prices, source: 'primary' });
    }
    // Fallback kontrolü
    await checkFallback();
  };

  // Yedek API polling
  const pollBackupPrices = async () => {
    const prices = await fetchPricesFromBackupAPI();
    if (prices && prices.length > 0) {
      await saveBackupSourcePrices(prices);
    }
  };

  // İlk çekimler
  pollPrimaryPrices();
  pollBackupPrices();

  // Periyodik polling başlat
  pollTimer = setInterval(pollPrimaryPrices, POLL_INTERVAL);
  pollTimerBackup = setInterval(pollBackupPrices, POLL_INTERVAL * 2); // Yedek için 2x interval

  console.log('🔄 Dual API polling başlatıldı');
};

const stopVpsWebSocket = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (pollTimerBackup) {
    clearInterval(pollTimerBackup);
    pollTimerBackup = null;
  }
  isConnectedPrimary = false;
  isConnectedBackup = false;
  console.log('⏹️ Dual API polling durduruldu');
};

// ============================================
// Yedek kaynak fiyatlarını ayrı kaydet
// ============================================
const saveBackupSourcePrices = async (apiPrices) => {
  if (!apiPrices || !Array.isArray(apiPrices) || apiPrices.length === 0) return null;

  try {
    // Yedek fiyatları ayrı key ile kaydet
    await SourcePrices.findOneAndUpdate(
      { key: 'backup_source_prices' },
      {
        key: 'backup_source_prices',
        prices: apiPrices.map(item => ({
          code: item.code,
          name: item.name || item.code,
          rawAlis: parseFloat(item.rawAlis || item.alis || 0),
          rawSatis: parseFloat(item.rawSatis || item.satis || 0),
          direction: item.direction || {},
          tarih: item.tarih || new Date().toISOString()
        })),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`💾 Yedek: ${apiPrices.length} fiyat kaydedildi`);
    return apiPrices;
  } catch (err) {
    console.error('❌ Yedek kaynak fiyat kaydetme hatası:', err.message);
    return null;
  }
};

// ============================================
// Yedek kaynak fiyatlarını getir
// ============================================
const getBackupSourcePrices = async () => {
  try {
    const source = await SourcePrices.findOne({ key: 'backup_source_prices' });
    if (source && source.prices) {
      return source.prices;
    }
  } catch (err) {
    console.error('❌ Yedek kaynak fiyat çekme hatası:', err.message);
  }
  return [];
};

// Eski fonksiyonlar backward compatibility için
const startPolling = startVpsWebSocket;
const stopPolling = stopVpsWebSocket;

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
  startVpsWebSocket,
  stopVpsWebSocket,
  startPolling,
  stopPolling,
  getCurrentPrices,
  refreshPrices,
  getSourcePrices,
  getBackupSourcePrices,
  handleWebhook,
  getWebhookSecret,
  isConnected,
  // Yedek kaynak fonksiyonları
  switchSource,
  switchAllSources,
  getApiStatus,
  setFallbackTimeout,
  // Backward compatibility
  startWebSocket: startVpsWebSocket,
  stopWebSocket: stopVpsWebSocket,
  calculatePrice: (rawPrice, coefficient) => {
    if (!coefficient || rawPrice === null || rawPrice === undefined) {
      return parseFloat(rawPrice) || 0;
    }
    return (parseFloat(rawPrice) * coefficient.multiplier) + coefficient.addition;
  }
};
