const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/applicationController');

const { validateLoanApplication } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Borrower routes
router.post('/', authorize('borrower'), validateLoanApplication, submitApplication);
router.get('/my', authorize('borrower'), getMyApplications);
router.delete('/:id', authorize('borrower'), cancelApplication);

// Manager routes
router.get('/pending', authorize('manager'), getPendingApplications);
router.get('/approved', authorize('manager'), getApprovedApplications);
router.put('/:id/approve', authorize('manager'), approveApplication);
router.put('/:id/reject', authorize('manager'), rejectApplication);

// Admin routes
router.get('/all', authorize('admin'), getAllApplications);

// Shared routes for stats (Managers and Admins)
router.get('/stats', authorize('manager', 'admin'), getDashboardStats);

// Shared routes (borrower, manager, admin can view details based on permissions)
router.get('/:id', getApplicationDetails);

module.exports = router;