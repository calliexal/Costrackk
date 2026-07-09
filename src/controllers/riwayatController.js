const Riwayat = require('../models/Riwayat');
const Kurs = require('../models/Kurs');
const { fetchJisdorFromBI } = require('../utils/jisdorService');

exports.getAll = async (req, res) => {
  try {
    const riwayat = await Riwayat.find()
      .populate('komponenId')
      .sort({ tanggalPengadaan: -1 });
    res.json(riwayat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const riwayat = await Riwayat.findById(req.params.id).populate('komponenId');
    if (!riwayat) return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    res.json(riwayat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByKomponen = async (req, res) => {
  try {
    const riwayat = await Riwayat.find({ komponenId: req.params.komponenId })
      .sort({ tanggalPengadaan: -1 });
    res.json(riwayat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Ensure kursJisdor is set
    if (!req.body.kursJisdor || req.body.kursJisdor <= 0) {
      if (req.body.matauang === 'USD') {
        // Auto-fetch kurs untuk USD
        const tanggal = new Date(req.body.tanggalPengadaan);
        tanggal.setHours(0, 0, 0, 0);
        
        let kurs = await Kurs.findOne({ tanggal });
        if (!kurs) {
          const jisdorData = await fetchJisdorFromBI(tanggal);
          kurs = new Kurs({
            tanggal,
            usdToIdr: jisdorData.rate,
            sumber: jisdorData.source
          });
          await kurs.save();
        }
        req.body.kursJisdor = kurs.usdToIdr;
      } else {
        // IDR: set kurs = 1
        req.body.kursJisdor = 1;
      }
    }
    
    const riwayat = new Riwayat(req.body);
    await riwayat.save();
    res.status(201).json(riwayat);
  } catch (error) {
    console.error('Error creating riwayat:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    // Ensure kursJisdor is set
    if (!req.body.kursJisdor || req.body.kursJisdor <= 0) {
      if (req.body.matauang === 'USD') {
        // Auto-fetch kurs untuk USD
        const tanggal = new Date(req.body.tanggalPengadaan);
        tanggal.setHours(0, 0, 0, 0);
        
        let kurs = await Kurs.findOne({ tanggal });
        if (!kurs) {
          const jisdorData = await fetchJisdorFromBI(tanggal);
          kurs = new Kurs({
            tanggal,
            usdToIdr: jisdorData.rate,
            sumber: jisdorData.source
          });
          await kurs.save();
        }
        req.body.kursJisdor = kurs.usdToIdr;
      } else {
        // IDR: set kurs = 1
        req.body.kursJisdor = 1;
      }
    }
    
    const riwayat = await Riwayat.findById(req.params.id);
    if (!riwayat) return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    
    Object.assign(riwayat, req.body);
    await riwayat.save();
    
    res.json(riwayat);
  } catch (error) {
    console.error('Error updating riwayat:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const riwayat = await Riwayat.findByIdAndDelete(req.params.id);
    if (!riwayat) return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    res.json({ message: 'Riwayat berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
