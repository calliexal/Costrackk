const Kurs = require('../models/Kurs');
const { fetchJisdorFromBI, getLatestJisdorRate } = require('../utils/jisdorService');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const kurs = await Kurs.find()
      .sort({ tanggal: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Kurs.countDocuments();
    
    console.log(`✅ Retrieved ${kurs.length} kurs records (page ${page})`);
    
    res.json({
      data: kurs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error in getAll kurs:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let kurs = await Kurs.findOne({ tanggal: today });
    
    if (!kurs) {
      console.log('📅 No kurs data for today, fetching from JISDOR...');
      const jisdorData = await fetchJisdorFromBI(today);
      
      kurs = new Kurs({
        tanggal: today,
        usdToIdr: jisdorData.rate,
        sumber: jisdorData.source
      });
      await kurs.save();
      console.log(`✅ Saved new kurs data: ${jisdorData.rate} (${jisdorData.source})`);
    }
    
    res.json(kurs);
  } catch (error) {
    console.error('❌ Error in getToday:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getByDate = async (req, res) => {
  try {
    const { tanggal } = req.params;
    const date = new Date(tanggal);
    date.setHours(0, 0, 0, 0);
    
    // Validate date
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Format tanggal tidak valid' });
    }
    
    let kurs = await Kurs.findOne({ tanggal: date });
    
    if (!kurs) {
      console.log(`📅 No kurs data for ${tanggal}, fetching from JISDOR...`);
      const jisdorData = await fetchJisdorFromBI(date);
      
      kurs = new Kurs({
        tanggal: date,
        usdToIdr: jisdorData.rate,
        sumber: jisdorData.source
      });
      await kurs.save();
      console.log(`✅ Saved new kurs data for ${tanggal}: ${jisdorData.rate} (${jisdorData.source})`);
    }
    
    res.json(kurs);
  } catch (error) {
    console.error(`❌ Error in getByDate for ${req.params.tanggal}:`, error);
    res.status(500).json({ message: error.message });
  }
};

exports.getLatest = async (req, res) => {
  try {
    console.log('🔄 Fetching latest available JISDOR rate...');
    const latestData = await getLatestJisdorRate();
    
    // Check if we already have this data in database
    let kurs = await Kurs.findOne({ tanggal: latestData.date });
    
    if (!kurs) {
      kurs = new Kurs({
        tanggal: latestData.date,
        usdToIdr: latestData.rate,
        sumber: latestData.source
      });
      await kurs.save();
    }
    
    res.json({
      ...kurs.toObject(),
      isLatest: latestData.isLatest,
      daysOld: latestData.daysOld
    });
  } catch (error) {
    console.error('❌ Error in getLatest:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const kurs = new Kurs(req.body);
    await kurs.save();
    console.log(`✅ Manual kurs created: ${kurs.usdToIdr} for ${kurs.tanggal}`);
    res.status(201).json(kurs);
  } catch (error) {
    console.error('❌ Error creating kurs:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.uploadCSV = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Data CSV tidak valid' });
    }
    
    const results = [];
    const errors = [];
    
    for (const row of data) {
      try {
        const date = new Date(row.tanggal);
        date.setHours(0, 0, 0, 0);
        
        if (isNaN(date.getTime())) {
          errors.push(`Tanggal tidak valid: ${row.tanggal}`);
          continue;
        }
        
        const usdToIdr = parseFloat(row.usdToIdr);
        if (isNaN(usdToIdr) || usdToIdr <= 0) {
          errors.push(`Kurs tidak valid untuk tanggal ${row.tanggal}: ${row.usdToIdr}`);
          continue;
        }
        
        const kurs = await Kurs.findOneAndUpdate(
          { tanggal: date },
          {
            tanggal: date,
            usdToIdr: usdToIdr,
            sumber: 'MANUAL'
          },
          { upsert: true, new: true }
        );
        results.push(kurs);
      } catch (error) {
        errors.push(`Error processing row ${row.tanggal}: ${error.message}`);
      }
    }
    
    console.log(`✅ CSV Upload completed: ${results.length} success, ${errors.length} errors`);
    
    res.json({ 
      message: `${results.length} data kurs berhasil diupload`, 
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Error in uploadCSV:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const kurs = await Kurs.findByIdAndDelete(req.params.id);
    if (!kurs) {
      return res.status(404).json({ message: 'Data kurs tidak ditemukan' });
    }
    
    console.log(`✅ Kurs deleted: ${kurs.usdToIdr} for ${kurs.tanggal}`);
    res.json({ 
      message: 'Data kurs berhasil dihapus',
      deletedKurs: {
        id: kurs._id,
        tanggal: kurs.tanggal,
        usdToIdr: kurs.usdToIdr
      }
    });
  } catch (error) {
    console.error('❌ Error deleting kurs:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.refreshJisdor = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    console.log(`🔄 Force refreshing JISDOR for ${targetDate.toISOString().split('T')[0]}`);
    
    const jisdorData = await fetchJisdorFromBI(targetDate);
    
    const kurs = await Kurs.findOneAndUpdate(
      { tanggal: targetDate },
      {
        tanggal: targetDate,
        usdToIdr: jisdorData.rate,
        sumber: jisdorData.source
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ JISDOR refreshed: ${jisdorData.rate} (${jisdorData.source})`);
    
    res.json({
      message: 'JISDOR berhasil direfresh',
      data: kurs,
      source: jisdorData.source
    });
  } catch (error) {
    console.error('❌ Error in refreshJisdor:', error);
    res.status(500).json({ message: error.message });
  }
};