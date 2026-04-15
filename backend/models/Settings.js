const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Singleton pattern için key
  key: {
    type: String,
    default: 'app_settings',
    unique: true
  },
  logoBase64: {
    type: String,
    default: '',
    maxlength: [2 * 1024 * 1024, 'Logo boyutu 2MB\'ı aşamaz']
  },
  logoHeight: {
    type: Number,
    default: 48
  },
  logoWidth: {
    type: String, // 'auto' veya number string
    default: 'auto'
  },
  faviconBase64: {
    type: String,
    default: '',
    maxlength: [512 * 1024, 'Favicon boyutu 512KB\'ı aşamaz']
  },
  maxDisplayItems: {
    type: Number,
    default: 20
  },
  featuredPrices: {
    type: [String],
    default: ['USDTRY', 'EURTRY', 'GBPTRY']
  },
  // İletişim Bilgileri
  contactPhone: {
    type: String,
    default: '+90 (XXX) XXX XX XX'
  },
  contactEmail: {
    type: String,
    default: 'info@nomanoglu.com'
  },
  contactAddress: {
    type: String,
    default: 'Istanbul, Turkiye'
  },
  workingHours: {
    type: String,
    default: 'Pzt - Cmt: 09:00 - 19:00'
  },
  workingHoursNote: {
    type: String,
    default: 'Pazar: Kapali'
  },
  // Sosyal Medya
  socialFacebook: {
    type: String,
    default: ''
  },
  socialTwitter: {
    type: String,
    default: ''
  },
  socialInstagram: {
    type: String,
    default: ''
  },
  socialYoutube: {
    type: String,
    default: ''
  },
  socialTiktok: {
    type: String,
    default: ''
  },
  socialWhatsapp: {
    type: String,
    default: '905322904601'
  },
  // Fiyat tablosu yanındaki görsel
  priceTableImage: {
    type: String,
    default: '',
    maxlength: [3 * 1024 * 1024, 'Görsel boyutu 3MB\'ı aşamaz']
  },
  // Çalışan Şifresi (mobil KYC formu girişi için)
  employeePassword: {
    type: String,
    default: ''
  },
  // İşletme Fiyatları sayfası şifresi (şube içi fiyatlama)
  businessPassword: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);

