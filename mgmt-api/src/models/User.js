const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it was modified or is new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(plainPassword) {
  // Trực tiếp so sánh mật khẩu đã nhập với mật khẩu đã hash trong database
  return await bcrypt.compare(plainPassword, this.password);
};

// Method to generate auth token using RS256 algorithm
UserSchema.methods.generateAuthToken = function() {
  if (!config.jwt || !config.jwt.privateKey) {
    throw new Error('JWT private key not found. Cannot generate token.');
  }
  
  return jwt.sign(
    { 
      id: this._id,
      role: this.role
    },
    config.jwt.privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: config.jwt.expiresIn 
    }
  );
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

// admin@example.com - admin123