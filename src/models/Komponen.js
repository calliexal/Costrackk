const mongoose = require('mongoose');

const komponenSchema = new mongoose.Schema({
  namaKomponen: {
    type: String,
    required: true,
    trim: true
  },
  satuan: {
    type: String,
    required: true,
    trim: true
  },
  deskripsi: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Komponen', komponenSchema);
