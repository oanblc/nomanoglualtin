const { body, param, validationResult } = require('express-validator');

// Validation sonuçlarını kontrol eden middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz veri',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// HTML ve zararlı karakterleri temizle (XSS koruması)
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Login validasyonu
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Kullanıcı adı gerekli')
    .isLength({ max: 50 }).withMessage('Kullanıcı adı çok uzun')
    .customSanitizer(sanitizeString),
  body('password')
    .notEmpty().withMessage('Şifre gerekli')
    .isLength({ max: 100 }).withMessage('Şifre çok uzun'),
  validate
];

// Article validasyonu
const articleValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık gerekli')
    .isLength({ max: 200 }).withMessage('Başlık çok uzun')
    .customSanitizer(sanitizeString),
  body('content')
    .optional()
    .isLength({ max: 50000 }).withMessage('İçerik çok uzun'),
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished boolean olmalı'),
  body('order')
    .optional()
    .isInt({ min: 0, max: 9999 }).withMessage('Geçersiz sıra numarası'),
  validate
];

// Branch validasyonu
const branchValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Şube adı gerekli')
    .isLength({ max: 100 }).withMessage('Şube adı çok uzun')
    .customSanitizer(sanitizeString),
  body('city')
    .trim()
    .notEmpty().withMessage('Şehir gerekli')
    .isLength({ max: 50 }).withMessage('Şehir adı çok uzun')
    .customSanitizer(sanitizeString),
  body('address')
    .optional()
    .isLength({ max: 500 }).withMessage('Adres çok uzun')
    .customSanitizer(sanitizeString),
  body('phone')
    .optional()
    .isLength({ max: 20 }).withMessage('Telefon çok uzun')
    .matches(/^[0-9\s\-\+\(\)]*$/).withMessage('Geçersiz telefon formatı'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive boolean olmalı'),
  validate
];

// CustomPrice validasyonu
const customPriceValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Ürün kodu gerekli')
    .isLength({ max: 50 }).withMessage('Ürün kodu çok uzun')
    .customSanitizer(sanitizeString),
  body('name')
    .trim()
    .notEmpty().withMessage('Ürün adı gerekli')
    .isLength({ max: 100 }).withMessage('Ürün adı çok uzun')
    .customSanitizer(sanitizeString),
  body('buyPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Geçersiz alış fiyatı'),
  body('sellPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Geçersiz satış fiyatı'),
  body('order')
    .optional()
    .isInt({ min: 0, max: 9999 }).withMessage('Geçersiz sıra numarası'),
  validate
];

// FamilyCard validasyonu
const familyCardValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık gerekli')
    .isLength({ max: 100 }).withMessage('Başlık çok uzun')
    .customSanitizer(sanitizeString),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Açıklama çok uzun')
    .customSanitizer(sanitizeString),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive boolean olmalı'),
  body('order')
    .optional()
    .isInt({ min: 0, max: 9999 }).withMessage('Geçersiz sıra numarası'),
  validate
];

// MongoDB ObjectId validasyonu
const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Geçersiz ID formatı'),
  validate
];

module.exports = {
  validate,
  sanitizeString,
  loginValidation,
  articleValidation,
  branchValidation,
  customPriceValidation,
  familyCardValidation,
  idParamValidation
};
