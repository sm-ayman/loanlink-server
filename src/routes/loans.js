const express = require('express');
const router = express.Router();
const {
  getAllLoans,
  getHomeLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  getMyLoans
} = require('../controllers/loanController');

const { validateLoan } = require('../middleware/validation');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadLoanImages, handleMulterError } = require('../middleware/upload');

// Manager/Admin only routes
router.get('/my/loans', authenticate, authorize('manager', 'admin'), getMyLoans);

// Public routes (optional authentication for some features)
router.get('/', optionalAuth, getAllLoans);
router.get('/home', getHomeLoans);
router.get('/:id', optionalAuth, getLoanById);

// Protected routes - require authentication for the following
router.use(authenticate);

router.post('/', authorize('manager', 'admin'), uploadLoanImages, handleMulterError, validateLoan, createLoan);
router.put('/:id', authorize('manager', 'admin'), uploadLoanImages, handleMulterError, validateLoan, updateLoan);
router.delete('/:id', authorize('manager', 'admin'), deleteLoan);

module.exports = router;