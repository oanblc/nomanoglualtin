const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'seo_settings',
    unique: true
  },

  // SEO Ayarları
  siteTitle: {
    type: String,
    default: 'Nomanoğlu Kuyumculuk'
  },
  siteDescription: {
    type: String,
    default: 'Anlık altın ve döviz fiyatları. 1967\'den bu yana güvenilir kuyumculuk hizmeti.'
  },
  siteKeywords: {
    type: String,
    default: 'altın fiyatları, döviz kurları, gram altın, çeyrek altın, kuyumculuk'
  },
  ogImage: {
    type: String,
    default: ''
  },
  ogType: {
    type: String,
    default: 'website'
  },
  twitterCard: {
    type: String,
    default: 'summary_large_image'
  },
  canonicalUrl: {
    type: String,
    default: ''
  },
  robotsContent: {
    type: String,
    default: 'index, follow'
  },

  // Google Analytics
  googleAnalyticsId: {
    type: String,
    default: ''
  },

  // Google Tag Manager
  googleTagManagerId: {
    type: String,
    default: ''
  },

  // Meta (Facebook) Pixel
  metaPixelId: {
    type: String,
    default: ''
  },

  // Özel Kodlar
  headScripts: {
    type: String,
    default: ''
  },
  bodyStartScripts: {
    type: String,
    default: ''
  },
  bodyEndScripts: {
    type: String,
    default: ''
  },

  // Google Search Console doğrulama
  googleSiteVerification: {
    type: String,
    default: ''
  },

  // Bing Webmaster doğrulama
  bingSiteVerification: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('Seo', seoSchema);
