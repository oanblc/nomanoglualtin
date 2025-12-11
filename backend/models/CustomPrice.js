const mongoose = require('mongoose');

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
  alisConfig: {
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
  },
  satisConfig: {
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
  },
  order: {
    type: Number,
    default: 0
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

