const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Authentication middleware
 * Verifies JWT token in the request header and adds user info to req object
 */
module.exports = (req, res, next) => {
  // Get token from header - support both x-auth-token and Authorization: Bearer token
  let token = req.header('x-auth-token');
  
  // Check Authorization header if x-auth-token is not present
  if (!token && req.headers.authorization) {
    // Extract token from "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token, quyền truy cập bị từ chối'
    });
  }

  // Verify token
  try {
    // Check if public key for RS256 exists
    if (!config.jwt || !config.jwt.publicKey) {
      console.error('JWT public key not found. Cannot verify token.');
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống xác thực'
      });
    }
    console.log(config.jwt);
    // Verify with RS256 and public key
    const decoded = jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] });
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};