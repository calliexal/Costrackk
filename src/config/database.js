const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB Connected');
  } catch (err) {
    console.warn('⚠ MongoDB Connection Error:', err.message);
    console.log('✓ Using Mock Database for Development');
    console.log('  Data will be stored in memory and in data.json file');
    
    // Initialize mock database instead
    require('./mockDatabase');
  }
};

module.exports = connectDB;
