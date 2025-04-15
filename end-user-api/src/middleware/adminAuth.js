const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Admin Authentication middleware
 * Verifies JWT token in the request header and checks if the user is an admin
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
    
    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền admin'
      });
    }
    
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