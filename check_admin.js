const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const admin = await User.findOne({ email: 'admin@loanlink.com' });
  if (admin) {
    console.log('Admin found:', admin.email);
    console.log('Admin role:', admin.role);
    // We can't see the password but we can try to verify it
    const isMatch = await admin.comparePassword('admin123');
    console.log('Password "admin123" matches:', isMatch);
  } else {
    console.log('Admin NOT found');
  }
  
  process.exit();
}

checkAdmin();
