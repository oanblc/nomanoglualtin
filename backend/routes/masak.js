const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { employeeAuthMiddleware, requirePermission } = require('../middleware/auth');
const screeningService = require('../services/screeningService');
const masakService = require('../services/masakService');

const VALID_LISTS = ['6415_m5', '6415_m6', '7262'];

// Ön sorgu (çalışan veya admin): ad/TCKN ile MASAK kontrolü — işlem oluşturmadan.
router.post('/check', employeeAuthMiddleware, async (req, res) => {
  try {
    const { fullName, identityNumber } = req.body;
    if (!fullName && !identityNumber) {
      return res.status(400).json({ success: false, message: 'İsim veya kimlik no gerekli' });
    }
    const result = await screeningService.screen({ fullName, identityNumber });
    res.json({
      success: true,
      matched: result.matched,
      status: result.status,
      score: result.score,
      matches: result.matches.map(screeningService.redactForClient)
    });
  } catch (error) {
    console.error('MASAK check hatası:', error.message);
    res.status(500).json({ success: false, message: 'Sorgu başarısız' });
  }
});

// Liste durumu (admin): kayıt sayıları, son senkron, eşik
router.get('/status', requirePermission('masak'), async (req, res) => {
  try {
    const status = await masakService.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('MASAK status hatası:', error.message);
    res.status(500).json({ success: false, message: 'Durum alınamadı' });
  }
});

// Manuel liste yükleme (admin): { listCode, filename, dataBase64 }
// Otomatik çekim güvenlik ağı / ilk seed için. Dosya base64 olarak gönderilir.
router.post('/upload', requirePermission('masak'), async (req, res) => {
  try {
    const { listCode, filename, dataBase64 } = req.body;
    if (!VALID_LISTS.includes(listCode)) {
      return res.status(400).json({ success: false, message: 'Geçersiz liste kodu' });
    }
    if (!dataBase64 || typeof dataBase64 !== 'string') {
      return res.status(400).json({ success: false, message: 'Dosya verisi (dataBase64) gerekli' });
    }
    // "data:...;base64," öneki varsa temizle
    const b64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(b64, 'base64');
    const count = await masakService.ingestBuffer(buffer, { listCode, filename: filename || 'upload.csv' });
    console.log(`📥 MASAK manuel yükleme: ${listCode} — ${count} kayıt`);
    res.json({ success: true, count, message: `${count} kayıt işlendi` });
  } catch (error) {
    console.error('MASAK upload hatası:', error.message);
    res.status(400).json({ success: false, message: `Yükleme başarısız: ${error.message}` });
  }
});

// Elle senkron tetikleme (admin)
router.post('/sync', requirePermission('masak'), async (req, res) => {
  try {
    const result = await masakService.syncMasakLists();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('MASAK sync hatası:', error.message);
    res.status(500).json({ success: false, message: 'Senkronizasyon başarısız' });
  }
});

// Bloke/şüpheli işlemler (admin)
router.get('/matches', requirePermission('masak'), async (req, res) => {
  try {
    const transactions = await Transaction.find({ screeningStatus: { $in: ['blocked', 'review'] } })
      .populate('branchId', 'name city')
      .sort({ createdAt: -1 });

    const formatted = transactions.map((t) => {
      const obj = t.toObject();
      obj.id = t._id.toString();
      delete obj.signature;
      delete obj.idCardFront;
      delete obj.idCardBack;
      return obj;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('MASAK matches hatası:', error.message);
    res.status(500).json({ success: false, message: 'Liste alınamadı' });
  }
});

// İşlemi override et / temiz işaretle (admin) — yanlış pozitif için
router.post('/override/:id', requirePermission('masak'), async (req, res) => {
  try {
    const { notes } = req.body;
    const overriddenBy = (req.user && (req.user.name || req.user.role)) || 'admin';
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        screeningStatus: 'overridden',
        screeningNotes: notes || '',
        overriddenBy,
        overriddenAt: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('branchId', 'name city');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });
    }
    console.log(`✓ MASAK override: id=${transaction._id} by=${overriddenBy}`);
    res.json({ success: true, data: transaction, message: 'İşlem temiz olarak işaretlendi' });
  } catch (error) {
    console.error('MASAK override hatası:', error.message);
    res.status(400).json({ success: false, message: 'Override başarısız' });
  }
});

module.exports = router;
