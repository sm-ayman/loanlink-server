require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Fail fast if DB cannot be reached
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB successfully connected in Vercel!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Please check if you have whitelisted Vercel IPs (0.0.0.0/0) in MongoDB Atlas Network Access.");
    throw error;
  }
};

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
};
