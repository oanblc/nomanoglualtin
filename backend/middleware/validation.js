const { body, param, validationResult } = require('express-validator');
const { SECTION_IDS } = require('../config/sections');

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

// Base64 görsel data-URI doğrulama
// Sadece image/jpeg|png|webp|gif kabul eder, maxBytes decoded boyut sınırı.
const base64ImageValidator = (maxBytes) => (value) => {
  if (value === undefined || value === null || value === '') return true; // opsiyonel
  if (typeof value !== 'string') throw new Error('Geçersiz veri tipi');

  const match = /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) {
    throw new Error('Yalnızca data:image/(jpeg|png|webp|gif);base64,... formatı kabul edilir');
  }

  // Decoded byte boyutu: base64 uzunluğu * 3/4 - padding
  const b64 = match[2];
  const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  const decodedBytes = Math.floor((b64.length * 3) / 4) - padding;

  if (decodedBytes > maxBytes) {
    throw new Error(`Görsel boyutu ${(maxBytes / 1024 / 1024).toFixed(1)}MB sınırını aştı`);
  }
  return true;
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
  body('companyTitle')
    .optional()
    .isLength({ max: 200 }).withMessage('Şirket ünvanı çok uzun')
    .customSanitizer(sanitizeString),
  body('taxOffice')
    .optional()
    .isLength({ max: 100 }).withMessage('Vergi dairesi çok uzun')
    .customSanitizer(sanitizeString),
  body('taxNumber')
    .optional()
    .isLength({ max: 20 }).withMessage('Vergi no çok uzun')
    .customSanitizer(sanitizeString),
  body('tradeRegistryNo')
    .optional()
    .isLength({ max: 50 }).withMessage('Ticaret sicil no çok uzun')
    .customSanitizer(sanitizeString),
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

// Çalışan giriş validasyonu
const employeeLoginValidation = [
  body('password')
    .notEmpty().withMessage('Şifre gerekli')
    .isLength({ max: 100 }).withMessage('Şifre çok uzun'),
  validate
];

// Transaction (KYC Formu) validasyonu
const transactionValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('İsim Soyisim gerekli')
    .isLength({ max: 200 }).withMessage('İsim çok uzun')
    .customSanitizer(sanitizeString),
  body('identityNumber')
    .trim()
    .notEmpty().withMessage('TC/Vergi No gerekli')
    .isLength({ min: 11, max: 11 }).withMessage('TC/Vergi No 11 hane olmalı')
    .isNumeric().withMessage('TC/Vergi No sadece rakam olmalı'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Telefon gerekli')
    .isLength({ max: 20 }).withMessage('Telefon çok uzun'),
  body('occupation')
    .optional()
    .isLength({ max: 200 }).withMessage('Meslek bilgisi çok uzun')
    .customSanitizer(sanitizeString),
  body('address')
    .trim()
    .notEmpty().withMessage('Adres gerekli')
    .isLength({ max: 1000 }).withMessage('Adres çok uzun'),
  body('transactionType')
    .optional()
    .isIn(['alis', 'satis']).withMessage('Geçersiz işlem türü'),
  body('date')
    .notEmpty().withMessage('Tarih gerekli'),
  body('branchId')
    .notEmpty().withMessage('Şube gerekli')
    .isMongoId().withMessage('Geçersiz şube ID'),
  body('totalAmount')
    .notEmpty().withMessage('Toplam tutar gerekli')
    .isFloat({ min: 0 }).withMessage('Geçersiz tutar'),
  body('details')
    .optional()
    .isLength({ max: 2000 }).withMessage('Detay çok uzun'),
  body('additionalInfo')
    .optional()
    .isLength({ max: 1000 }).withMessage('Ek bilgi çok uzun'),
  body('kvkkConsent')
    .notEmpty().withMessage('KVKK onayı gerekli'),
  body('signature')
    .optional()
    .custom(base64ImageValidator(1024 * 1024)), // 1MB
  body('idCardFront')
    .optional()
    .custom(base64ImageValidator(3 * 1024 * 1024)), // 3MB
  body('idCardBack')
    .optional()
    .custom(base64ImageValidator(3 * 1024 * 1024)), // 3MB
  validate
];

// Kullanıcı (staff) oluşturma/güncelleme validasyonu
// password create'te zorunlu (route'ta kontrol edilir), update'te opsiyonel.
const userValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Kullanıcı adı gerekli')
    .isLength({ max: 50 }).withMessage('Kullanıcı adı çok uzun')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Kullanıcı adı yalnızca harf, rakam, . _ - içerebilir'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 100 }).withMessage('Şifre en az 6, en fazla 100 karakter olmalı'),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('İsim çok uzun')
    .customSanitizer(sanitizeString),
  body('permissions')
    .optional()
    .isArray().withMessage('İzinler dizi olmalı')
    .custom((arr) => arr.every((p) => SECTION_IDS.includes(p))).withMessage('Geçersiz izin değeri'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive boolean olmalı'),
  validate
];

module.exports = {
  validate,
  sanitizeString,
  loginValidation,
  userValidation,
  articleValidation,
  branchValidation,
  customPriceValidation,
  familyCardValidation,
  idParamValidation,
  employeeLoginValidation,
  transactionValidation
};
