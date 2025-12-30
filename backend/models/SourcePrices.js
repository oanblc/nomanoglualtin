const mongoose = require('mongoose');

const sourcePricesSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'source_prices',
    unique: true
  },
  prices: [{
    code: String,
    name: String,
    rawAlis: Number,
    rawSatis: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SourcePrices', sourcePricesSchema);
