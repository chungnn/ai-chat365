const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['system', 'user', 'assistant', 'agent'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Only used for agent messages
  agentId: {
    type: String,
    default: null
  },
  agentName: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userInfo: {
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    }
  },
  messages: [messageSchema],
  isTransferredToAgent: {
    type: Boolean,
    default: false
  },
  isAgentResolved: {
    type: Boolean,
    default: false
  },  agentTransferReason: {
    type: String,
    default: ''
  },
  resolution: {
    type: String,
    default: ''
  },  lastAgentResponse: {
    type: Date,
    default: null
  },  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    source: {
      type: String,
      default: 'website'
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    referrer: {
      type: String,
      default: ''
    },
    intent: {
      type: String,
      default: 'general_inquiry'
    },
    topics: {
      type: [String],
      default: []
    }
  }
}, { timestamps: true });

// Index for efficient searching
chatSchema.index({ 'metadata.intent': 1 });
chatSchema.index({ 'userInfo.phone': 1 });
chatSchema.index({ 'userInfo.email': 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ isTransferredToAgent: 1, isAgentResolved: 1 });

// Methods to add messages
chatSchema.methods.addUserMessage = function (content) {
  this.messages.push({
    role: 'user',
    content,
    timestamp: new Date()
  });
  return this;
};

chatSchema.methods.addAssistantMessage = function (content) {
  this.messages.push({
    role: 'assistant',
    content,
    timestamp: new Date()
  });
  return this;
};

chatSchema.methods.addSystemMessage = function (content) {
  this.messages.push({
    role: 'system',
    content,
    timestamp: new Date()
  });
  return this;
};

chatSchema.methods.addAgentMessage = function (content, agentId, agentName) {
  this.messages.push({
    role: 'agent',
    content,
    agentId,
    agentName,
    timestamp: new Date()
  });
  this.lastAgentResponse = new Date();
  return this;
};

// Static method to find chats awaiting agent response
chatSchema.statics.findAwaitingAgentResponse = function (limit = 20) {
  return this.find({
    isTransferredToAgent: true,
    isAgentResolved: false
  })
    .sort({ lastAgentResponse: 1, createdAt: 1 })
    .limit(limit);
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
