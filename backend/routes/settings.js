const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authMiddleware } = require('../middleware/auth');

// Settings getir (singleton)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'app_settings' });
    
    // Eğer hiç settings yoksa varsayılanı oluştur
    if (!settings) {
      settings = new Settings({ key: 'app_settings' });
      await settings.save();
      console.log('✅ Varsayılan settings oluşturuldu');
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Settings getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Settings güncelle (singleton) - Admin korumalı
router.post('/', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'app_settings' });
    
    if (!settings) {
      settings = new Settings({ key: 'app_settings', ...req.body });
    } else {
      Object.assign(settings, req.body);
    }
    
    await settings.save();
    console.log('✅ Settings güncellendi');
    
    res.json({
      success: true,
      data: settings,
      message: 'Ayarlar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Settings güncelleme hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
      error: error.message 
    });
  }
});

module.exports = router;

