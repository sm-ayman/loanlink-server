const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Loan = require('../models/Loan');

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        // Find the specific manager provided by the user
        const targetEmail = 'manager@gamil.com'; // following user's typo 'gamil' just in case
        let creator = await User.findOne({ email: targetEmail });
        
        if (!creator) {
            console.log(`⚠️  Manager ${targetEmail} not found. Creating...`);
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Manager#123', salt);
            
            creator = await User.create({
                name: 'Loan Manager',
                email: targetEmail,
                password: hashedPassword,
                role: 'manager'
            });
            console.log(`✅ Created manager: ${targetEmail} (password: Manager#123)`);
        } else {
            console.log(`✅ Found existing manager: ${targetEmail}`);
        }

        console.log(`👤 Using user: ${creator.name} (${creator.email}) as creator`);

        // Delete existing loans (dummy data)
        const deleteResult = await Loan.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing loans.`);

        const realLoans = [
            {
                title: "Personal Future Loan",
                description: "A flexible personal loan with low interest rates for your immediate financial needs. Whether it's for travel, gadgets, or personal goals, we've got you covered with instant processing.",
                category: "personal",
                interestRate: 5.5,
                maxLoanLimit: 50000,
                requiredDocuments: ["Valid ID", "Salary Certificate", "Address Proof"],
                emiPlans: ["3 Months", "6 Months", "12 Months", "24 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            },
            {
                title: "SME Business Growth",
                description: "Scale your business to new heights with our SME growth loan. Designed specifically for small and medium enterprises with quick approval and minimal documentation.",
                category: "business",
                interestRate: 7.8,
                maxLoanLimit: 250000,
                requiredDocuments: ["Trade License", "Bank Statement", "Tax Returns"],
                emiPlans: ["12 Months", "24 Months", "36 Months", "48 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            },
            {
                title: "Education Excellence",
                description: "Don't let financial constraints stop your learning. Our education loan covers tuition fees, living expenses, and study materials for both local and international studies.",
                category: "education",
                interestRate: 4.2,
                maxLoanLimit: 35000,
                requiredDocuments: ["Admission Letter", "Educational Certificates", "Parent's Income Proof"],
                emiPlans: ["12 Months", "24 Months", "48 Months", "60 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            },
            {
                title: "Dream Home Mortgage",
                description: "Build or buy your dream home with our competitive mortgage plans. Long-term repayment options and fixed interest rates to ensure your peace of mind and stable financial planning.",
                category: "home",
                interestRate: 6.5,
                maxLoanLimit: 750000,
                requiredDocuments: ["Property Documents", "Income Proof", "Valuation Report"],
                emiPlans: ["60 Months", "120 Months", "180 Months", "240 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            },
            {
                title: "Easy Auto Finance",
                description: "Get on the road faster with our quick auto loans. Low down payments and flexible EMI plans for both new and used vehicles. Includes insurance integration options.",
                category: "vehicle",
                interestRate: 7.2,
                maxLoanLimit: 80000,
                requiredDocuments: ["Driver's License", "Income Proof", "Vehicle Quotation"],
                emiPlans: ["12 Months", "24 Months", "36 Months", "48 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            },
            {
                title: "Emergency Care Support",
                description: "Financial support when you need it most. Our emergency loan offers instant approval for medical bills, urgent home repairs, or any unexpected life events that require quick cash.",
                category: "emergency",
                interestRate: 9.0,
                maxLoanLimit: 10000,
                requiredDocuments: ["Valid ID", "Proof of Emergency/Billing"],
                emiPlans: ["3 Months", "6 Months", "12 Months"],
                images: [],
                createdBy: creator._id,
                showOnHome: true
            }
        ];

        await Loan.insertMany(realLoans);
        console.log('🚀 Successfully seeded real loan data!');
        console.log('Total loans inserted: ', realLoans.length);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

seed();
