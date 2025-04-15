const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  color: {
    type: String,
    default: '#4a6cf7', // Default color
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt timestamp
tagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
