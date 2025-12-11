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
    default: ''
  },
  logoHeight: {
    type: Number,
    default: 48
  },
  logoWidth: {
    type: String, // 'auto' veya number string
    default: 'auto'
  },
  maxDisplayItems: {
    type: Number,
    default: 20
  },
  featuredPrices: {
    type: [String],
    default: ['USDTRY', 'EURTRY', 'GBPTRY']
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

