const mongoose = require('mongoose');

const komponenSchema = new mongoose.Schema({
  komponenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Komponen',
    required: true
  },
  namaKomponen: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  satuan: {
    type: String,
    required: true
  }
});

const produkSchema = new mongoose.Schema({
  namaProduk: {
    type: String,
    required: true,
    trim: true
  },
  deskripsi: {
    type: String,
    default: ''
  },
  bom: [komponenSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Produk', produkSchema);
