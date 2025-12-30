const express = require('express');
const router = express.Router();
const FamilyCard = require('../models/FamilyCard');
const { authMiddleware } = require('../middleware/auth');
const { familyCardValidation, idParamValidation } = require('../middleware/validation');

// Tüm family cards getir
router.get('/', async (req, res) => {
  try {
    const cards = await FamilyCard.find({ isActive: true }).sort({ order: 1 });
    // _id'yi id'ye dönüştür
    const formattedCards = cards.map(card => ({
      ...card.toObject(),
      id: card._id.toString()
    }));
    res.json({
      success: true,
      data: formattedCards
    });
  } catch (error) {
    console.error('Family card getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// ID ile family card getir
router.get('/:id', async (req, res) => {
  try {
    const card = await FamilyCard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kart bulunamadı' 
      });
    }
    res.json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error('Family card getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Yeni family card oluştur (Admin korumalı + validation)
router.post('/', authMiddleware, familyCardValidation, async (req, res) => {
  try {
    const card = new FamilyCard(req.body);
    await card.save();
    console.log('✅ Yeni family card oluşturuldu:', card.title);
    res.status(201).json({
      success: true,
      data: card,
      message: 'Kart başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Family card oluşturma hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Oluşturma başarısız',
      error: error.message 
    });
  }
});

// Family card güncelle (Admin korumalı + validation)
router.put('/:id', authMiddleware, idParamValidation, familyCardValidation, async (req, res) => {
  try {
    const card = await FamilyCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kart bulunamadı' 
      });
    }
    
    console.log('✅ Family card güncellendi:', card.title);
    res.json({
      success: true,
      data: card,
      message: 'Kart başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Family card güncelleme hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
      error: error.message 
    });
  }
});

// Family card sil (Admin korumalı + validation)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const card = await FamilyCard.findByIdAndDelete(req.params.id);
    
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kart bulunamadı' 
      });
    }
    
    console.log('✅ Family card silindi:', card.title);
    res.json({
      success: true,
      message: 'Kart başarıyla silindi'
    });
  } catch (error) {
    console.error('Family card silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Silme başarısız',
      error: error.message 
    });
  }
});

module.exports = router;

