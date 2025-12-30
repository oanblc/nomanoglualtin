const express = require('express');
const CustomPrice = require('../models/CustomPrice');
const priceService = require('../services/priceService');
const { authMiddleware } = require('../middleware/auth');
const { customPriceValidation, idParamValidation } = require('../middleware/validation');

module.exports = (io) => {
  const router = express.Router();

// Tüm custom fiyatları getir
router.get('/', async (req, res) => {
  try {
    const prices = await CustomPrice.find().sort({ order: 1 });
    // _id'yi id'ye dönüştür (frontend uyumluluğu için)
    const formattedPrices = prices.map(price => ({
      ...price.toObject(),
      id: price._id.toString()
    }));
    res.json({
      success: true,
      data: formattedPrices
    });
  } catch (error) {
    console.error('Custom price getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// ID ile custom fiyat getir
router.get('/:id', async (req, res) => {
  try {
    const price = await CustomPrice.findById(req.params.id);
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiyat bulunamadı' 
      });
    }
    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    console.error('Custom price getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Yeni custom fiyat oluştur (Admin korumalı + validation)
router.post('/', authMiddleware, customPriceValidation, async (req, res) => {
  try {
    const price = new CustomPrice(req.body);
    await price.save();
    console.log('✅ Yeni custom fiyat oluşturuldu:', price.code);
    
    // Fiyatları hemen yeniden hesapla ve broadcast et
    await priceService.refreshPrices();
    
    res.status(201).json({
      success: true,
      data: price,
      message: 'Fiyat başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Custom price oluşturma hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: error.code === 11000 ? 'Bu kod zaten kullanılıyor' : 'Oluşturma başarısız',
      error: error.message 
    });
  }
});

// Custom fiyat güncelle (Admin korumalı + validation)
router.put('/:id', authMiddleware, idParamValidation, customPriceValidation, async (req, res) => {
  try {
    const price = await CustomPrice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiyat bulunamadı' 
      });
    }
    
    console.log('✅ Custom fiyat güncellendi:', price.code);
    
    // Fiyatları hemen yeniden hesapla ve broadcast et
    await priceService.refreshPrices();
    
    res.json({
      success: true,
      data: price,
      message: 'Fiyat başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Custom price güncelleme hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
      error: error.message 
    });
  }
});

// Custom fiyat sil (Admin korumalı + validation)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const price = await CustomPrice.findByIdAndDelete(req.params.id);
    
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fiyat bulunamadı' 
      });
    }
    
    console.log('✅ Custom fiyat silindi:', price.code);
    
    // Fiyatları hemen yeniden hesapla ve broadcast et
    await priceService.refreshPrices();
    
    res.json({
      success: true,
      message: 'Fiyat başarıyla silindi'
    });
  } catch (error) {
    console.error('Custom price silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Silme başarısız',
      error: error.message 
    });
  }
});

  return router;
};

