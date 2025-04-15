const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true,
    enum: [
      'page_view',
      'chat_session_started',
      'chat_interaction',
      'lead_capture',
      'course_view',
      'cart_add',
      'cart_remove',
      'checkout_start',
      'purchase',
      'payment_success',
      'payment_failure',
      'chat_transferred_to_agent',
      'chat_agent_resolved',
      'search',
      'knowledge_base_updated',
      'chat_message_received' // Thêm type cho chat_message_received
    ]
  },
  data: {
    type: Object,
    required: true
  }
}, { 
  timestamps: true 
});

// Create indexes for commonly queried fields
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ 'data.sessionId': 1 });
analyticsEventSchema.index({ 'data.orderId': 1 });
analyticsEventSchema.index({ 'data.phone': 1 });
analyticsEventSchema.index({ 'data.email': 1 });

// Static methods for common analytics queries
analyticsEventSchema.statics.getLeadsByTimeRange = function(startDate, endDate) {
  return this.find({
    type: 'lead_capture',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

analyticsEventSchema.statics.getPurchasesByTimeRange = function(startDate, endDate) {
  return this.find({
    type: 'purchase',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

analyticsEventSchema.statics.getEventsBySessionId = function(sessionId) {
  return this.find({
    'data.sessionId': sessionId
  }).sort({ createdAt: 1 });
};

analyticsEventSchema.statics.getEventCountByType = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);