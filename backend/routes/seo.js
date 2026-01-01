const express = require('express');
const router = express.Router();
const Seo = require('../models/Seo');
const { authMiddleware } = require('../middleware/auth');

// SEO ayarlarını getir (public)
router.get('/', async (req, res) => {
  try {
    let seo = await Seo.findOne({ key: 'seo_settings' });

    if (!seo) {
      // Varsayılan ayarları oluştur
      seo = new Seo({ key: 'seo_settings' });
      await seo.save();
    }

    res.json({
      success: true,
      data: seo
    });
  } catch (error) {
    console.error('SEO getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// SEO ayarlarını güncelle (Admin korumalı)
router.post('/', authMiddleware, async (req, res) => {
  try {
    let seo = await Seo.findOne({ key: 'seo_settings' });

    if (!seo) {
      seo = new Seo({ key: 'seo_settings', ...req.body });
    } else {
      // Sadece gönderilen alanları güncelle
      const allowedFields = [
        'siteTitle', 'siteDescription', 'siteKeywords', 'ogImage', 'ogType',
        'twitterCard', 'canonicalUrl', 'robotsContent',
        'googleAnalyticsId', 'googleTagManagerId', 'metaPixelId',
        'headScripts', 'bodyStartScripts', 'bodyEndScripts',
        'googleSiteVerification', 'bingSiteVerification'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          seo[field] = req.body[field];
        }
      });
    }

    await seo.save();
    console.log('✅ SEO ayarları güncellendi');

    res.json({
      success: true,
      data: seo,
      message: 'SEO ayarları başarıyla güncellendi'
    });
  } catch (error) {
    console.error('SEO güncelleme hatası:', error);
    res.status(400).json({
      success: false,
      message: 'Güncelleme başarısız',
      error: error.message
    });
  }
});

module.exports = router;
