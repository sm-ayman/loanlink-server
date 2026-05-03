const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// User registration validation
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase and one lowercase letter'),

  body('role')
    .optional()
    .isIn(['borrower', 'manager', 'admin'])
    .withMessage('Role must be borrower, manager, or admin'),

  body('photoURL')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),

  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Loan creation validation
const validateLoan = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .isIn(['personal', 'business', 'education', 'home', 'vehicle', 'emergency', 'other'])
    .withMessage('Invalid loan category'),

  body('interestRate')
    .isFloat({ min: 0, max: 50 })
    .withMessage('Interest rate must be between 0 and 50'),

  body('maxLoanLimit')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Maximum loan limit must be between $100 and $1,000,000'),

  body('requiredDocuments')
    .optional()
    .isArray()
    .withMessage('Required documents must be an array'),

  body('emiPlans')
    .optional()
    .isArray()
    .withMessage('EMI plans must be an array'),

  handleValidationErrors
];

// Loan application validation
const validateLoanApplication = [
  body('loanId')
    .isMongoId()
    .withMessage('Valid loan ID is required'),

  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('contactNumber')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid contact number'),

  body('nationalId')
    .trim()
    .notEmpty()
    .withMessage('National ID/Passport number is required'),

  body('incomeSource')
    .isIn(['salary', 'business', 'freelance', 'investment', 'rental', 'other'])
    .withMessage('Invalid income source'),

  body('monthlyIncome')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Monthly income must be between $0 and $1,000,000'),

  body('loanAmount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Loan amount must be between $100 and $1,000,000'),

  body('reasonForLoan')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason for loan must be between 10 and 500 characters'),

  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),

  body('extraNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Extra notes cannot exceed 500 characters'),

  handleValidationErrors
];

// User update validation (admin only)
const validateUserUpdate = [
  body('role')
    .optional()
    .isIn(['borrower', 'manager', 'admin'])
    .withMessage('Role must be borrower, manager, or admin'),

  body('isSuspended')
    .optional()
    .isBoolean()
    .withMessage('isSuspended must be a boolean'),

  body('suspendReason')
    .optional()
    .if(body('isSuspended').equals('true'))
    .trim()
    .notEmpty()
    .withMessage('Suspend reason is required when suspending a user'),

  body('suspendFeedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Suspend feedback cannot exceed 500 characters'),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateLoan,
  validateLoanApplication,
  validateUserUpdate,
  handleValidationErrors
};