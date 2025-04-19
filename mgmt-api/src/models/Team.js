const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  members: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    role: { 
      type: String, 
      enum: ['member', 'lead', 'manager'], 
      default: 'member' 
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  categories: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category' 
  }],
  iamPolicies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IAMPolicy'
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware to update the 'updatedAt' field
TeamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Team', TeamSchema);
