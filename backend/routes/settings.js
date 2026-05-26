const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Settings = require('../models/Settings');
const { requirePermission } = require('../middleware/auth');

// Şifre alanını hashle (zaten bcrypt formatındaysa dokunma; boşsa temizle)
const normalizePasswordField = async (value) => {
  if (value === undefined) return undefined; // alan body'de yok → değişmez
  if (value === '' || value === null) return ''; // şifreyi kapatma
  if (typeof value === 'string' && value.startsWith('$2')) return value; // zaten hash
  return await bcrypt.hash(String(value), 10);
};

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
    
    // Public endpoint'ten hassas alanları çıkar
    const settingsObj = settings.toObject();
    delete settingsObj.employeePassword;
    delete settingsObj.businessPassword;

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Settings getirme hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
    });
  }
});

// Admin için tam settings (employeePassword dahil)
router.get('/admin', requirePermission('settings'), async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'app_settings' });
    if (!settings) {
      settings = new Settings({ key: 'app_settings' });
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Admin settings getirme hatası:', error.message);
  }
});

// Settings güncelle (singleton) - Admin korumalı
router.post('/', requirePermission('settings'), async (req, res) => {
  try {
    const payload = { ...req.body };

    // Şifre alanlarını hashle (düz metin geldiyse)
    if ('employeePassword' in payload) {
      payload.employeePassword = await normalizePasswordField(payload.employeePassword);
    }
    if ('businessPassword' in payload) {
      payload.businessPassword = await normalizePasswordField(payload.businessPassword);
    }

    let settings = await Settings.findOne({ key: 'app_settings' });

    if (!settings) {
      settings = new Settings({ key: 'app_settings', ...payload });
    } else {
      Object.assign(settings, payload);
    }

    await settings.save();
    console.log('✅ Settings güncellendi');
    
    res.json({
      success: true,
      data: settings,
      message: 'Ayarlar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Settings güncelleme hatası:', error.message);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
    });
  }
});

module.exports = router;

