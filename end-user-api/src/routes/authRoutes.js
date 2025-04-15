const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes - require authentication
router.get('/me', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.changePassword);

module.exports = router;