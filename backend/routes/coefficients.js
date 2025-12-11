const express = require('express');
const router = express.Router();
const Coefficient = require('../models/Coefficient');
const { authMiddleware } = require('../middleware/auth');

// Tüm katsayıları getir
router.get('/', async (req, res) => {
  try {
    const coefficients = await Coefficient.find().sort({ order: 1, code: 1 });
    res.json({
      success: true,
      data: coefficients
    });
  } catch (error) {
    console.error('Katsayı getirme hatası:', error);
    // MongoDB yoksa boş array döndür
    res.json({
      success: true,
      data: []
    });
  }
});

// Katsayı oluştur veya güncelle (Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, name, type, multiplier, addition, isVisible, order, category } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ message: 'Gerekli alanlar eksik' });
    }

    // Katsayıyı bul veya oluştur
    let coefficient = await Coefficient.findOne({ code, type });

    if (coefficient) {
      // Güncelle
      coefficient.name = name;
      coefficient.multiplier = multiplier !== undefined ? multiplier : coefficient.multiplier;
      coefficient.addition = addition !== undefined ? addition : coefficient.addition;
      coefficient.isVisible = isVisible !== undefined ? isVisible : coefficient.isVisible;
      coefficient.order = order !== undefined ? order : coefficient.order;
      coefficient.category = category || coefficient.category;
      await coefficient.save();
    } else {
      // Yeni oluştur
      coefficient = await Coefficient.create({
        code,
        name,
        type,
        multiplier: multiplier || 1,
        addition: addition || 0,
        isVisible: isVisible !== undefined ? isVisible : true,
        order: order || 0,
        category: category || 'diger'
      });
    }

    res.json({
      success: true,
      data: coefficient,
      message: 'Katsayı kaydedildi'
    });
  } catch (error) {
    console.error('Katsayı kaydetme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Toplu katsayı güncelle (Admin)
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { coefficients } = req.body;

    if (!Array.isArray(coefficients)) {
      return res.status(400).json({ message: 'Geçersiz veri formatı' });
    }

    const results = [];

    for (const coefData of coefficients) {
      const { code, name, type, multiplier, addition, isVisible, order, category } = coefData;

      if (!code || !type) continue;

      let coefficient = await Coefficient.findOne({ code, type });

      if (coefficient) {
        coefficient.name = name || coefficient.name;
        coefficient.multiplier = multiplier !== undefined ? multiplier : coefficient.multiplier;
        coefficient.addition = addition !== undefined ? addition : coefficient.addition;
        coefficient.isVisible = isVisible !== undefined ? isVisible : coefficient.isVisible;
        coefficient.order = order !== undefined ? order : coefficient.order;
        coefficient.category = category || coefficient.category;
        await coefficient.save();
      } else {
        coefficient = await Coefficient.create({
          code,
          name: name || code,
          type,
          multiplier: multiplier || 1,
          addition: addition || 0,
          isVisible: isVisible !== undefined ? isVisible : true,
          order: order || 0,
          category: category || 'diger'
        });
      }

      results.push(coefficient);
    }

    res.json({
      success: true,
      data: results,
      message: `${results.length} katsayı güncellendi`
    });
  } catch (error) {
    console.error('Toplu katsayı güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Katsayı sil (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Coefficient.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Katsayı silindi'
    });
  } catch (error) {
    console.error('Katsayı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;

