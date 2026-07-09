const mongoose = require('mongoose');

const kursSchema = new mongoose.Schema({
  tanggal: {
    type: Date,
    required: true,
    unique: true
  },
  usdToIdr: {
    type: Number,
    required: true,
    min: 0
  },
  sumber: {
    type: String,
    enum: ['JISDOR', 'JISDOR_API', 'JISDOR_XML', 'MANUAL', 'FALLBACK'],
    default: 'MANUAL'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Kurs', kursSchema);
