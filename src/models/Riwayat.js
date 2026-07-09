const mongoose = require('mongoose');

const riwayatSchema = new mongoose.Schema({
  komponenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Komponen',
    required: true
  },
  namaKomponen: {
    type: String,
    required: true
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  tanggalPengadaan: {
    type: Date,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  hargaSatuan: {
    type: Number,
    required: true,
    min: 0
  },
  matauang: {
    type: String,
    enum: ['IDR', 'USD'],
    default: 'IDR'
  },
  kursJisdor: {
    type: Number,
    default: 1,
    min: 0
  },
  hargaIDR: {
    type: Number,
    min: 0
  },
  hargaUSD: {
    type: Number,
    min: 0
  },
  noPO: {
    type: String,
    trim: true
  },
  catatan: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save: hitung hargaIDR dan hargaUSD
riwayatSchema.pre('save', function(next) {
  // Set default kurs jika belum ada
  if (!this.kursJisdor || this.kursJisdor <= 0) {
    this.kursJisdor = 1;
  }
  
  // Validasi kurs untuk USD
  if (this.matauang === 'USD' && this.kursJisdor === 1) {
    console.warn('⚠️ Warning: USD transaction with kurs = 1, should fetch JISDOR rate');
  }
  
  // Hitung konversi
  if (this.matauang === 'USD') {
    this.hargaUSD = this.hargaSatuan;
    this.hargaIDR = Math.round(this.hargaSatuan * this.kursJisdor);
  } else {
    this.hargaIDR = this.hargaSatuan;
    this.hargaUSD = this.kursJisdor > 1 ? Math.round((this.hargaSatuan / this.kursJisdor) * 100) / 100 : this.hargaSatuan;
  }
  
  next();
});

module.exports = mongoose.model('Riwayat', riwayatSchema);
