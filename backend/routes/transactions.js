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

    const branch = transaction.branchId;
    const pageW = 595.28;
    const margin = 50;
    const contentW = pageW - margin * 2;
    const tableLeft = margin;
    const labelWidth = 150;
    const valueWidth = contentW - labelWidth;
    const islemTuruLabel = transaction.transactionType === 'satis' ? 'Satış' : 'Alış';
    const islemTuruText = transaction.transactionType === 'satis' ? 'satışa' : 'alışa';
    const tarihStr = new Date(transaction.date).toLocaleDateString('tr-TR');

    // ─── Üst çizgi ───
    doc.moveTo(margin, 50).lineTo(pageW - margin, 50).lineWidth(2).stroke('#333');

    // ─── Şube / Şirket Bilgileri ───
    doc.y = 58;
    if (branch) {
      doc.fontSize(13).font('Roboto-Bold')
        .text(branch.companyTitle || branch.name, { align: 'center' });
      const infoParts = [];
      if (branch.taxOffice) infoParts.push(`Vergi Dairesi: ${branch.taxOffice}`);
      if (branch.taxNumber) infoParts.push(`Vergi No: ${branch.taxNumber}`);
      if (branch.tradeRegistryNo) infoParts.push(`Ticaret Sicil No: ${branch.tradeRegistryNo}`);
      if (infoParts.length > 0) {
        doc.fontSize(8).font('Roboto').fillColor('#555')
          .text(infoParts.join('  |  '), { align: 'center' });
      }
    }

    // ─── Başlık ───
    doc.moveDown(0.8);
    doc.fontSize(14).font('Roboto-Bold').fillColor('#000')
      .text('MÜŞTERİ TANI FORMU', { align: 'center' });
    doc.moveDown(0.3);

    // ─── Açıklama Metni ───
    doc.fontSize(9).font('Roboto').fillColor('#333')
      .text(`Bu belge ${transaction.fullName} isimli müşterinin ${tarihStr} tarihinde yaptığı ${islemTuruText} istinaden oluşturulmuştur.`, margin, doc.y, { width: contentW, align: 'center' });
    doc.fillColor('#000');
    doc.moveDown(1);

    // ─── Kimlik Görselleri ───
    if (transaction.idCardFront || transaction.idCardBack) {
      doc.fontSize(9).font('Roboto-Bold').text('KİMLİK GÖRSELLERİ', margin);
      doc.moveDown(1);

      const imgW = 200;
      const imgH = 126;
      const gap = 16;
      const hasBoth = transaction.idCardFront && transaction.idCardBack;
      const totalW = hasBoth ? imgW * 2 + gap : imgW;
      const startX = (pageW - totalW) / 2;
      const imgY = doc.y;

      try {
        if (transaction.idCardFront) {
          const frontData = transaction.idCardFront.replace(/^data:image\/\w+;base64,/, '');
          const frontBuffer = Buffer.from(frontData, 'base64');
          // Çerçeve
          doc.rect(startX - 2, imgY - 2, imgW + 4, imgH + 4).lineWidth(1).stroke('#ccc');
          doc.image(frontBuffer, startX, imgY, { width: imgW, height: imgH });
          doc.fontSize(7).font('Roboto').fillColor('#888')
            .text('Ön Yüz', startX, imgY + imgH + 4, { width: imgW, align: 'center' });
        }
        if (transaction.idCardBack) {
          const backData = transaction.idCardBack.replace(/^data:image\/\w+;base64,/, '');
          const backBuffer = Buffer.from(backData, 'base64');
          const backX = hasBoth ? startX + imgW + gap : startX;
          doc.rect(backX - 2, imgY - 2, imgW + 4, imgH + 4).lineWidth(1).stroke('#ccc');
          doc.image(backBuffer, backX, imgY, { width: imgW, height: imgH });
          doc.fontSize(7).font('Roboto').fillColor('#888')
            .text('Arka Yüz', backX, imgY + imgH + 4, { width: imgW, align: 'center' });
        }
      } catch (e) {
        doc.font('Roboto').fillColor('#999').text('[Kimlik görselleri yüklenemedi]');
      }
      doc.fillColor('#000');
      doc.y = imgY + imgH + 20;
      doc.moveDown(1.5);
    }

    // ─── Kişisel Bilgiler Tablosu ───
    doc.fontSize(9).font('Roboto-Bold').text('KİŞİSEL BİLGİLER', margin);
    doc.moveDown(0.3);

    const personalFields = [
      ['İsim Soyisim / Ünvan', transaction.fullName],
      ['T.C. No / Vergi No', transaction.identityNumber],
      ['Telefon No', transaction.phone],
      ['Meslek Bilgisi', transaction.occupation || '-'],
      ['Adres', transaction.address],
    ];

    const drawTable = (fields, startY) => {
      const rowPadding = 8;
      let y = startY;
      fields.forEach(([label, value], i) => {
        const textHeight = doc.fontSize(9).font('Roboto').heightOfString(String(value), { width: valueWidth - 12 });
        const rowH = Math.max(24, textHeight + rowPadding * 2);
        // Zebra arka plan
        if (i % 2 === 0) {
          doc.rect(tableLeft, y, contentW, rowH).fill('#f7f7f7');
        }
        // Hücre kenarlıkları
        doc.rect(tableLeft, y, labelWidth, rowH).lineWidth(0.5).stroke('#ddd');
        doc.rect(tableLeft + labelWidth, y, valueWidth, rowH).lineWidth(0.5).stroke('#ddd');
        // Etiket
        doc.fontSize(9).font('Roboto-Bold').fillColor('#333')
          .text(label, tableLeft + 6, y + rowPadding, { width: labelWidth - 12 });
        // Değer
        doc.fontSize(9).font('Roboto').fillColor('#000')
          .text(String(value), tableLeft + labelWidth + 6, y + rowPadding, { width: valueWidth - 12 });
        y += rowH;
      });
      doc.y = y;
    };

    drawTable(personalFields, doc.y);

    // ─── İşlem Bilgileri Tablosu ───
    doc.moveDown(0.8);
    doc.fontSize(9).font('Roboto-Bold').fillColor('#000').text('İŞLEM BİLGİLERİ', margin);
    doc.moveDown(0.3);

    const transactionFields = [
      ['İşlem Türü', islemTuruLabel],
      ['Tarih', tarihStr],
      ['Şube', branch ? `${branch.name} - ${branch.city}` : '-'],
      ['Toplam Tutar', `${transaction.totalAmount.toLocaleString('tr-TR')} TL`],
      ['Detay', transaction.details || '-'],
      ['Ek Bilgi', transaction.additionalInfo || '-'],
    ];

    drawTable(transactionFields, doc.y);

    // ─── KVKK ───
    doc.moveDown(0.8);
    doc.fontSize(8).font('Roboto-Bold').fillColor('#000')
      .text('KVKK AÇIK RIZA METNİ', margin);
    doc.moveDown(0.2);
    doc.fontSize(7).font('Roboto').fillColor('#444')
      .text('6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında; işbu Müşteri Tanı Formu üzerinde tarafımca beyan edilen kişisel verilerin (kimlik bilgileri, iletişim bilgileri ve ekli kimlik kartı görseli dahil) doğru ve güncel olduğunu kabul ve beyan ederim. Söz konusu kişisel verilerimin; müşteri tanıma (KYC), yasal yükümlülüklerin yerine getirilmesi, mevzuata uyum, muhasebe ve denetim süreçlerinin yürütülmesi amaçlarıyla paylaşılabileceğini bildiğimi ve bu hususta açık rıza verdiğimi kabul ederim.', { lineGap: 2, width: contentW });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Roboto-Bold').fillColor('#16a34a')
      .text('KVKK Onayı: Verildi', margin);
    doc.fillColor('#000');

    // ─── Alt çizgi ───
    doc.moveDown(1.5);
    const bottomY = doc.y;
    doc.moveTo(margin, bottomY).lineTo(pageW - margin, bottomY).lineWidth(1).stroke('#ccc');
    doc.fontSize(7).font('Roboto').fillColor('#aaa')
      .text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}  |  Belge No: ${transaction._id}`, margin, bottomY + 5, { width: contentW, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'PDF oluşturulamadı', error: error.message });
  }
});

// İşlem güncelle (sadece admin)
router.put('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const allowedFields = ['fullName', 'identityNumber', 'phone', 'occupation', 'address', 'date', 'branchId', 'transactionType', 'totalAmount', 'details', 'additionalInfo', 'status'];
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
