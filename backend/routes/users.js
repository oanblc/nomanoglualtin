const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { userValidation, idParamValidation } = require('../middleware/validation');
const { SECTION_IDS } = require('../config/sections');

// Yardımcı: kullanıcıyı public biçime çevir (şifre hariç)
const formatUser = (user) => {
  const obj = user.toObject();
  obj.id = user._id.toString();
  delete obj.password;
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Geçerli izinleri süz
const sanitizePermissions = (permissions) =>
  Array.isArray(permissions) ? permissions.filter((p) => SECTION_IDS.includes(p)) : [];

// Tüm kullanıcıları getir (sadece admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(formatUser) });
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Yeni kullanıcı oluştur (sadece admin)
router.post('/', authMiddleware, userValidation, async (req, res) => {
  try {
    const { username, password, name, permissions, isActive } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Şifre gerekli' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const user = new User({
      username: username.trim(),
      password: await bcrypt.hash(password, 10),
      name: name || '',
      permissions: sanitizePermissions(permissions),
      isActive: isActive !== undefined ? isActive : true
    });
    await user.save();

    console.log('✅ Yeni kullanıcı oluşturuldu:', user.username);
    res.status(201).json({
      success: true,
      data: formatUser(user),
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error.message);
    res.status(400).json({ success: false, message: 'Oluşturma başarısız' });
  }
});

// Kullanıcı güncelle (sadece admin)
router.put('/:id', authMiddleware, idParamValidation, userValidation, async (req, res) => {
  try {
    const { username, password, name, permissions, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcı adı değiştiyse çakışma kontrolü
    if (username && username.trim() !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
      user.username = username.trim();
    }

    if (name !== undefined) user.name = name;
    if (permissions !== undefined) user.permissions = sanitizePermissions(permissions);
    if (isActive !== undefined) user.isActive = isActive;
    // Şifre yalnızca dolu gönderildiyse güncellenir
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    console.log('✅ Kullanıcı güncellendi:', user.username);
    res.json({
      success: true,
      data: formatUser(user),
      message: 'Kullanıcı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error.message);
    res.status(400).json({ success: false, message: 'Güncelleme başarısız' });
  }
});

// Kullanıcı sil (sadece admin)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    console.log('✅ Kullanıcı silindi:', user.username);
    res.json({ success: true, message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error.message);
    res.status(500).json({ success: false, message: 'Silme başarısız' });
  }
});

module.exports = router;
