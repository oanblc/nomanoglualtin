const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    index: true
  },
  rawAlis: Number,
  rawSatis: Number,
  calculatedAlis: Number,
  calculatedSatis: Number,
  direction: {
    alis_dir: String,
    satis_dir: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// TTL index - 30 gün sonra otomatik sil
priceHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);

