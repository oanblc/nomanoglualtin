const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const BusinessCoefficient = require('../models/BusinessCoefficient');
const Settings = require('../models/Settings');
const priceService = require('../services/priceService');
const { businessAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// İşletme şifresi ile giriş
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Şifre gerekli' });
    }

    const settings = await Settings.findOne({ key: 'app_settings' });
    if (!settings || !settings.businessPassword) {
      return res.status(503).json({
        success: false,
        message: 'İşletme girişi henüz ayarlanmamış'
      });
    }

    const stored = settings.businessPassword;
    let passwordOk = false;

    if (stored.startsWith('$2')) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      // Eski düz metin kayıt — kontrol et, başarılıysa arka planda hash'e çevir
      passwordOk = (password === stored);
      if (passwordOk) {
        settings.businessPassword = await bcrypt.hash(password, 10);
        await settings.save();
        console.log('✓ businessPassword otomatik olarak bcrypt\'e çevrildi');
      }
    }

    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Geçersiz şifre' });
    }

    const token = jwt.sign(
      { role: 'business' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, message: 'Giriş başarılı' });
  } catch (error) {
    console.error('Business login hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Token doğrula
router.get('/verify', businessAuthMiddleware, (req, res) => {
  res.json({ success: true });
});

// Anlık hesaplanmış işletme fiyatları (override uygulanmış)
router.get('/prices', businessAuthMiddleware, async (req, res) => {
  try {
    const normalPrices = priceService.getCurrentPrices();
    const businessPrices = await priceService.calculateBusinessPrices(normalPrices);
    res.json({ success: true, data: businessPrices });
  } catch (error) {
    console.error('Business prices hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Tüm override'ları getir
router.get('/coefficients', businessAuthMiddleware, async (req, res) => {
  try {
    const overrides = await BusinessCoefficient.find().lean();
    res.json({ success: true, data: overrides });
  } catch (error) {
    console.error('Business coefficients hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Tek ürün için override upsert
// Body: { code, alisMultiplier?, alisAddition?, satisMultiplier?, satisAddition? }
// null/undefined/boş string gönderirse ilgili alan temizlenir (normal değere döner)
router.put('/coefficients', businessAuthMiddleware, async (req, res) => {
  try {
    const { code, alisMultiplier, alisAddition, satisMultiplier, satisAddition } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kod gerekli' });
    }

    const normalize = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    const update = {
      alisMultiplier: normalize(alisMultiplier),
      alisAddition: normalize(alisAddition),
      satisMultiplier: normalize(satisMultiplier),
      satisAddition: normalize(satisAddition)
    };

    const doc = await BusinessCoefficient.findOneAndUpdate(
      { code },
      { $set: { ...update, code } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // İşletme fiyatlarını yeniden yayınla
    const normalPrices = priceService.getCurrentPrices();
    priceService.emitBusinessPrices(normalPrices, { source: 'override-update' });

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Business override güncelleme hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Override sil (tamamen normale döner)
router.delete('/coefficients/:code', businessAuthMiddleware, async (req, res) => {
  try {
    await BusinessCoefficient.findOneAndDelete({ code: req.params.code });
    const normalPrices = priceService.getCurrentPrices();
    priceService.emitBusinessPrices(normalPrices, { source: 'override-delete' });
    res.json({ success: true });
  } catch (error) {
    console.error('Business override silme hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
