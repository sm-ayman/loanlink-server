const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const admin = await User.findOne({ email: 'admin@loanlink.com' });
        if (admin) {
            const isMatch = await bcrypt.compare('admin123', admin.password);
            console.log('Admin password match (admin123):', isMatch ? 'YES' : 'NO');
        } else {
            console.log('Admin not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
