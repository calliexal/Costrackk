const Produk = require('../models/Produk');
const Riwayat = require('../models/Riwayat');
const Kurs = require('../models/Kurs');
const { calculateStatistics } = require('../utils/hpeCalculator');
const { fetchJisdorFromBI } = require('../utils/jisdorService');

exports.calculateHPE = async (req, res) => {
  try {
    const { produkId } = req.params;
    const { currency = 'IDR' } = req.query; // Support IDR or USD
    
    const produk = await Produk.findById(produkId);
    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    // Get current kurs for USD conversion
    let currentKurs = 1;
    if (currency === 'USD') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let kurs = await Kurs.findOne({ tanggal: today });
      
      if (!kurs) {
        const jisdorData = await fetchJisdorFromBI(today);
        kurs = new Kurs({
          tanggal: today,
          usdToIdr: jisdorData.rate,
          sumber: jisdorData.source
        });
        await kurs.save();
      }
      currentKurs = kurs.usdToIdr;
    }
    
    const hpeResults = {
      produk: {
        id: produk._id,
        nama: produk.namaProduk,
        deskripsi: produk.deskripsi
      },
      currency: currency,
      kursReference: currency === 'USD' ? currentKurs : null,
      komponen: [],
      totalHPE: {
        minimum: 0,
        maksimum: 0,
        median: 0,
        rataRata: 0
      }
    };
    
    for (const bomItem of produk.bom) {
      const riwayatData = await Riwayat.find({ 
        komponenId: bomItem.komponenId 
      }).sort({ tanggalPengadaan: -1 });
      
      if (riwayatData.length === 0) {
        hpeResults.komponen.push({
          komponenId: bomItem.komponenId,
          namaKomponen: bomItem.namaKomponen,
          quantity: bomItem.quantity,
          satuan: bomItem.satuan,
          hpePerSatuan: null,
          hpeTotal: null,
          jumlahData: 0,
          message: 'Tidak ada data riwayat pengadaan'
        });
        continue;
      }
      
      // Use appropriate currency field
      const hargaArray = currency === 'USD' 
        ? riwayatData.map(r => r.hargaUSD)
        : riwayatData.map(r => r.hargaIDR);
      
      const stats = calculateStatistics(hargaArray);
      
      const hpeKomponen = {
        komponenId: bomItem.komponenId,
        namaKomponen: bomItem.namaKomponen,
        quantity: bomItem.quantity,
        satuan: bomItem.satuan,
        hpePerSatuan: {
          minimum: stats.min,
          maksimum: stats.max,
          median: stats.median,
          rataRata: stats.mean
        },
        hpeTotal: {
          minimum: stats.min * bomItem.quantity,
          maksimum: stats.max * bomItem.quantity,
          median: stats.median * bomItem.quantity,
          rataRata: stats.mean * bomItem.quantity
        },
        jumlahData: riwayatData.length,
        dataBreakdown: {
          idr: riwayatData.filter(r => r.matauang === 'IDR').length,
          usd: riwayatData.filter(r => r.matauang === 'USD').length
        }
      };
      
      hpeResults.komponen.push(hpeKomponen);
      
      hpeResults.totalHPE.minimum += hpeKomponen.hpeTotal.minimum;
      hpeResults.totalHPE.maksimum += hpeKomponen.hpeTotal.maksimum;
      hpeResults.totalHPE.median += hpeKomponen.hpeTotal.median;
      hpeResults.totalHPE.rataRata += hpeKomponen.hpeTotal.rataRata;
    }
    
    // Round all totals
    hpeResults.totalHPE.minimum = Math.round(hpeResults.totalHPE.minimum);
    hpeResults.totalHPE.maksimum = Math.round(hpeResults.totalHPE.maksimum);
    hpeResults.totalHPE.median = Math.round(hpeResults.totalHPE.median);
    hpeResults.totalHPE.rataRata = Math.round(hpeResults.totalHPE.rataRata);
    
    res.json(hpeResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
