const mongoose = require('mongoose');

// İşletme (şube içi) fiyatları için override katsayıları.
// Bir kayıt bir CustomPrice'a karşılık gelir (code ile eşlenir).
// Değerler null ise o taraf için normal custom price katsayısı kullanılır.
const businessCoefficientSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  alisMultiplier: {
    type: Number,
    default: null
  },
  alisAddition: {
    type: Number,
    default: null
  },
  satisMultiplier: {
    type: Number,
    default: null
  },
  satisAddition: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BusinessCoefficient', businessCoefficientSchema);
