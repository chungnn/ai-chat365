const mongoose = require('mongoose');
const User = require('./User');

const tokenUsageSchema = new mongoose.Schema({
  identifier: { type: String, required: true, index: true }, // userId or pseudoId
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  tokens: {
    type: Map,
    of: Number,
    default: {} // Lưu chi tiết theo loại: { user_message: X, ai_response: Y, ... }
  },
  pseudoId: { type: String, index: true } // Optional field to store pseudoId
}, { timestamps: true });

tokenUsageSchema.index({ identifier: 1, date: 1 }, { unique: true });

// Static method to get total usage for a pseudoId
tokenUsageSchema.statics.getTotalUsageByPseudoId = async function(pseudoId) {
  const result = await this.aggregate([
    { $match: { identifier: pseudoId } },
    { $group: {
      _id: null,
      totalTokens: { $sum: '$tokens' },
      usageByType: { 
        $mergeObjects: '$details'
      }
    }}
  ]);
  return result[0] || { totalTokens: 0, usageByType: {} };
};

/**
 * Updates token usage for a given identifier and date.
 * @param {String} identifier - The user or pseudo ID.
 * @param {String} date - The date in YYYY-MM-DD format.
 * @param {Number} tokens - The number of tokens to add.
 * @param {Object} details - The details of token usage by type.
 */
tokenUsageSchema.statics.updateTokenUsage = async function(identifier, pseudoId, date, tokens) {
  const update = {
    $inc: {
      'tokens.user_message': tokens.user_message || 0,
      'tokens.ai_response': tokens.ai_response || 0
    }
  };

  return await this.findOneAndUpdate(
    { identifier, pseudoId, date },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Retrieves token usage for a given identifier and date.
 * @param {String} identifier - The user or pseudo ID.
 * @param {String} date - The date in YYYY-MM-DD format.
 * @returns {Object} - The token usage details.
 */ 
tokenUsageSchema.statics.getTokenUsage = async function(identifier, date) {
  const usage = await this.findOne({ identifier, date });
  return usage ? usage.toObject() : null;
};

module.exports = mongoose.model('TokenUsage', tokenUsageSchema);
