const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginValidation, employeeLoginValidation } = require('../middleware/validation');
const Settings = require('../models/Settings');

// Admin login (validation ile korumalı)
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli' });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPasswordPlain = process.env.ADMIN_PASSWORD;

    if (!adminUsername || (!adminHash && !adminPasswordPlain)) {
      console.error('Admin kimliği yapılandırılmamış (ADMIN_USERNAME + ADMIN_PASSWORD_HASH veya ADMIN_PASSWORD gerekli)');
      return res.status(500).json({ message: 'Sunucu yapılandırma hatası' });
    }

    if (username !== adminUsername) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    let passwordOk = false;
    if (adminHash) {
      passwordOk = await bcrypt.compare(password, adminHash);
    } else {
      // Geçiş dönemi: henüz ADMIN_PASSWORD_HASH tanımlı değil
      passwordOk = (password === adminPasswordPlain);
      if (passwordOk) {
        console.warn('⚠️ ADMIN_PASSWORD_HASH tanımlı değil — plain fallback kullanıldı. Railway env\'e hash ekleyip ADMIN_PASSWORD\'ü silin.');
      }
    }

    if (!passwordOk) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Giriş başarılı'
    });
  } catch (error) {
    console.error('Login hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Token doğrulama
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, message: 'Token geçerli' });
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
});

// Çalışan girişi (ortak şifre ile)
router.post('/employee-login', employeeLoginValidation, async (req, res) => {
  try {
    const { password } = req.body;

    const settings = await Settings.findOne({ key: 'app_settings' });

    if (!settings || !settings.employeePassword) {
      return res.status(503).json({
        success: false,
        message: 'Çalışan girişi henüz ayarlanmamış'
      });
    }

    const stored = settings.employeePassword;
    let passwordOk = false;

    if (stored.startsWith('$2')) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      // Eski düz metin kayıt — kontrol et, başarılıysa arka planda hash'e çevir
      passwordOk = (password === stored);
      if (passwordOk) {
        settings.employeePassword = await bcrypt.hash(password, 10);
        await settings.save();
        console.log('✓ employeePassword otomatik olarak bcrypt\'e çevrildi');
      }
    }

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz şifre'
      });
    }

    const token = jwt.sign(
      { role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      message: 'Giriş başarılı'
    });
  } catch (error) {
    console.error('Employee login hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;

