const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  fcmToken: {
    type: String,
    required: false // Web için gerekli değil
  },
  productCode: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  priceType: {
    type: String,
    enum: ['alis', 'satis'],
    required: true
  },
  condition: {
    type: String,
    enum: ['above', 'below'], // 'above': >=, 'below': <=
    required: true
  },
  targetPrice: {
    type: Number,
    required: true
  },
  isTriggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

alarmSchema.index({ deviceId: 1, isActive: 1 });
alarmSchema.index({ isTriggered: 1, isActive: 1 });

module.exports = mongoose.model('Alarm', alarmSchema);

