const { io: SocketIOClient } = require('socket.io-client');
const axios = require('axios');
const Coefficient = require('../models/Coefficient');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePrices = require('../models/SourcePrices');

let currentPrices = {};
let haremSocket = null;
let serverIO = null;
let lastRawData = null;
let pollingInterval = null; // Son alınan ham veriyi sakla

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

// Harem Altın'dan gelen veriyi standart formata çevir
const normalizeHaremData = (haremData) => {
  if (!haremData || typeof haremData !== 'object') {
    console.log('⚠️ Geçersiz Harem data formatı');
    return null;
  }

  // Eğer data field'ı varsa (nested format), onu kullan
  const priceData = haremData.data || haremData;

  const normalized = {
    meta: haremData.meta || {
      time: new Date().toISOString(),
      source: 'harem_altin'
    },
    data: {}
  };

  // Harem Altın data formatını kendi formatımıza çevir
  // Sadece "code" field'ı olan objeler fiyattır
  Object.keys(priceData).forEach(key => {
    const item = priceData[key];
    if (item && typeof item === 'object' && item.code) {
      normalized.data[key] = {
        alis: parseFloat(item.alis || 0),
        satis: parseFloat(item.satis || 0),
        dir: item.dir || {},
        dusuk: parseFloat(item.dusuk || 0),
        yuksek: parseFloat(item.yuksek || 0),
        kapanis: parseFloat(item.kapanis || 0),
        tarih: item.tarih || new Date().toISOString()
      };
    }
  });

  return normalized;
};

// Katsayıları uygula ve fiyat hesapla
const calculatePrice = (rawPrice, coefficient) => {
  if (!coefficient || rawPrice === null || rawPrice === undefined) {
    return parseFloat(rawPrice) || 0;
  }
  // Formül: (rawPrice * multiplier) + addition
  return (parseFloat(rawPrice) * coefficient.multiplier) + coefficient.addition;
};

// Custom fiyatları yükle (MongoDB'den)
const loadCustomPrices = async () => {
  try {
    const CustomPrice = require('../models/CustomPrice');
    const mongoose = require('mongoose');
    
    // MongoDB bağlantısı varsa
    if (mongoose.connection.readyState === 1) {
      const customPrices = await CustomPrice.find({ isVisible: true }).sort({ order: 1 });
      console.log(`🔍 MongoDB'den ${customPrices.length} custom fiyat bulundu`);
      return customPrices.map(cp => cp.toObject());
    } else {
      console.log('⚠️ MongoDB bağlantısı yok (readyState:', mongoose.connection.readyState, ')');
    }
  } catch (error) {
    console.error('⚠️ Custom fiyatlar yüklenemedi:', error);
  }
  return [];
};

// Tüm fiyatları hesapla
const processPrices = async (rawData) => {
  if (!rawData || !rawData.data) {
    console.log('⚠️ processPrices: rawData veya rawData.data boş');
    return null;
  }

  let coefficients = [];
  // MongoDB kontrolü - eğer bağlı değilse skip et
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    try {
      coefficients = await Coefficient.find({});
    } catch (error) {
      console.log('⚠️ Katsayı çekme hatası:', error.message);
    }
  } else {
    console.log('⚠️ MongoDB bağlantısı yok, katsayısız çalışıyor');
  }
  
  const coefficientMap = {};
  
  // Katsayıları map'e çevir (code-type kombinasyonu ile)
  coefficients.forEach(coef => {
    const key = `${coef.code}_${coef.type}`;
    coefficientMap[key] = coef;
  });

  // Custom fiyatları yükle (MongoDB'den)
  const customPrices = await loadCustomPrices();
  console.log(`📋 ${customPrices.length} custom fiyat yüklendi`);

  const processedPrices = [];

  for (const [code, priceData] of Object.entries(rawData.data)) {
    const alisCoef = coefficientMap[`${code}_alis`];
    const satisCoef = coefficientMap[`${code}_satis`];

    const rawAlis = parseFloat(priceData.alis);
    const rawSatis = parseFloat(priceData.satis);

    const calculatedAlis = alisCoef ? calculatePrice(rawAlis, alisCoef) : rawAlis;
    const calculatedSatis = satisCoef ? calculatePrice(rawSatis, satisCoef) : rawSatis;

    const productData = {
      id: code, // Ham API fiyatları için ID olarak code kullan
      code,
      name: productNames[code] || code,
      category: categorizeProduct(code),
      rawAlis,
      rawSatis,
      calculatedAlis,
      calculatedSatis,
      direction: priceData.dir || {},
      dusuk: priceData.dusuk,
      yuksek: priceData.yuksek,
      kapanis: priceData.kapanis,
      tarih: priceData.tarih,
      isVisible: alisCoef?.isVisible ?? satisCoef?.isVisible ?? true,
      order: alisCoef?.order ?? satisCoef?.order ?? 0,
      hasAlisCoef: !!alisCoef,
      hasSatisCoef: !!satisCoef,
      isCustom: false // Ham API fiyatı
    };

    processedPrices.push(productData);

    // Fiyat geçmişine kaydet (sadece değişiklik varsa)
    try {
      const lastPrice = currentPrices[code];
      if (!lastPrice || lastPrice.rawAlis !== rawAlis || lastPrice.rawSatis !== rawSatis) {
        await PriceHistory.create({
          code,
          rawAlis,
          rawSatis,
          calculatedAlis,
          calculatedSatis,
          direction: priceData.dir
        });
      }
    } catch (error) {
      // MongoDB yoksa devam et
    }
  }

  // Custom fiyatları işle ve ekle
  customPrices.forEach(customPrice => {
    const alisSourceCode = customPrice.alisConfig?.sourceCode;
    const satisSourceCode = customPrice.satisConfig?.sourceCode;
    
    const alisSourceData = rawData.data[alisSourceCode];
    const satisSourceData = rawData.data[satisSourceCode];

    if (alisSourceData && satisSourceData) {
      // Alış için kaynak fiyatı seç (alis veya satis)
      const alisSourcePrice = customPrice.alisConfig.sourceType === 'alis' 
        ? alisSourceData.alis 
        : alisSourceData.satis;
      
      // Satış için kaynak fiyatı seç (alis veya satis)
      const satisSourcePrice = customPrice.satisConfig.sourceType === 'alis'
        ? satisSourceData.alis
        : satisSourceData.satis;

      const calculatedAlis = (parseFloat(alisSourcePrice) * customPrice.alisConfig.multiplier) + customPrice.alisConfig.addition;
      const calculatedSatis = (parseFloat(satisSourcePrice) * customPrice.satisConfig.multiplier) + customPrice.satisConfig.addition;

      const productData = {
        id: customPrice._id?.toString() || customPrice.id,
        code: customPrice.code,
        name: customPrice.name,
        category: customPrice.category,
        rawAlis: parseFloat(alisSourcePrice),
        rawSatis: parseFloat(satisSourcePrice),
        calculatedAlis,
        calculatedSatis,
        direction: alisSourceData.dir || satisSourceData.dir || {},
        dusuk: alisSourceData.dusuk,
        yuksek: alisSourceData.yuksek,
        kapanis: alisSourceData.kapanis,
        tarih: alisSourceData.tarih,
        isVisible: customPrice.isVisible !== false,
        order: customPrice.order ?? 999,
        hasAlisCoef: true,
        hasSatisCoef: true,
        isCustom: true
      };

      processedPrices.push(productData);
    }
  });

  // Sırala (order'a göre)
  processedPrices.sort((a, b) => a.order - b.order);

  console.log(`✅ ${processedPrices.length} fiyat işlendi (${customPrices.length} custom)`);

  return {
    meta: rawData.meta,
    prices: processedPrices
  };
};

// Harem Altın WebSocket bağlantısını başlat
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

  haremSocket.on('connect_error', (error) => {
    console.error('❌ Harem Altın bağlantı hatası:', error.message);
  });

  // Fiyat güncellemelerini dinle - olası event isimleri
  const priceEvents = ['priceUpdate', 'prices', 'data', 'update', 'price', 'fiyat', 'price_changed', 'priceChanged'];
  
  priceEvents.forEach(eventName => {
    haremSocket.on(eventName, async (data) => {
      console.log(`📊 Harem Altın'dan ${eventName} event'i alındı`);
      await handlePriceData(data);
    });
  });

  // Tüm event'leri yakala (debug için)
  haremSocket.onAny(async (eventName, data) => {
    if (!priceEvents.includes(eventName) && !['connect', 'disconnect', 'error'].includes(eventName)) {
      console.log(`📡 Bilinmeyen event: ${eventName}`);
      // Eğer data fiyat gibi görünüyorsa işle
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        await handlePriceData(data);
      }
    }
  });
};

// Gelen fiyat datasını işle
const handlePriceData = async (rawData) => {
  try {
    console.log('🔍 HAM VERI:', JSON.stringify(rawData).substring(0, 500)); // İlk 500 karakter
    
    const normalized = normalizeHaremData(rawData);
    if (!normalized || !normalized.data || Object.keys(normalized.data).length === 0) {
      console.log('⚠️ Normalize edilmiş data boş');
      return;
    }

    // Son veriyi sakla (custom fiyat refresh için)
    lastRawData = normalized;

    console.log(`✅ ${Object.keys(normalized.data).length} fiyat normalize edildi`);
    console.log('📊 Normalize edilmiş kodlar:', Object.keys(normalized.data).join(', '));
    
    const processedData = await processPrices(normalized);
    if (processedData && processedData.prices) {
      console.log(`✅ ${processedData.prices.length} fiyat işlendi`);
      
      currentPrices = processedData.prices.reduce((acc, price) => {
        acc[price.code] = price;
        return acc;
      }, {});

      // Tüm bağlı clientlara gönder
      if (serverIO) {
        // Sadece geçerli fiyatlar varsa yayınla
        const validPrices = processedData.prices.filter(p =>
          p.calculatedAlis > 0 &&
          p.calculatedSatis > 0 &&
          !isNaN(p.calculatedAlis) &&
          !isNaN(p.calculatedSatis)
        );

        if (validPrices.length > 0) {
          const dataToEmit = {
            ...processedData,
            prices: validPrices
          };
          serverIO.emit('priceUpdate', dataToEmit);
          console.log(`📡 ${validPrices.length} geçerli fiyat WebSocket'e yayınlandı`);

          // Fiyatları MongoDB'ye cache olarak kaydet
          const mongoose = require('mongoose');
          if (mongoose.connection.readyState === 1) {
            // Sadece custom ve görünür fiyatları cache'e kaydet
            const customPrices = validPrices.filter(p => p.isCustom && p.isVisible !== false);
            if (customPrices.length > 0) {
              CachedPrices.findOneAndUpdate(
                { key: 'current_prices' },
                {
                  key: 'current_prices',
                  prices: customPrices.map(p => ({
                    code: p.code,
                    name: p.name,
                    category: p.category,
                    calculatedAlis: p.calculatedAlis,
                    calculatedSatis: p.calculatedSatis,
                    isCustom: p.isCustom,
                    isVisible: p.isVisible,
                    order: p.order,
                    tarih: p.tarih || new Date().toISOString()
                  })),
                  meta: {
                    time: new Date().toISOString(),
                    maxDisplayItems: customPrices.length
                  },
                  updatedAt: new Date()
                },
                { upsert: true, new: true }
              ).then(() => {
                console.log(`💾 ${customPrices.length} custom fiyat cache'e kaydedildi`);
              }).catch(err => {
                console.error('❌ Cache kaydetme hatası:', err.message);
              });
            }

            // Tüm geçerli fiyatları (custom + normal) ayrı bir key ile kaydet
            CachedPrices.findOneAndUpdate(
              { key: 'all_prices' },
              {
                key: 'all_prices',
                prices: validPrices.map(p => ({
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
                  tarih: p.tarih || new Date().toISOString()
                })),
                meta: {
                  time: new Date().toISOString(),
                  count: validPrices.length
                },
                updatedAt: new Date()
              },
              { upsert: true, new: true }
            ).then(() => {
              console.log(`💾 ${validPrices.length} toplam fiyat all_prices cache'e kaydedildi`);
            }).catch(err => {
              console.error('❌ All prices cache kaydetme hatası:', err.message);
            });

            // Kaynak fiyatları (ham API fiyatları) - mevcut fiyatları koru, sadece güncelle/ekle
            const newSourcePrices = validPrices.filter(p => p.isCustom === false);
            if (newSourcePrices.length > 0) {
              // Önce mevcut fiyatları oku
              SourcePrices.findOne({ key: 'source_prices' }).then(existing => {
                // Mevcut fiyatları map'e çevir
                const priceMap = {};
                if (existing && existing.prices) {
                  existing.prices.forEach(p => {
                    priceMap[p.code] = {
                      code: p.code,
                      name: p.name,
                      rawAlis: p.rawAlis,
                      rawSatis: p.rawSatis
                    };
                  });
                }

                // Yeni gelen fiyatları üzerine yaz veya ekle
                newSourcePrices.forEach(p => {
                  priceMap[p.code] = {
                    code: p.code,
                    name: p.name,
                    rawAlis: p.rawAlis,
                    rawSatis: p.rawSatis
                  };
                });

                // Map'i array'e çevir ve kaydet
                const mergedPrices = Object.values(priceMap);

                return SourcePrices.findOneAndUpdate(
                  { key: 'source_prices' },
                  {
                    key: 'source_prices',
                    prices: mergedPrices,
                    updatedAt: new Date()
                  },
                  { upsert: true, new: true }
                );
              }).then(() => {
                console.log(`💾 Kaynak fiyatlar güncellendi (${newSourcePrices.length} yeni/güncellenen)`);
              }).catch(err => {
                console.error('❌ Kaynak fiyat kaydetme hatası:', err.message);
              });
            }
          }
        } else {
          console.log('⚠️ Geçerli fiyat yok, broadcast edilmedi');
        }
      }
    }
  } catch (error) {
    console.error('❌ Fiyat işleme hatası:', error);
  }
};

// WebSocket bağlantısını kapat
const stopWebSocket = () => {
  if (haremSocket) {
    haremSocket.disconnect();
    haremSocket = null;
    console.log('⏹️ Harem Altın WebSocket bağlantısı kapatıldı');
  }
};

// Mevcut fiyatları getir
const getCurrentPrices = () => {
  return Object.values(currentPrices);
};

// Custom fiyatlar değiştiğinde fiyatları yeniden yükle ve broadcast et
const refreshPrices = async () => {
  console.log('🔄 Custom fiyatlar değişti, fiyatlar yeniden yükleniyor...');

  if (!lastRawData) {
    console.log('⚠️ Henüz ham veri yok, bir sonraki güncellemede dahil edilecek');
    return false;
  }

  // Son alınan ham veriyi tekrar işle
  try {
    const processedData = await processPrices(lastRawData);
    if (processedData && processedData.prices) {
      console.log(`✅ ${processedData.prices.length} fiyat yeniden işlendi`);

      currentPrices = processedData.prices.reduce((acc, price) => {
        acc[price.code] = price;
        return acc;
      }, {});

      // Tüm bağlı clientlara gönder
      if (serverIO) {
        serverIO.emit('priceUpdate', processedData);
        console.log('📡 Güncellenmiş fiyatlar broadcast edildi');
      }

      // Cache'e de kaydet (yeni eklenen fiyatların hemen görünmesi için)
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const validPrices = processedData.prices.filter(p =>
          p.calculatedAlis > 0 &&
          p.calculatedSatis > 0 &&
          !isNaN(p.calculatedAlis) &&
          !isNaN(p.calculatedSatis)
        );

        const customPrices = validPrices.filter(p => p.isCustom && p.isVisible !== false);
        if (customPrices.length > 0) {
          await CachedPrices.findOneAndUpdate(
            { key: 'current_prices' },
            {
              key: 'current_prices',
              prices: customPrices.map(p => ({
                code: p.code,
                name: p.name,
                category: p.category,
                calculatedAlis: p.calculatedAlis,
                calculatedSatis: p.calculatedSatis,
                isCustom: p.isCustom,
                isVisible: p.isVisible,
                order: p.order,
                tarih: p.tarih || new Date().toISOString()
              })),
              meta: {
                time: new Date().toISOString(),
                maxDisplayItems: customPrices.length
              },
              updatedAt: new Date()
            },
            { upsert: true, new: true }
          );
          console.log(`💾 ${customPrices.length} custom fiyat cache'e kaydedildi (refresh)`);
        }
      }

      return true;
    }
  } catch (error) {
    console.error('❌ Fiyat refresh hatası:', error);
  }
  return false;
};

module.exports = {
  startWebSocket,
  stopWebSocket,
  getCurrentPrices,
  calculatePrice,
  refreshPrices,
  // Backward compatibility
  startPolling: startWebSocket,
  stopPolling: stopWebSocket
};

