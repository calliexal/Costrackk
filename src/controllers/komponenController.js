const Komponen = require('../models/Komponen');
const Produk = require('../models/Produk');
const Riwayat = require('../models/Riwayat');

exports.getAll = async (req, res) => {
  try {
    const komponen = await Komponen.find().sort({ namaKomponen: 1 });
    res.json(komponen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const komponen = await Komponen.findById(req.params.id);
    if (!komponen) return res.status(404).json({ message: 'Komponen tidak ditemukan' });
    res.json(komponen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const komponen = new Komponen(req.body);
    await komponen.save();
    res.status(201).json(komponen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const komponen = await Komponen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!komponen) return res.status(404).json({ message: 'Komponen tidak ditemukan' });
    res.json(komponen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const komponenId = req.params.id;
    
    // Check if komponen exists
    const komponen = await Komponen.findById(komponenId);
    if (!komponen) {
      return res.status(404).json({ message: 'Komponen tidak ditemukan' });
    }
    
    // Check if komponen is used in any produk BOM
    const produkWithKomponen = await Produk.find({
      'bom.komponenId': komponenId
    });
    
    if (produkWithKomponen.length > 0) {
      const produkNames = produkWithKomponen.map(p => p.namaProduk).join(', ');
      return res.status(400).json({
        message: 'Komponen tidak dapat dihapus karena masih digunakan dalam produk',
        details: `Produk yang menggunakan: ${produkNames}`,
        usedInProducts: produkWithKomponen.map(p => ({
          id: p._id,
          name: p.namaProduk
        }))
      });
    }
    
    // Check if komponen has riwayat data
    const riwayatCount = await Riwayat.countDocuments({ komponenId });
    
    if (riwayatCount > 0) {
      return res.status(400).json({
        message: 'Komponen tidak dapat dihapus karena memiliki data riwayat pengadaan',
        details: `Terdapat ${riwayatCount} data riwayat yang menggunakan komponen ini`,
        riwayatCount
      });
    }
    
    // Safe to delete
    await Komponen.findByIdAndDelete(komponenId);
    res.json({ 
      message: 'Komponen berhasil dihapus',
      deletedKomponen: {
        id: komponen._id,
        name: komponen.namaKomponen
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
