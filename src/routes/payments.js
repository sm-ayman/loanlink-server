const express = require('express');
const router = express.Router();
const {
  createPaymentSession,
  handlePaymentSuccess,
  handlePaymentCancel,
  getPaymentDetails,
  getPaymentStats,
  handleWebhook
} = require('../controllers/paymentController');

const { authenticate, authorize } = require('../middleware/auth');

// Stripe webhook (no authentication needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// All other routes require authentication
router.use(authenticate);

// Borrower routes
router.post('/create-session', authorize('borrower'), createPaymentSession);

// Public payment result handlers (but authenticated)
router.get('/success', handlePaymentSuccess);
router.get('/cancel', handlePaymentCancel);

// Shared routes
router.get('/details/:applicationId', getPaymentDetails);

// Admin routes
router.get('/stats', authorize('admin'), getPaymentStats);

module.exports = router;