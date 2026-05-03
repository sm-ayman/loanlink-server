const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  registerFromFirebase,
  loginFromFirebase
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin
} = require('../middleware/validation');

const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/register-firebase', registerFromFirebase);
router.post('/login-firebase', loginFromFirebase);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;