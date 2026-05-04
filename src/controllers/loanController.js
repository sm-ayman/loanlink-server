const Loan = require('../models/Loan');
const { getFileUrl, deleteFile, cleanupFiles } = require('../middleware/upload');

// Get all loans (public route with filters)
const getAllLoans = async (req, res) => {
  try {
    const {
      category,
      minInterest,
      maxInterest,
      minLimit,
      maxLimit,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minInterest || maxInterest) {
      filter.interestRate = {};
      if (minInterest) filter.interestRate.$gte = parseFloat(minInterest);
      if (maxInterest) filter.interestRate.$lte = parseFloat(maxInterest);
    }

    if (minLimit || maxLimit) {
      filter.maxLoanLimit = {};
      if (minLimit) filter.maxLoanLimit.$gte = parseFloat(minLimit);
      if (maxLimit) filter.maxLoanLimit.$lte = parseFloat(maxLimit);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Get loans with pagination
    const loans = await Loan.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLoans = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(totalLoans / limit);

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLoans,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting loans'
    });
  }
};

// Get loans for home page (showOnHome: true)
const getHomeLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ showOnHome: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        loans
      }
    });
  } catch (error) {
    console.error('Get home loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting home loans'
    });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id).populate('createdBy', 'name email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.json({
      success: true,
      data: {
        loan
      }
    });
  } catch (error) {
    console.error('Get loan by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting loan'
    });
  }
};

// Create new loan (Manager/Admin only)
const createLoan = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      interestRate,
      maxLoanLimit,
      requiredDocuments,
      emiPlans,
      showOnHome
    } = req.body;

    // Handle file uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => getFileUrl(file.filename));
    }

    // Create loan
    const loan = new Loan({
      title,
      description,
      category,
      interestRate: parseFloat(interestRate),
      maxLoanLimit: parseFloat(maxLoanLimit),
      requiredDocuments: requiredDocuments || [],
      emiPlans: emiPlans || [],
      images: req.files && req.files.length > 0 
        ? req.files.map(file => file.filename) 
        : (Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : [])),
      createdBy: req.user._id,
      showOnHome: showOnHome === 'true' || showOnHome === true
    });

    await loan.save();

    // Populate createdBy for response
    await loan.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: {
        loan
      }
    });
  } catch (error) {
    console.error('Create loan error:', error);

    // Clean up uploaded files if loan creation fails
    if (req.files) {
      cleanupFiles(req.files);
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating loan'
    });
  }
};

// Update loan (Manager/Admin only)
const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if user can update this loan (only creator or admin)
    if (req.user.role !== 'admin' && loan.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update loans you created'
      });
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      // Delete old local images
      if (loan.images && loan.images.length > 0) {
        loan.images.forEach(image => {
          if (!image.startsWith('http')) {
            deleteFile(image);
          }
        });
      }
    }

    // Update fields from request body
    const { title, description, category, interestRate, maxLoanLimit, showOnHome, requiredDocuments, emiPlans } = req.body;

    if (title) loan.title = title;
    if (description) loan.description = description;
    if (category) loan.category = category.toLowerCase();
    if (interestRate) loan.interestRate = parseFloat(interestRate);
    if (maxLoanLimit) loan.maxLoanLimit = parseFloat(maxLoanLimit);
    if (showOnHome !== undefined) loan.showOnHome = showOnHome === 'true' || showOnHome === true;
    
    if (requiredDocuments) {
        loan.requiredDocuments = Array.isArray(requiredDocuments) ? requiredDocuments : [requiredDocuments];
    }
    if (emiPlans) {
        loan.emiPlans = Array.isArray(emiPlans) ? emiPlans : [emiPlans];
    }

    // Update images
    if (req.files && req.files.length > 0) {
      loan.images = req.files.map(file => file.filename);
    } else if (req.body.images) {
        const incomingImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        loan.images = incomingImages;
    }

    await loan.save();

    // Populate createdBy for response
    await loan.populate('createdBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: { loan }
    });
  } catch (error) {
    console.error('Error in updateLoan:', error);

    // Clean up uploaded files if update fails
    if (req.files) {
      cleanupFiles(req.files);
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating loan'
    });
  }
};

// Delete loan (Manager/Admin only)
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    // Find loan
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if user can delete this loan (only creator or admin)
    if (req.user.role !== 'admin' && loan.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete loans you created'
      });
    }

    // Delete associated images
    if (loan.images && loan.images.length > 0) {
      loan.images.forEach(image => deleteFile(image));
    }

    // Delete loan
    await Loan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    console.error('Delete loan error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting loan'
    });
  }
};

// Get loans created by current user (Manager only)
const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        loans
      }
    });
  } catch (error) {
    console.error('Get my loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting your loans'
    });
  }
};

// Duplicate a loan (Manager/Admin only)
const duplicateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const originalLoan = await Loan.findById(id);
    
    if (!originalLoan) {
      return res.status(404).json({
        success: false,
        message: 'Original loan not found'
      });
    }

    const duplicatedLoan = new Loan({
      title: `${originalLoan.title} (Copy)`,
      description: originalLoan.description,
      category: originalLoan.category,
      interestRate: originalLoan.interestRate,
      maxLoanLimit: originalLoan.maxLoanLimit,
      requiredDocuments: originalLoan.requiredDocuments,
      emiPlans: originalLoan.emiPlans,
      images: [], // Don't copy images to avoid file management complexity
      createdBy: req.user._id,
      showOnHome: false
    });

    await duplicatedLoan.save();

    res.status(201).json({
      success: true,
      message: 'Loan duplicated successfully',
      data: {
        loan: duplicatedLoan
      }
    });
  } catch (error) {
    console.error('Duplicate loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error duplicating loan'
    });
  }
};

module.exports = {
  getAllLoans,
  getHomeLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  getMyLoans,
  duplicateLoan
};