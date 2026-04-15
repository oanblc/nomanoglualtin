const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const { authMiddleware } = require('../middleware/auth');
const { branchValidation, idParamValidation } = require('../middleware/validation');

// Tüm şubeleri getir
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ city: 1, name: 1 });
    // _id'yi id'ye dönüştür + şirket bilgilerini public'ten gizle
    const formattedBranches = branches.map(branch => {
      const obj = branch.toObject();
      obj.id = branch._id.toString();
      delete obj.companyTitle;
      delete obj.taxOffice;
      delete obj.taxNumber;
      delete obj.tradeRegistryNo;
      return obj;
    });
    res.json({
      success: true,
      data: formattedBranches
    });
  } catch (error) {
    console.error('Branch getirme hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
    });
  }
});

// Admin: Tüm şubeleri şirket bilgileriyle getir
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const branches = await Branch.find().sort({ city: 1, name: 1 });
    const formattedBranches = branches.map(branch => ({
      ...branch.toObject(),
      id: branch._id.toString()
    }));
    res.json({ success: true, data: formattedBranches });
  } catch (error) {
    console.error('Admin branch getirme hatası:', error.message);
  }
});

// ID ile şube getir
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Şube bulunamadı' 
      });
    }
    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('Branch getirme hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
    });
  }
});

// Yeni şube oluştur (Admin korumalı + validation)
router.post('/', authMiddleware, branchValidation, async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    console.log('✅ Yeni şube oluşturuldu:', branch.name);
    res.status(201).json({
      success: true,
      data: branch,
      message: 'Şube başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Branch oluşturma hatası:', error.message);
    res.status(400).json({ 
      success: false, 
      message: 'Oluşturma başarısız',
    });
  }
});

// Şube güncelle (Admin korumalı + validation)
router.put('/:id', authMiddleware, idParamValidation, branchValidation, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!branch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Şube bulunamadı' 
      });
    }
    
    console.log('✅ Şube güncellendi:', branch.name);
    res.json({
      success: true,
      data: branch,
      message: 'Şube başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Branch güncelleme hatası:', error.message);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
    });
  }
});

// Şube sil (Admin korumalı + validation)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Şube bulunamadı' 
      });
    }
    
    console.log('✅ Şube silindi:', branch.name);
    res.json({
      success: true,
      message: 'Şube başarıyla silindi'
    });
  } catch (error) {
    console.error('Branch silme hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Silme başarısız',
    });
  }
});

module.exports = router;

