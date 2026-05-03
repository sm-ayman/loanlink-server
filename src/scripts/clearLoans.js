const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Loan = require('../models/Loan');

async function clear() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const result = await Loan.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} loans.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
clear();
