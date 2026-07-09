const { body, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Komponen validation rules
const validateKomponen = [
  body('namaKomponen')
    .trim()
    .notEmpty()
    .withMessage('Nama komponen harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama komponen harus 2-100 karakter')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Nama komponen hanya boleh mengandung huruf, angka, spasi, dan tanda hubung'),
  
  body('satuan')
    .trim()
    .notEmpty()
    .withMessage('Satuan harus diisi')
    .isLength({ max: 20 })
    .withMessage('Satuan maksimal 20 karakter'),
  
  body('deskripsi')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter'),
  
  handleValidationErrors
];

// Produk validation rules
const validateProduk = [
  body('namaProduk')
    .trim()
    .notEmpty()
    .withMessage('Nama produk harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama produk harus 2-100 karakter'),
  
  body('deskripsi')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter'),
  
  body('bom')
    .isArray({ min: 1 })
    .withMessage('BOM harus berupa array dengan minimal 1 item'),
  
  body('bom.*.komponenId')
    .notEmpty()
    .withMessage('Komponen ID harus diisi')
    .isMongoId()
    .withMessage('Komponen ID tidak valid'),
  
  body('bom.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity harus lebih dari 0'),
  
  handleValidationErrors
];

// Riwayat validation rules
const validateRiwayat = [
  body('komponenId')
    .notEmpty()
    .withMessage('Komponen ID harus diisi')
    .isMongoId()
    .withMessage('Komponen ID tidak valid'),
  
  body('namaKomponen')
    .trim()
    .notEmpty()
    .withMessage('Nama komponen harus diisi')
    .isLength({ max: 100 })
    .withMessage('Nama komponen maksimal 100 karakter'),
  
  body('supplier')
    .trim()
    .notEmpty()
    .withMessage('Supplier harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier harus 2-100 karakter'),
  
  body('tanggalPengadaan')
    .isISO8601()
    .withMessage('Format tanggal tidak valid')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('Tanggal pengadaan tidak boleh di masa depan');
      }
      return true;
    }),
  
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity harus lebih dari 0'),
  
  body('hargaSatuan')
    .isFloat({ min: 0.01 })
    .withMessage('Harga satuan harus lebih dari 0'),
  
  body('matauang')
    .isIn(['IDR', 'USD'])
    .withMessage('Mata uang harus IDR atau USD'),
  
  body('kursJisdor')
    .isFloat({ min: 0.01 })
    .withMessage('Kurs JISDOR harus lebih dari 0')
    .custom((value, { req }) => {
      if (req.body.matauang === 'USD' && value === 1) {
        throw new Error('Kurs JISDOR harus diisi untuk mata uang USD');
      }
      return true;
    }),
  
  body('noPO')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('No PO maksimal 50 karakter'),
  
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Catatan maksimal 500 karakter'),
  
  handleValidationErrors
];

// Kurs validation rules
const validateKurs = [
  body('tanggal')
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  
  body('usdToIdr')
    .isFloat({ min: 1000, max: 50000 })
    .withMessage('Kurs USD to IDR harus antara 1000-50000'),
  
  body('sumber')
    .optional()
    .isIn(['JISDOR', 'JISDOR_API', 'JISDOR_XML', 'MANUAL', 'FALLBACK'])
    .withMessage('Sumber harus salah satu dari: JISDOR, JISDOR_API, JISDOR_XML, MANUAL, FALLBACK'),
  
  handleValidationErrors
];

// ID parameter validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('ID tidak valid'),
  
  handleValidationErrors
];

module.exports = {
  validateKomponen,
  validateProduk,
  validateRiwayat,
  validateKurs,
  validateMongoId,
  handleValidationErrors
};