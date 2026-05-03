const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Loan title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Loan description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Loan category is required'],
    trim: true,
    enum: {
      values: ['personal', 'business', 'education', 'home', 'vehicle', 'emergency', 'other'],
      message: 'Invalid loan category'
    }
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [50, 'Interest rate cannot exceed 50%']
  },
  maxLoanLimit: {
    type: Number,
    required: [true, 'Maximum loan limit is required'],
    min: [100, 'Minimum loan limit is $100'],
    max: [1000000, 'Maximum loan limit is $1,000,000']
  },
  requiredDocuments: [{
    type: String,
    trim: true
  }],
  emiPlans: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  showOnHome: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
loanSchema.index({ category: 1 });
loanSchema.index({ showOnHome: 1 });
loanSchema.index({ createdBy: 1 });
loanSchema.index({ interestRate: 1 });

// Virtual for formatted interest rate
loanSchema.virtual('formattedInterestRate').get(function() {
  return this.interestRate != null ? `${this.interestRate}%` : '';
});

// Virtual for formatted max loan limit
loanSchema.virtual('formattedMaxLimit').get(function() {
  return this.maxLoanLimit != null ? `$${this.maxLoanLimit.toLocaleString()}` : '';
});

// Ensure virtual fields are serialised
loanSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);