const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  identityNumber: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  occupation: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['alis', 'satis'],
    default: 'alis'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  additionalInfo: {
    type: String,
    default: ''
  },
  kvkkConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  signature: {
    type: String,
    default: ''
  },
  idCardFront: {
    type: String,
    default: ''
  },
  idCardBack: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  // ── MASAK yaptırım taraması ──
  screeningStatus: {
    type: String,
    enum: ['pending', 'cleared', 'blocked', 'review', 'overridden', 'error'],
    default: 'pending',
    index: true
  },
  screeningResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  screeningNotes: {
    type: String,
    default: ''
  },
  overriddenBy: {
    type: String,
    default: ''
  },
  overriddenAt: {
    type: Date,
    default: null
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

transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
