const mongoose = require('mongoose');

// MASAK yaptırım/malvarlığı dondurma listelerindeki tek bir kişi/kuruluş kaydı.
// Birden çok liste tek koleksiyonda tutulur (listCode ile ayrışır).
const sanctionsEntrySchema = new mongoose.Schema({
  // Hangi liste:
  //   6415_m5 → BMGK Yaptırımları (6415 s.K. m.5)
  //   6415_m6 → Yabancı ülke talebi (6415 s.K. m.6)
  //   6415_m7 → İç Dondurma (6415 s.K. m.7)
  //   7262    → Kitle imha silahları finansmanı (7262 s.K.)
  listCode: {
    type: String,
    enum: ['6415_m5', '6415_m6', '6415_m7', '7262'],
    required: true,
    index: true
  },
  fullName: { type: String, required: true },
  // Arama için normalize edilmiş ad (indexli)
  normalizedName: { type: String, default: '', index: true },
  aliases: { type: [String], default: [] },
  // Normalize edilmiş takma adlar (indexli) — eşleştirme bunun üzerinden yapılır
  normalizedAliases: { type: [String], default: [], index: true },
  // Normalize edilmiş kimlik/pasaport numaraları (indexli)
  idNumbers: { type: [String], default: [], index: true },

  nationality: { type: String, default: '' },
  birthDate: { type: String, default: '' },
  birthPlace: { type: String, default: '' },
  organization: { type: String, default: '' },
  gazetteRef: { type: String, default: '' },
  decisionRef: { type: String, default: '' },

  // Denetim için ham kaynak satırı
  sourceRowRaw: { type: mongoose.Schema.Types.Mixed, default: null },

  // Senkronizasyon sürümü — eski kayıtları tespit edip pasifleştirmek için
  syncBatch: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

sanctionsEntrySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SanctionsEntry', sanctionsEntrySchema);
