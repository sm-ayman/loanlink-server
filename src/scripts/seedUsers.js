const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const salt = await bcrypt.genSalt(10);

        const usersToSeed = [
            {
                name: 'System Admin',
                email: 'admin@loanlink.com',
                password: 'admin123',
                role: 'admin',
                photoURL: 'https://via.placeholder.com/150?text=Admin'
            },
            {
                name: 'Loan Manager',
                email: 'manager@gamil.com',
                password: 'Manager#123',
                role: 'manager',
                photoURL: 'https://via.placeholder.com/150?text=Manager'
            },
            {
                name: 'Demo Borrower',
                email: 'borrower@loanlink.com',
                password: 'borrower123',
                role: 'borrower',
                photoURL: 'https://via.placeholder.com/150?text=Borrower'
            }
        ];

        for (const userData of usersToSeed) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`⚠️  User ${userData.email} already exists. Updating role and password...`);
                existingUser.role = userData.role;
                existingUser.password = userData.password;
                existingUser.name = userData.name;
                await existingUser.save();
            } else {
                await User.create(userData);
                console.log(`✅ Created user: ${userData.email}`);
            }
        }

        console.log('🚀 Successfully seeded users!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding users:', err);
        process.exit(1);
    }
}

seed();
