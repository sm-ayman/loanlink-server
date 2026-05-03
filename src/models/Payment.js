const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  loanApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: [true, 'Loan application ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative'],
    default: 10 // $10 application fee
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['success', 'failed', 'pending'],
      message: 'Payment status must be either success, failed, or pending'
    },
    default: 'pending'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ loanApplicationId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true }); // Unique index for transactionId
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for payment date
paymentSchema.virtual('paymentDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialised
paymentSchema.set('toJSON', { virtuals: true });

// Static method to check if application fee is paid
paymentSchema.statics.isApplicationFeePaid = async function(loanApplicationId) {
  const payment = await this.findOne({
    loanApplicationId,
    paymentStatus: 'success'
  });
  return !!payment;
};

// Static method to get payment details by application ID
paymentSchema.statics.getPaymentDetails = async function(loanApplicationId) {
  return await this.findOne({
    loanApplicationId,
    paymentStatus: 'success'
  }).populate('userId', 'name email').populate('loanApplicationId', 'loanAmount');
};

module.exports = mongoose.model('Payment', paymentSchema);