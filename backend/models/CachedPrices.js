const mongoose = require('mongoose');

const cachedPricesSchema = new mongoose.Schema({
  // Tek bir doküman olacak, key ile tanımlı
  key: {
    type: String,
    default: 'current_prices',
    unique: true
  },
  prices: [{
    code: String,
    name: String,
    category: String,
    calculatedAlis: Number,
    calculatedSatis: Number,
    rawAlis: Number,
    rawSatis: Number,
    direction: Object,
    isCustom: Boolean,
    isVisible: Boolean,
    order: Number,
    decimals: { type: Number, default: 0 },
    tarih: String
  }],
  meta: {
    time: String,
    maxDisplayItems: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Her kayıtta updatedAt güncelle
cachedPricesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CachedPrices', cachedPricesSchema);
