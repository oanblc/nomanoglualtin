const express = require('express');
const router = express.Router();
const Alarm = require('../models/Alarm');

// Cihaz için tüm alarmları getir
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const alarms = await Alarm.find({ deviceId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alarms
    });
  } catch (error) {
    console.error('Alarm getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni alarm oluştur
router.post('/', async (req, res) => {
  try {
    const { deviceId, fcmToken, productCode, productName, priceType, condition, targetPrice } = req.body;

    if (!deviceId || !productCode || !productName || !priceType || !condition || !targetPrice) {
      return res.status(400).json({ message: 'Gerekli alanlar eksik' });
    }

    const alarm = await Alarm.create({
      deviceId,
      fcmToken,
      productCode,
      productName,
      priceType,
      condition,
      targetPrice,
      isActive: true,
      isTriggered: false
    });

    res.json({
      success: true,
      data: alarm,
      message: 'Alarm oluşturuldu'
    });
  } catch (error) {
    console.error('Alarm oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Alarmı sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Alarm.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Alarm silindi'
    });
  } catch (error) {
    console.error('Alarm silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Alarmı aktif/pasif yap
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const alarm = await Alarm.findById(id);

    if (!alarm) {
      return res.status(404).json({ message: 'Alarm bulunamadı' });
    }

    alarm.isActive = !alarm.isActive;
    await alarm.save();

    res.json({
      success: true,
      data: alarm,
      message: alarm.isActive ? 'Alarm aktif edildi' : 'Alarm pasif edildi'
    });
  } catch (error) {
    console.error('Alarm güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm alarmları getir (Admin)
router.get('/admin/all', async (req, res) => {
  try {
    const alarms = await Alarm.find().sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      data: alarms
    });
  } catch (error) {
    console.error('Alarm getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;

