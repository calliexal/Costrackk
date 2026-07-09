const Produk = require('../models/Produk');
const Komponen = require('../models/Komponen');
const Riwayat = require('../models/Riwayat');
const Kurs = require('../models/Kurs');

exports.getDashboardStats = async (req, res) => {
  try {
    const [produkCount, komponenCount, riwayatCount, recentRiwayat, kursToday] = await Promise.all([
      Produk.countDocuments(),
      Komponen.countDocuments(),
      Riwayat.countDocuments(),
      Riwayat.find().sort({ tanggalPengadaan: -1 }).limit(5).populate('komponenId'),
      getKursToday()
    ]);
    
    // Calculate total spending
    const totalSpendingIDR = await Riwayat.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$hargaIDR', '$quantity'] } }
        }
      }
    ]);
    
    const totalSpendingUSD = await Riwayat.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$hargaUSD', '$quantity'] } }
        }
      }
    ]);
    
    // Get currency breakdown
    const currencyBreakdown = await Riwayat.aggregate([
      {
        $group: {
          _id: '$matauang',
          count: { $sum: 1 },
          totalIDR: { $sum: { $multiply: ['$hargaIDR', '$quantity'] } }
        }
      }
    ]);
    
    res.json({
      counts: {
        produk: produkCount,
        komponen: komponenCount,
        riwayat: riwayatCount
      },
      spending: {
        totalIDR: totalSpendingIDR[0]?.total || 0,
        totalUSD: totalSpendingUSD[0]?.total || 0
      },
      currencyBreakdown,
      recentRiwayat,
      kursToday
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function getKursToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const kurs = await Kurs.findOne({ tanggal: today });
  return kurs || { usdToIdr: 15500, sumber: 'FALLBACK' };
}

module.exports = exports;
