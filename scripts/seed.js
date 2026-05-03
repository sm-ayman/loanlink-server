const mongoose = require('mongoose');
const User = require('../src/models/User');
const Loan = require('../src/models/Loan');
require('dotenv').config();

// Test user data
const testUsers = [
  {
    name: 'Super Admin',
    email: 'superadmin@loanlink.com',
    password: 'admin123',
    role: 'admin',
    photoURL: 'https://ui-avatars.com/api/?name=Super+Admin&background=ff6b6b&color=fff'
  },
  {
    name: 'Admin User',
    email: 'admin@loanlink.com',
    password: 'admin123',
    role: 'admin',
    photoURL: 'https://ui-avatars.com/api/?name=Admin+User&background=4ecdc4&color=fff'
  },
  {
    name: 'Manager One',
    email: 'manager1@loanlink.com',
    password: 'manager123',
    role: 'manager',
    photoURL: 'https://ui-avatars.com/api/?name=Manager+One&background=45b7d1&color=fff'
  },
  {
    name: 'Manager Two',
    email: 'manager2@loanlink.com',
    password: 'manager123',
    role: 'manager',
    photoURL: 'https://ui-avatars.com/api/?name=Manager+Two&background=f9ca24&color=fff'
  },
  {
    name: 'John Borrower',
    email: 'borrower1@loanlink.com',
    password: 'borrower123',
    role: 'borrower',
    photoURL: 'https://ui-avatars.com/api/?name=John+Borrower&background=a29bfe&color=fff'
  },
  {
    name: 'Jane Borrower',
    email: 'borrower2@loanlink.com',
    password: 'borrower123',
    role: 'borrower',
    photoURL: 'https://ui-avatars.com/api/?name=Jane+Borrower&background=fd79a8&color=fff'
  }
];

// Sample loan data
const sampleLoans = [
  {
    title: 'Personal Loan',
    description: 'Quick personal loans for emergency needs, medical expenses, or unexpected bills. Flexible repayment terms with competitive interest rates.',
    category: 'personal',
    interestRate: 12.5,
    maxLoanLimit: 50000,
    requiredDocuments: ['ID Proof', 'Income Certificate', 'Address Proof'],
    emiPlans: ['6 months', '12 months', '24 months', '36 months'],
    images: ['https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400'],
    showOnHome: true
  },
  {
    title: 'Business Loan',
    description: 'Expand your business with our flexible business loans. Perfect for working capital, equipment purchase, or business expansion.',
    category: 'business',
    interestRate: 15.0,
    maxLoanLimit: 200000,
    requiredDocuments: ['Business License', 'Financial Statements', 'Tax Returns'],
    emiPlans: ['12 months', '24 months', '36 months', '48 months'],
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    showOnHome: true
  },
  {
    title: 'Education Loan',
    description: 'Invest in your future with our education loans. Cover tuition fees, books, accommodation, and other educational expenses.',
    category: 'education',
    interestRate: 8.5,
    maxLoanLimit: 100000,
    requiredDocuments: ['Admission Letter', 'Fee Structure', 'Income Proof'],
    emiPlans: ['12 months', '24 months', '36 months', '60 months'],
    images: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'],
    showOnHome: true
  },
  {
    title: 'Home Improvement Loan',
    description: 'Renovate or improve your home with our home improvement loans. Competitive rates for home repairs, renovations, and upgrades.',
    category: 'home',
    interestRate: 11.0,
    maxLoanLimit: 150000,
    requiredDocuments: ['Property Documents', 'Income Proof', 'Quotation'],
    emiPlans: ['24 months', '36 months', '48 months', '60 months'],
    images: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'],
    showOnHome: true
  },
  {
    title: 'Vehicle Loan',
    description: 'Drive your dream car with our vehicle loans. Competitive interest rates for new or used vehicles.',
    category: 'vehicle',
    interestRate: 10.5,
    maxLoanLimit: 80000,
    requiredDocuments: ['Vehicle Quotation', 'Income Proof', 'ID Proof'],
    emiPlans: ['24 months', '36 months', '48 months', '60 months'],
    images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'],
    showOnHome: false
  },
  {
    title: 'Emergency Loan',
    description: 'Quick emergency loans for unexpected financial needs. Fast approval and disbursal within 24 hours.',
    category: 'emergency',
    interestRate: 18.0,
    maxLoanLimit: 25000,
    requiredDocuments: ['ID Proof', 'Income Proof'],
    emiPlans: ['6 months', '12 months', '18 months'],
    images: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400'],
    showOnHome: true
  },
  {
    title: 'Medical Loan',
    description: 'Cover medical expenses with our medical loans. Quick approval for hospitalization, surgery, and medical treatments.',
    category: 'emergency',
    interestRate: 9.5,
    maxLoanLimit: 75000,
    requiredDocuments: ['Medical Bills', 'Doctor Certificate', 'Income Proof'],
    emiPlans: ['12 months', '24 months', '36 months'],
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    showOnHome: false
  },
  {
    title: 'Wedding Loan',
    description: 'Make your special day memorable with our wedding loans. Cover wedding expenses, ceremonies, and celebrations.',
    category: 'personal',
    interestRate: 13.5,
    maxLoanLimit: 100000,
    requiredDocuments: ['Wedding Card', 'Expense Estimate', 'Income Proof'],
    emiPlans: ['12 months', '24 months', '36 months'],
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400'],
    showOnHome: false
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loanlink');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Loan.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.role})`);
    }

    // Create sample loans (assign to managers)
    const managers = createdUsers.filter(user => user.role === 'manager');
    let managerIndex = 0;

    for (const loanData of sampleLoans) {
      const manager = managers[managerIndex % managers.length];
      const loan = new Loan({
        ...loanData,
        createdBy: manager._id
      });
      await loan.save();
      console.log(`Created loan: ${loan.title} (by ${manager.name})`);
      managerIndex++;
    }

    console.log('\n=== SEEDING COMPLETED SUCCESSFULLY ===');
    console.log('\nTest Accounts Created:');
    console.log('=====================================');
    console.log('SUPER ADMIN:');
    console.log('  Email: superadmin@loanlink.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('');
    console.log('ADMIN:');
    console.log('  Email: admin@loanlink.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('');
    console.log('MANAGERS:');
    console.log('  Email: manager1@loanlink.com | Password: manager123');
    console.log('  Email: manager2@loanlink.com | Password: manager123');
    console.log('  Role: manager');
    console.log('');
    console.log('BORROWERS:');
    console.log('  Email: borrower1@loanlink.com | Password: borrower123');
    console.log('  Email: borrower2@loanlink.com | Password: borrower123');
    console.log('  Role: borrower');
    console.log('');
    console.log('Note: These accounts use direct email/password authentication (not Firebase)');
    console.log('They can be used for testing the backend APIs directly.');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };