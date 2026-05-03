const LoanApplication = require('../models/LoanApplication');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

// Submit loan application (Borrower only)
const submitApplication = async (req, res) => {
  try {
    const {
      loanId,
      firstName,
      lastName,
      contactNumber,
      nationalId,
      incomeSource,
      monthlyIncome,
      loanAmount,
      reasonForLoan,
      address,
      extraNotes
    } = req.body;

    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if user already has a pending application for this loan
    const existingApplication = await LoanApplication.findOne({
      userId: req.user._id,
      loanId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved application for this loan'
      });
    }

    // Validate loan amount doesn't exceed max limit
    if (loanAmount > loan.maxLoanLimit) {
      return res.status(400).json({
        success: false,
        message: `Loan amount cannot exceed $${loan.maxLoanLimit.toLocaleString()}`
      });
    }

    // Create application
    const application = new LoanApplication({
      userId: req.user._id,
      loanId,
      firstName,
      lastName,
      contactNumber,
      nationalId,
      incomeSource,
      monthlyIncome: parseFloat(monthlyIncome),
      loanAmount: parseFloat(loanAmount),
      reasonForLoan,
      address,
      extraNotes: extraNotes || ''
    });

    await application.save();

    // Populate loan and user data for response
    await application.populate([
      { path: 'loanId', select: 'title category interestRate maxLoanLimit' },
      { path: 'userId', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Submit application error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this loan'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error submitting application'
    });
  }
};

// Get user's applications (Borrower only)
const getMyApplications = async (req, res) => {
  try {
    const applications = await LoanApplication.find({ userId: req.user._id })
      .populate('loanId', 'title category interestRate maxLoanLimit')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting applications'
    });
  }
};

// Get pending applications (Manager only)
const getPendingApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await LoanApplication.find({ status: 'pending' })
      .populate('userId', 'name email')
      .populate('loanId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalApplications = await LoanApplication.countDocuments({ status: 'pending' });
    const totalPages = Math.ceil(totalApplications / limit);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: page,
          totalPages,
          totalApplications,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting pending applications'
    });
  }
};

// Get approved applications (Manager only)
const getApprovedApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await LoanApplication.find({ status: 'approved' })
      .populate('userId', 'name email')
      .populate('loanId', 'title category')
      .sort({ approvedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalApplications = await LoanApplication.countDocuments({ status: 'approved' });
    const totalPages = Math.ceil(totalApplications / limit);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: page,
          totalPages,
          totalApplications,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get approved applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting approved applications'
    });
  }
};

// Get all applications (Admin only)
const getAllApplications = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const applications = await LoanApplication.find(filter)
      .populate('userId', 'name email')
      .populate('loanId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await LoanApplication.countDocuments(filter);
    const totalPages = Math.ceil(totalApplications / limit);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalApplications,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting applications'
    });
  }
};

// Approve application (Manager only)
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application is not in pending status'
      });
    }

    // Update application status
    application.status = 'approved';
    application.approvedAt = new Date();
    await application.save();

    // Populate data for response
    await application.populate([
      { path: 'userId', select: 'name email' },
      { path: 'loanId', select: 'title category' }
    ]);

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Approve application error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error approving application'
    });
  }
};

// Reject application (Manager only)
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application is not in pending status'
      });
    }

    // Update application status
    application.status = 'rejected';
    application.rejectedAt = new Date();
    await application.save();

    // Populate data for response
    await application.populate([
      { path: 'userId', select: 'name email' },
      { path: 'loanId', select: 'title category' }
    ]);

    res.json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Reject application error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error rejecting application'
    });
  }
};

// Cancel application (Borrower only, if pending)
const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own applications'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be cancelled'
      });
    }

    await LoanApplication.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel application error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error cancelling application'
    });
  }
};

// Get application details
const getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await LoanApplication.findById(id)
      .populate('userId', 'name email')
      .populate('loanId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions based on user role
    const isOwner = application.userId._id.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Get application details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting application details'
    });
  }
};

// Get dashboard stats for charts
const getDashboardStats = async (req, res) => {
  try {
    const counts = await LoanApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    counts.forEach(item => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
      stats.total += item.count;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard stats'
    });
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getPendingApplications,
  getApprovedApplications,
  getAllApplications,
  approveApplication,
  rejectApplication,
  cancelApplication,
  getApplicationDetails,
  getDashboardStats
};