const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getUserStats,
  deleteUser
} = require('../controllers/userController');

const {
  validateUserUpdate
} = require('../middleware/validation');

const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.put('/:id/role', authorize('admin'), validateUserUpdate, updateUser);
router.put('/:id/suspend', authorize('admin'), validateUserUpdate, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.get('/stats', authorize('admin'), getUserStats);

module.exports = router;