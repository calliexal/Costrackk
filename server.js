require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

// Connect to Database
connectDB();

// Start Server
const PORT = process.env.PORT || 5000;

// For Vercel, export the app
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
}
