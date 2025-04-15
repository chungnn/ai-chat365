const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Authentication middleware
 * Verifies JWT token in the request header and adds user info to req object
 */
module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token, quyền truy cập bị từ chối'
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};