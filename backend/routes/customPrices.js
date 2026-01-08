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

// Fiyat sıralamasını güncelle (Admin korumalı) - /:id'den ÖNCE olmalı!
router.put('/reorder', authMiddleware, async (req, res) => {
  try {
    const { orders } = req.body; // [{ id: '...', order: 0 }, { id: '...', order: 1 }, ...]

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sıralama verisi'
      });
    }

    console.log('📝 Sıralama güncelleniyor:', orders.map(o => `${o.id}:${o.order}`).join(', '));

    // Her fiyatın order'ını güncelle - { new: true } ile güncellenmiş dökümanı al
    const updatePromises = orders.map(item =>
      CustomPrice.findByIdAndUpdate(
        item.id,
        { order: item.order, updatedAt: new Date() },
        { new: true }
      )
    );

    const updatedDocs = await Promise.all(updatePromises);

    // Tüm güncellemelerin başarılı olduğunu doğrula
    const successCount = updatedDocs.filter(doc => doc !== null).length;
    console.log(`✅ ${successCount}/${orders.length} fiyat sıralaması DB'ye yazıldı`);

    // Kısa bir bekleme - MongoDB'nin tüm replica'lara yazmasını garantile
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fiyatları yeniden hesapla ve broadcast et
    console.log('🔄 refreshPrices çağrılıyor...');
    await priceService.refreshPrices();
    console.log('✅ refreshPrices tamamlandı');

    res.json({
      success: true,
      message: 'Sıralama başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sıralama güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sıralama güncellenemedi',
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

