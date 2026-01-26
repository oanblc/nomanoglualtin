const mongoose = require('mongoose');

// Kaynak konfigürasyonu şeması (tekrar kullanılabilir)
const sourceConfigSchema = {
  sourceCode: String,
  sourceType: {
    type: String,
    enum: ['alis', 'satis']
  },
  multiplier: {
    type: Number,
    default: 1
  },
  addition: {
    type: Number,
    default: 0
  }
};

const customPriceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['doviz', 'altin', 'gumus']
  },
  // Birincil kaynak (API 1)
  alisConfig: sourceConfigSchema,
  satisConfig: sourceConfigSchema,
  // Yedek kaynak (API 2)
  backupAlisConfig: sourceConfigSchema,
  backupSatisConfig: sourceConfigSchema,
  // Aktif kaynak: 'primary' veya 'backup'
  activeSource: {
    type: String,
    enum: ['primary', 'backup'],
    default: 'primary'
  },
  // Manuel olarak değiştirildi mi?
  manualSourceOverride: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  decimals: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update işlemlerinde updatedAt'i güncelle
customPriceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CustomPrice', customPriceSchema);

