const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Branch = require('../models/Branch');
const { authMiddleware, employeeAuthMiddleware } = require('../middleware/auth');
const { transactionValidation, idParamValidation } = require('../middleware/validation');

// İşlem oluştur (çalışan veya admin)
router.post('/', employeeAuthMiddleware, transactionValidation, async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    console.log('✅ Yeni işlem oluşturuldu:', transaction.fullName);
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'İşlem başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Transaction oluşturma hatası:', error);
    res.status(400).json({
      success: false,
      message: 'Oluşturma başarısız',
      error: error.message
    });
  }
});

// Tüm işlemleri listele (sadece admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('branchId', 'name city')
      .sort({ createdAt: -1 });

    const formatted = transactions.map(t => {
      const obj = t.toObject();
      obj.id = t._id.toString();
      // Liste görünümünde büyük base64 alanları gönderme
      delete obj.signature;
      delete obj.idCardFront;
      delete obj.idCardBack;
      return obj;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Transaction listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
});

// PDF oluştur (sadece admin)
router.get('/pdf/:id', authMiddleware, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const path = require('path');
    const transaction = await Transaction.findById(req.params.id)
      .populate('branchId');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Türkçe karakter desteği için Roboto fontları
    const fontDir = path.join(__dirname, '..', 'fonts');
    doc.registerFont('Roboto', path.join(fontDir, 'Roboto-Regular.ttf'));
    doc.registerFont('Roboto-Bold', path.join(fontDir, 'Roboto-Bold.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=musteri-tani-formu-${transaction._id}.pdf`);

    doc.pipe(res);

    // Başlık - Şube şirket bilgileri
    const branch = transaction.branchId;
    if (branch) {
      if (branch.companyTitle) {
        doc.fontSize(14).font('Roboto-Bold')
          .text(branch.companyTitle, { align: 'center' });
      } else {
        doc.fontSize(14).font('Roboto-Bold')
          .text(branch.name, { align: 'center' });
      }
      if (branch.taxOffice || branch.taxNumber) {
        doc.fontSize(10).font('Roboto')
          .text(`Vergi Dairesi: ${branch.taxOffice || '-'} - Vergi No: ${branch.taxNumber || '-'}`, { align: 'center' });
      }
      if (branch.tradeRegistryNo) {
        doc.fontSize(10).font('Roboto')
          .text(`Ticaret Sicil No: ${branch.tradeRegistryNo}`, { align: 'center' });
      }
    }

    doc.moveDown();
    doc.fontSize(16).font('Roboto-Bold')
      .text('MÜŞTERİ TANI FORMU', { align: 'center' });
    doc.moveDown();

    // Kimlik görselleri (sayfaya ortalanmış)
    if (transaction.idCardFront || transaction.idCardBack) {
      const imgW = 150;
      const imgH = 95;
      const gap = 20;
      const pageW = 595.28; // A4
      const hasBoth = transaction.idCardFront && transaction.idCardBack;
      const totalW = hasBoth ? imgW + gap + imgW : imgW;
      const centerX = (pageW - totalW) / 2;
      const imgY = doc.y;

      try {
        if (transaction.idCardFront) {
          const frontData = transaction.idCardFront.replace(/^data:image\/\w+;base64,/, '');
          const frontBuffer = Buffer.from(frontData, 'base64');
          doc.image(frontBuffer, centerX, imgY, { width: imgW, height: imgH });
        }
        if (transaction.idCardBack) {
          const backData = transaction.idCardBack.replace(/^data:image\/\w+;base64,/, '');
          const backBuffer = Buffer.from(backData, 'base64');
          const backX = hasBoth ? centerX + imgW + gap : centerX;
          doc.image(backBuffer, backX, imgY, { width: imgW, height: imgH });
        }
      } catch (e) {
        doc.font('Roboto').text('[Kimlik görselleri yüklenemedi]');
      }
      doc.moveDown(5);
    }

    // Form alanları - Tablo formatı
    const fields = [
      ['İsim Soyisim / Ünvan', transaction.fullName],
      ['T.C. No / Vergi No', transaction.identityNumber],
      ['Telefon No', transaction.phone],
      ['Meslek Bilgisi', transaction.occupation || '-'],
      ['Adres', transaction.address],
      ['Tarih', new Date(transaction.date).toLocaleDateString('tr-TR')],
      ['Şube', branch ? `${branch.name} - ${branch.city}` : '-'],
      ['Toplam Tutar', `${transaction.totalAmount.toLocaleString('tr-TR')} TL`],
      ['Detay', transaction.details || '-'],
      ['Ek Bilgi', transaction.additionalInfo || '-'],
    ];

    const tableLeft = 50;
    const labelWidth = 160;
    const valueWidth = 340;
    const rowHeight = 25;

    fields.forEach(([label, value]) => {
      const y = doc.y;
      // Etiket hücresi
      doc.rect(tableLeft, y, labelWidth, rowHeight).stroke();
      doc.fontSize(9).font('Roboto-Bold')
        .text(label, tableLeft + 5, y + 7, { width: labelWidth - 10 });
      // Değer hücresi
      doc.rect(tableLeft + labelWidth, y, valueWidth, rowHeight).stroke();
      doc.fontSize(9).font('Roboto')
        .text(String(value), tableLeft + labelWidth + 5, y + 7, { width: valueWidth - 10 });
      doc.y = y + rowHeight;
    });

    // KVKK metni
    doc.moveDown();
    doc.fontSize(8).font('Roboto-Bold')
      .text('KİŞİSEL VERİLERİN KORUNMASI VE AÇIK RIZA METNİ');
    doc.fontSize(7).font('Roboto')
      .text('6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında; işbu Müşteri Tanı Formu üzerinde tarafımca beyan edilen kişisel verilerin (kimlik bilgileri, iletişim bilgileri ve ekli kimlik kartı görseli dahil) doğru ve güncel olduğunu kabul ve beyan ederim.', { lineGap: 2 });
    doc.moveDown(0.5);
    doc.text('KVKK onayı: Verildi');

    // İmza
    if (transaction.signature) {
      doc.moveDown();
      const sigY = doc.y;
      doc.rect(tableLeft, sigY, labelWidth, 60).stroke();
      doc.fontSize(9).font('Roboto-Bold')
        .text('İmza', tableLeft + 5, sigY + 5);
      doc.rect(tableLeft + labelWidth, sigY, valueWidth, 60).stroke();
      try {
        const sigData = transaction.signature.replace(/^data:image\/\w+;base64,/, '');
        const sigBuffer = Buffer.from(sigData, 'base64');
        doc.image(sigBuffer, tableLeft + labelWidth + 10, sigY + 5, { width: 180, height: 50 });
      } catch (e) {
        doc.font('Roboto').text('Formdaki bilgilerin doğru olduğunu onaylıyorum.',
          tableLeft + labelWidth + 5, sigY + 20, { width: valueWidth - 10 });
      }
    }

    doc.end();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'PDF oluşturulamadı', error: error.message });
  }
});

// İşlem güncelle (sadece admin)
router.put('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const allowedFields = ['fullName', 'identityNumber', 'phone', 'occupation', 'address', 'date', 'branchId', 'totalAmount', 'details', 'additionalInfo', 'status'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    updates.updatedAt = Date.now();

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('branchId', 'name city');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });
    }

    console.log('✅ İşlem güncellendi:', transaction.fullName);
    res.json({ success: true, data: transaction, message: 'İşlem güncellendi' });
  } catch (error) {
    console.error('Transaction güncelleme hatası:', error);
    res.status(400).json({ success: false, message: 'Güncelleme başarısız', error: error.message });
  }
});

// İşlem sil (sadece admin)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });
    }
    console.log('🗑️ İşlem silindi:', transaction.fullName);
    res.json({ success: true, message: 'İşlem silindi' });
  } catch (error) {
    console.error('Transaction silme hatası:', error);
    res.status(500).json({ success: false, message: 'Silme başarısız', error: error.message });
  }
});

// Tek işlem detayı (sadece admin)
router.get('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('branchId', 'name city companyTitle taxOffice taxNumber tradeRegistryNo');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });
    }

    res.json({
      success: true,
      data: { ...transaction.toObject(), id: transaction._id.toString() }
    });
  } catch (error) {
    console.error('Transaction getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router;
