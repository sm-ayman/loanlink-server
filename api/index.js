require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mainApp = require('../src/app');

const app = express();
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    console.log("Connecting to MongoDB in Serverless...");
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Fail fast if DB cannot be reached
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB successfully connected in Vercel!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message,
      suggestion: 'Ensure Vercel IP (0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access.'
    });
  }
});

// Pass the request to the main application routes
app.use(mainApp);

module.exports = app;
