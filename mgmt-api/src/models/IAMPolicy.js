const mongoose = require('mongoose');

/**
 * Schema for IAM Policy condition operator
 */
const conditionOperatorSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      // Basic conditions
      'StringEquals', 'StringNotEquals', 'StringLike', 'StringNotLike',
      'NumericEquals', 'NumericNotEquals', 'NumericLessThan', 'NumericGreaterThan',
      'DateEquals', 'DateNotEquals', 'DateLessThan', 'DateGreaterThan',
      'Bool', 'BelongsTo', 'NotBelongsTo',
      
      // MongoDB specific conditions
      'MongoExists', 'MongoExpression'
    ],
    required: true
  },
  field: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

/**
 * Schema for IAM Policy statement
 */
const statementSchema = new mongoose.Schema({
  effect: { 
    type: String, 
    enum: ['Allow', 'Deny'], 
    required: true 
  },
  action: [{ 
    type: String, 
    required: true 
  }],
  resource: [{ 
    type: String, 
    required: true 
  }],
  condition: [conditionOperatorSchema]
}, { _id: false });

/**
 * Schema for IAM Policy
 */
const iamPolicySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  description: String,
  version: { 
    type: String, 
    default: '2023-01-01' 
  },
  statement: [statementSchema],
  isSystemPolicy: { 
    type: Boolean, 
    default: false 
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

// Pre-save middleware to update the 'updatedAt' field
iamPolicySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('IAMPolicy', iamPolicySchema);
