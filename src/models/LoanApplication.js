const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: [true, 'Loan ID is required']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  nationalId: {
    type: String,
    required: [true, 'National ID/Passport number is required'],
    trim: true,
    unique: true
  },
  incomeSource: {
    type: String,
    required: [true, 'Income source is required'],
    trim: true,
    enum: {
      values: ['salary', 'business', 'freelance', 'investment', 'rental', 'other'],
      message: 'Invalid income source'
    }
  },
  monthlyIncome: {
    type: Number,
    required: [true, 'Monthly income is required'],
    min: [0, 'Monthly income cannot be negative'],
    max: [1000000, 'Monthly income cannot exceed $1,000,000']
  },
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [100, 'Minimum loan amount is $100'],
    max: [1000000, 'Maximum loan amount is $1,000,000']
  },
  reasonForLoan: {
    type: String,
    required: [true, 'Reason for loan is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters long'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  extraNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Extra notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be either pending, approved, or rejected'
    },
    default: 'pending'
  },
  applicationFeeStatus: {
    type: String,
    enum: {
      values: ['paid', 'unpaid'],
      message: 'Application fee status must be either paid or unpaid'
    },
    default: 'unpaid'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
loanApplicationSchema.index({ userId: 1 });
loanApplicationSchema.index({ loanId: 1 });
loanApplicationSchema.index({ status: 1 });
loanApplicationSchema.index({ applicationFeeStatus: 1 });
loanApplicationSchema.index({ createdAt: -1 });

// Compound indexes
loanApplicationSchema.index({ userId: 1, status: 1 });
loanApplicationSchema.index({ status: 1, createdAt: -1 });

// Virtual for full name
loanApplicationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted loan amount
loanApplicationSchema.virtual('formattedLoanAmount').get(function() {
  return `$${this.loanAmount.toLocaleString()}`;
});

// Virtual for formatted monthly income
loanApplicationSchema.virtual('formattedMonthlyIncome').get(function() {
  return `$${this.monthlyIncome.toLocaleString()}`;
});

// Ensure virtual fields are serialised
loanApplicationSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to set timestamps
loanApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved') {
      this.approvedAt = new Date();
    } else if (this.status === 'rejected') {
      this.rejectedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);