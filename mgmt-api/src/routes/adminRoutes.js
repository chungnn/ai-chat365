const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Import any admin controllers here
// For example: const adminController = require('../controllers/adminController');

// Basic admin routes
router.get('/profile', authenticate, (req, res) => {
  // Return the admin profile from the request
  res.json({ 
    success: true, 
    data: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role
    }
  });
});

// Add more admin routes as needed
// router.get('/dashboard-data', authenticate, adminController.getDashboardData);

module.exports = router;
