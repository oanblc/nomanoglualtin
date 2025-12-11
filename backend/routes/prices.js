const express = require('express');
const router = express.Router();
const { getCurrentPrices } = require('../services/priceService');
const PriceHistory = require('../models/PriceHistory');

// Mevcut fiyatları getir (ham kaynak fiyatları)
router.get('/current', (req, res) => {
  try {
    const prices = getCurrentPrices();
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Fiyat getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kaynak fiyatları getir (admin panel için - sadece ham API fiyatları)
router.get('/sources', (req, res) => {
  try {
    const prices = getCurrentPrices();
    // Sadece ham API fiyatlarını döndür (custom fiyatları filtrele)
    const sourcePrices = prices.filter(p => !p.isCustom).map(p => ({
      code: p.code,
      name: p.name,
      rawAlis: p.rawAlis,
      rawSatis: p.rawSatis,
      category: p.category
    }));
    
    res.json({
      success: true,
      data: sourcePrices,
      lastUpdate: new Date().toISOString(),
      count: sourcePrices.length
    });
  } catch (error) {
    console.error('Fiyat getirme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Belirli bir ürünün fiyat geçmişini getir
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
    console.error('Fiyat geçmişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;

