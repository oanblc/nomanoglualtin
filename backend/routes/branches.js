const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');

// Tüm şubeleri getir
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ city: 1, name: 1 });
    // _id'yi id'ye dönüştür
    const formattedBranches = branches.map(branch => ({
      ...branch.toObject(),
      id: branch._id.toString()
    }));
    res.json({
      success: true,
      data: formattedBranches
    });
  } catch (error) {
    console.error('Branch getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
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
    console.error('Branch getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Yeni şube oluştur
router.post('/', async (req, res) => {
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
    console.error('Branch oluşturma hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Oluşturma başarısız',
      error: error.message 
    });
  }
});

// Şube güncelle
router.put('/:id', async (req, res) => {
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
    console.error('Branch güncelleme hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
      error: error.message 
    });
  }
});

// Şube sil
router.delete('/:id', async (req, res) => {
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
    console.error('Branch silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Silme başarısız',
      error: error.message 
    });
  }
});

module.exports = router;

