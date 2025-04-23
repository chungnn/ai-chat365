const mongoose = require('mongoose');

const tokenUsageSchema = new mongoose.Schema({
  identifier: { type: String, required: true, index: true }, // userId or pseudoId
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  tokens: { type: Number, default: 0 },
  details: {
    type: Map,
    of: Number,
    default: {} // Lưu chi tiết theo loại: { user_message: X, ai_response: Y, ... }
  }
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

module.exports = mongoose.model('TokenUsage', tokenUsageSchema);
