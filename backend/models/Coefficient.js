const mongoose = require('mongoose');

const coefficientSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['alis', 'satis'],
    required: true
  },
  multiplier: {
    type: Number,
    default: 1
  },
  addition: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['altin', 'doviz', 'gumus', 'diger'],
    default: 'diger'
  }
}, {
  timestamps: true
});

// Kompozit key: code + type (bir ürünün hem alış hem satış katsayısı olabilir)
coefficientSchema.index({ code: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Coefficient', coefficientSchema);

