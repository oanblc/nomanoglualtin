const mongoose = require('mongoose');

const legalPageSchema = new mongoose.Schema({
  // Sayfa tipi: privacy (Gizlilik Politikası), terms (Kullanım Koşulları)
  type: {
    type: String,
    enum: ['privacy', 'terms'],
    required: true,
    unique: true
  },
  // Sayfa başlığı
  title: {
    type: String,
    required: true
  },
  // Sayfa içeriği (HTML veya Markdown)
  content: {
    type: String,
    default: ''
  },
  // Son güncelleme tarihi (kullanıcıya gösterilecek)
  lastUpdated: {
    type: String,
    default: ''
  },
  // Aktif mi?
  isActive: {
    type: Boolean,
    default: true
  },
  // Sistem tarihi
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

legalPageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LegalPage', legalPageSchema);
