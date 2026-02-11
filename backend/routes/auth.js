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

    // Kullanıcı adı ve şifreyi environment variable ile karşılaştır
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // JWT token oluştur
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
    console.error('Login hatası:', error);
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

    if (password !== settings.employeePassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz şifre'
      });
    }

    const token = jwt.sign(
      { role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      message: 'Giriş başarılı'
    });
  } catch (error) {
    console.error('Employee login hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;

