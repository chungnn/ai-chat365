/**
 * Update the User model to include language preference
 */
const mongoose = require('mongoose');

// Add language field to existing User schema
const userSchemaUpdate = {
  language: {
    type: String,
    enum: ['en', 'vi'],
    default: 'en'
  }
};

// Apply this update to your User model if it doesn't already have the language field
try {
  const User = mongoose.model('User');
  const userSchema = User.schema;
  
  // Only add the field if it doesn't exist
  if (!userSchema.paths.language) {
    userSchema.add(userSchemaUpdate);
    console.log('User schema updated with language field');
  }
} catch (error) {
  console.error('Error updating User schema:', error);
}
