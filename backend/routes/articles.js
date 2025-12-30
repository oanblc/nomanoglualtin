const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');
const { articleValidation, idParamValidation } = require('../middleware/validation');

// Tüm makaleleri getir
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ isPublished: true }).sort({ order: 1 });
    // _id'yi id'ye dönüştür
    const formattedArticles = articles.map(article => ({
      ...article.toObject(),
      id: article._id.toString()
    }));
    res.json({
      success: true,
      data: formattedArticles
    });
  } catch (error) {
    console.error('Article getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// ID ile makale getir
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Makale bulunamadı' 
      });
    }
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Article getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası',
      error: error.message 
    });
  }
});

// Yeni makale oluştur (Admin korumalı + validation)
router.post('/', authMiddleware, articleValidation, async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    console.log('✅ Yeni makale oluşturuldu:', article.title);
    res.status(201).json({
      success: true,
      data: article,
      message: 'Makale başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Article oluşturma hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Oluşturma başarısız',
      error: error.message 
    });
  }
});

// Makale güncelle (Admin korumalı + validation)
router.put('/:id', authMiddleware, idParamValidation, articleValidation, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Makale bulunamadı' 
      });
    }
    
    console.log('✅ Makale güncellendi:', article.title);
    res.json({
      success: true,
      data: article,
      message: 'Makale başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Article güncelleme hatası:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Güncelleme başarısız',
      error: error.message 
    });
  }
});

// Makale sil (Admin korumalı + validation)
router.delete('/:id', authMiddleware, idParamValidation, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Makale bulunamadı' 
      });
    }
    
    console.log('✅ Makale silindi:', article.title);
    res.json({
      success: true,
      message: 'Makale başarıyla silindi'
    });
  } catch (error) {
    console.error('Article silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Silme başarısız',
      error: error.message 
    });
  }
});

module.exports = router;

