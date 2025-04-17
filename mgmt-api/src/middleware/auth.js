const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }    const token = authHeader.split(' ')[1];
    
    // Check if public key for RS256 exists
    if (!config.jwt || !config.jwt.publicKey) {
      console.error('JWT public key not found. Cannot verify token.');
      return res.status(500).json({ message: 'Lỗi hệ thống xác thực' });
    }
    
    // Verify token with RS256 and public key
    const decoded = jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] });
    
    // Find user by id
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed: User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
};

module.exports = {
  authenticate
};
