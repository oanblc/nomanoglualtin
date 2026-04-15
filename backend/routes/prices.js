const express = require('express');
const router = express.Router();
const {
  getCurrentPrices,
  handleWebhook,
  switchSource,
  switchAllSources,
  getApiStatus,
  getBackupSourcePrices,
  setFallbackTimeout
} = require('../services/priceService');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePrices = require('../models/SourcePrices');

// ============================================
// WEBHOOK: PHP'den anlik fiyat bildirimi al
// ============================================
router.post('/webhook', async (req, res) => {
  try {
    const { prices, secret } = req.body;

    if (!prices || !secret) {
      return res.status(400).json({
        success: false,
        error: 'prices ve secret gerekli'
      });
    }

    // Fiyatlari array formatina donustur (object geldiyse)
    let pricesArray = prices;
    if (!Array.isArray(prices)) {
      pricesArray = Object.entries(prices).map(([code, data]) => ({
        code,
        ...data
      }));
    }

    const result = await handleWebhook(pricesArray, secret);

    if (result.success) {
      res.json({
        success: true,
        message: 'Fiyatlar alindi ve yayinlandi',
        processed: result.processed
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Webhook hatasi:', error.message);
    res.status(500).json({
      success: false,
    });
  }
});

// Mevcut fiyatlari getir (ham kaynak fiyatlari)
router.get('/current', (req, res) => {
  try {
    const prices = getCurrentPrices();
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Fiyat getirme hatasi:', error.message);
    res.status(500).json({ message: 'Sunucu hatasi' });
  }
});

// Kaynak fiyatlari getir (admin panel icin - MongoDB'den)
router.get('/sources', async (req, res) => {
  try {
    const cached = await SourcePrices.findOne({ key: 'source_prices' });

    if (cached && cached.prices && cached.prices.length > 0) {
      res.json({
        success: true,
        data: cached.prices,
        lastUpdate: cached.updatedAt,
        count: cached.prices.length
      });
    } else {
      const prices = getCurrentPrices();
      const sourcePrices = prices.filter(p => !p.isCustom).map(p => ({
        code: p.code,
        name: p.name,
        rawAlis: p.rawAlis,
        rawSatis: p.rawSatis
      }));

      res.json({
        success: true,
        data: sourcePrices,
        lastUpdate: new Date().toISOString(),
        count: sourcePrices.length
      });
    }
  } catch (error) {
    console.error('Kaynak fiyat getirme hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// Belirli bir urunun fiyat gecmisini getir
router.get('/history/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { hours = 24 } = req.query;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(hours));

    const history = await PriceHistory.find({
      code,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).limit(1000);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Fiyat gecmisi hatasi:', error.message);
    res.status(500).json({ message: 'Sunucu hatasi' });
  }
});

// Cached fiyatlari getir (ilk sayfa yuklemesi icin - sadece custom)
router.get('/cached', async (req, res) => {
  try {
    const cached = await CachedPrices.findOne({ key: 'current_prices' });

    if (cached && cached.prices && cached.prices.length > 0) {
      res.json({
        success: true,
        data: {
          prices: cached.prices,
          meta: cached.meta
        },
        updatedAt: cached.updatedAt
      });
    } else {
      const prices = getCurrentPrices();
      const customPrices = prices.filter(p => p.isCustom);

      res.json({
        success: true,
        data: {
          prices: customPrices,
          meta: {
            time: new Date().toISOString(),
            maxDisplayItems: customPrices.length
          }
        },
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Cache fiyat getirme hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// Tum fiyatlari getir (custom + normal - sayfa yuklemesi icin)
router.get('/all', async (req, res) => {
  try {
    const cached = await CachedPrices.findOne({ key: 'all_prices' });

    if (cached && cached.prices && cached.prices.length > 0) {
      res.json({
        success: true,
        data: {
          prices: cached.prices,
          meta: cached.meta
        },
        updatedAt: cached.updatedAt
      });
    } else {
      const prices = getCurrentPrices();

      res.json({
        success: true,
        data: {
          prices: prices,
          meta: {
            time: new Date().toISOString(),
            count: prices.length
          }
        },
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Tum fiyatlari getirme hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// ============================================
// API DURUMU: Birincil ve Yedek API durumunu getir
// ============================================
router.get('/api-status', async (req, res) => {
  try {
    const status = getApiStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('API durum hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// ============================================
// YEDEK KAYNAKLAR: Yedek kaynak fiyatlarini getir
// ============================================
router.get('/backup-sources', async (req, res) => {
  try {
    const backupPrices = await getBackupSourcePrices();
    const cached = await SourcePrices.findOne({ key: 'backup_source_prices' });

    res.json({
      success: true,
      data: backupPrices,
      lastUpdate: cached?.updatedAt,
      count: backupPrices.length
    });
  } catch (error) {
    console.error('Yedek kaynak fiyat hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// ============================================
// KAYNAK DEGISTIR: Tek fiyat icin kaynak degistir
// ============================================
router.post('/switch-source', async (req, res) => {
  try {
    const { priceCode, newSource } = req.body;

    if (!priceCode || !newSource) {
      return res.status(400).json({
        success: false,
        error: 'priceCode ve newSource gerekli'
      });
    }

    if (!['primary', 'backup'].includes(newSource)) {
      return res.status(400).json({
        success: false,
        error: 'newSource "primary" veya "backup" olmali'
      });
    }

    const result = await switchSource(priceCode, newSource);
    res.json(result);
  } catch (error) {
    console.error('Kaynak degistirme hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// ============================================
// TOPLU KAYNAK DEGISTIR: Tum fiyatlar icin kaynak degistir
// ============================================
router.post('/switch-all-sources', async (req, res) => {
  try {
    const { newSource } = req.body;

    if (!newSource) {
      return res.status(400).json({
        success: false,
        error: 'newSource gerekli'
      });
    }

    if (!['primary', 'backup'].includes(newSource)) {
      return res.status(400).json({
        success: false,
        error: 'newSource "primary" veya "backup" olmali'
      });
    }

    const result = await switchAllSources(newSource);
    res.json(result);
  } catch (error) {
    console.error('Toplu kaynak degistirme hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

// ============================================
// FALLBACK TIMEOUT AYARLA: Otomatik geçiş süresi
// ============================================
router.post('/set-fallback-timeout', async (req, res) => {
  try {
    const { minutes } = req.body;

    if (!minutes || isNaN(minutes) || minutes < 1) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir dakika değeri gerekli (en az 1)'
      });
    }

    const result = setFallbackTimeout(parseInt(minutes));
    res.json(result);
  } catch (error) {
    console.error('Fallback timeout ayarlama hatasi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatasi',
    });
  }
});

module.exports = router;
