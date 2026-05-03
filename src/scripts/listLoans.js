const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Loan = require('../models/Loan');

async function list() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const loans = await Loan.find({}).select('title category createdAt');
        console.log('Total loans:', loans.length);
        console.log(JSON.stringify(loans, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
list();
