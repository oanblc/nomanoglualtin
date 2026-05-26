const express = require('express');
const router = express.Router();
const Seo = require('../models/Seo');
const { requirePermission } = require('../middleware/auth');

// Whitelist: 3. parti analytics ID format doğrulaması
const idValidators = {
  googleAnalyticsId: /^(G-[A-Z0-9]{6,16}|UA-\d+-\d+|AW-\d+)?$/,
  googleTagManagerId: /^(GTM-[A-Z0-9]+)?$/,
  metaPixelId: /^\d{8,20}?$/,
  googleSiteVerification: /^[A-Za-z0-9_-]{0,100}$/,
  bingSiteVerification: /^[A-Za-z0-9_-]{0,100}$/
};

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
    console.error('SEO getirme hatası:', error.message);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
});

// SEO ayarlarını güncelle (Admin korumalı)
router.post('/', requirePermission('seo'), async (req, res) => {
  try {
    let seo = await Seo.findOne({ key: 'seo_settings' });

    // XSS açığı önlemek için custom script alanları (headScripts/bodyStart/bodyEnd)
    // API üzerinden artık kabul edilmiyor — sadece whitelist'teki 3. parti servisler.
    const allowedFields = [
      'siteTitle', 'siteDescription', 'siteKeywords', 'ogImage', 'ogType',
      'twitterCard', 'canonicalUrl', 'robotsContent',
      'googleAnalyticsId', 'googleTagManagerId', 'metaPixelId',
      'googleSiteVerification', 'bingSiteVerification'
    ];

    // ID formatlarını doğrula
    for (const [field, regex] of Object.entries(idValidators)) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        if (!regex.test(String(req.body[field]))) {
          return res.status(400).json({
            success: false,
            message: `${field} geçersiz formatta`
          });
        }
      }
    }

    if (!seo) {
      const initial = { key: 'seo_settings' };
      allowedFields.forEach(f => {
        if (req.body[f] !== undefined) initial[f] = req.body[f];
      });
      seo = new Seo(initial);
    } else {
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          seo[field] = req.body[field];
        }
      });
      // Eski script alanlarını temizle (backward cleanup)
      seo.headScripts = '';
      seo.bodyStartScripts = '';
      seo.bodyEndScripts = '';
    }

    await seo.save();
    console.log('✅ SEO ayarları güncellendi');

    res.json({
      success: true,
      data: seo,
      message: 'SEO ayarları başarıyla güncellendi'
    });
  } catch (error) {
    console.error('SEO güncelleme hatası:', error.message);
    res.status(400).json({
      success: false,
      message: 'Güncelleme başarısız',
    });
  }
});

module.exports = router;
