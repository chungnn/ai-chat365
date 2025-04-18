const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const Tag = require('../models/Tag');

// Get all chats for admin dashboard
exports.getAllChats = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const isResolved = req.query.isResolved === 'true';
    
    // Build query
    const query = {
      // isTransferredToAgent: true,
      // isAgentResolved: isResolved
    };
    
    // Paginate results
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find chats with pagination, populate tags, and project only necessary fields
    const chats = await Chat.aggregate([
      { $match: query },
      { $sort: { createdAt: -1, lastAgentResponse: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      // Get only the last message for each chat
      { $addFields: { 
        lastMessage: { $arrayElemAt: ["$messages", -1] },
        messageCount: { $size: "$messages" }
      }},
      // Remove the full messages array
      { $project: { 
        messages: 0 
      }}
    ]);
    
    // Populate tags for each chat
    await Chat.populate(chats, { path: 'tags' });
    
    // Count total chats
    const totalChats = await Chat.countDocuments(query);
    
    res.status(200).json({
      message: 'Chats retrieved successfully',
      chats,
      pagination: {
        total: totalChats,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalChats / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve chats',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find chat by ID
    const chat = await Chat.findById(id).populate('tags');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json({
      message: 'Chat retrieved successfully',
      chat
    });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({
      message: 'Failed to retrieve chat',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update chat tags
exports.updateChatTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    
    // Validate tags array
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array of tag IDs'
      });
    }
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Update chat tags
    chat.tags = tags;
    await chat.save();
    
    // Populate tags information
    await chat.populate('tags');
    
    // Send update to connected clients via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(`chat:${chat._id}`).emit('chat_updated', {
        chatId: chat._id,
        tags: chat.tags
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat tags updated successfully',
      tags: chat.tags
    });
  } catch (error) {
    console.error('Update chat tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat tags',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Assign chat to agent
exports.assignChat = async (req, res) => {
  try {
    const { id } = req.params;
    // Allow specifying a different agent in the request body
    const agentId = req.body.agentId || req.user._id.toString();
    
    // Find the agent user
    const User = require('../models/User');
    const agent = await User.findById(agentId);
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    const agentName = agent.name || 'Agent';
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Add system message about agent assignment
    chat.addSystemMessage(`Chat assigned to agent: ${agentName}`);
    
    // Update chat properties with the assigned agent
    chat.isTransferredToAgent = true;
    chat.lastAgentResponse = new Date();
    chat.assignedTo = agentId;
    
    await chat.save();
    
    // Send update to connected clients via Socket.IO
    req.app.get('io').to(`chat:${chat._id}`).emit('agent_assigned', {
      chatId: chat._id,
      agentId,
      agentName
    });
    
    res.status(200).json({
      message: 'Chat assigned successfully',
      chat
    });
  } catch (error) {
    console.error('Assign chat error:', error);
    res.status(500).json({
      message: 'Failed to assign chat',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Send message in chat
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const agentId = req.user._id.toString();
    const agentName = req.user.name || 'Agent';
    
    // Validate content field
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Add agent message
    chat.addAgentMessage(content, agentId, agentName);
    
    await chat.save();
    
    // Send message to connected clients via Socket.IO
    req.app.get('io').to(`chat:${chat._id}`).emit('new_message', {
      chatId: chat._id,
      message: chat.messages[chat.messages.length - 1]
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: chat.messages[chat.messages.length - 1]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Close a chat
exports.closeChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Mark chat as resolved
    chat.isAgentResolved = true;
    chat.resolution = resolution || 'Resolved by agent';
    
    // Add system message
    chat.addSystemMessage('Chat has been resolved and closed');
    
    await chat.save();
    
    // Send update to connected clients via Socket.IO
    req.app.get('io').to(`chat:${chat._id}`).emit('chat_closed', {
      chatId: chat._id
    });
    
    res.status(200).json({
      message: 'Chat closed successfully',
      chat
    });
  } catch (error) {
    console.error('Close chat error:', error);
    res.status(500).json({
      message: 'Failed to close chat',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Reply to chat (separate endpoint for chat replies)
exports.replyToChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const agentId = req.user._id.toString();
    const agentName = req.user.name || 'Agent';
    
    // Validate content field
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Add agent message
    chat.addAgentMessage(content, agentId, agentName);
    
    await chat.save();
    
    // Send reply to connected clients via Socket.IO
    req.app.get('io').to(`chat:${chat._id}`).emit('new_reply', {
      chatId: chat._id,
      message: chat.messages[chat.messages.length - 1],
      agentName: agentName
    });
    
    res.status(201).json({
      message: 'Reply sent successfully',
      chatMessage: chat.messages[chat.messages.length - 1]    });
  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({
      message: 'Failed to send reply',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update chat status
exports.updateChatStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isTransferredToAgent } = req.body;
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Update status if provided
    if (status) {
      chat.status = status;
    }
    
    // Update isTransferredToAgent if provided
    if (typeof isTransferredToAgent === 'boolean') {
      chat.isTransferredToAgent = isTransferredToAgent;
      
      // Add system message when chat is marked as transferred to agent
      if (isTransferredToAgent && !chat._previousIsTransferredToAgent) {
        const agentName = req.user.name || 'Agent';
        chat.addSystemMessage(`Chat marked as transferred to agent by ${agentName}`);
        
        // Update last agent response time
        chat.lastAgentResponse = new Date();
      }
      
      // Store previous value to prevent duplicate system messages
      chat._previousIsTransferredToAgent = chat.isTransferredToAgent;
    }
    
    await chat.save();
    
    // Broadcast the status update to all clients in this chat's room
    req.app.get('io').to(`chat:${chat._id}`).emit('chat_updated', {
      chatId: chat._id,
      status: chat.status,
      isTransferredToAgent: chat.isTransferredToAgent
    });
    
    res.status(200).json({
      message: 'Chat status updated successfully',
      chat: {
        _id: chat._id,
        status: chat.status,
        isTransferredToAgent: chat.isTransferredToAgent
      }
    });
  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({
      message: 'Failed to update chat status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update chat category
exports.updateChatCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Store the old category to add in the system message
    const oldCategory = chat.category || 'none';
    
    // Update chat category
    chat.category = categoryId;
    
    // Add system message about category change if it's actually changing
    if (oldCategory !== categoryId) {
      const agentName = req.user.name || 'Agent';
      chat.addSystemMessage(`Category changed from ${oldCategory} to ${categoryId || 'none'} by ${agentName}`);
    }
    
    await chat.save();
    
    // Send update to connected clients via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(`chat:${chat._id}`).emit('chat_updated', {
        chatId: chat._id,
        category: chat.category
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat category updated successfully',
      category: chat.category
    });
  } catch (error) {
    console.error('Update chat category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat category',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update chat priority
exports.updateChatPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    // Validate priority value
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value. Must be low, medium, high, or urgent.'
      });
    }
    
    // Find chat by ID
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Store the old priority to add in the system message
    const oldPriority = chat.priority || 'medium';
    
    // Update chat priority
    chat.priority = priority;
    
    // Add system message about priority change if it's actually changing
    if (oldPriority !== priority) {
      const agentName = req.user.name || 'Agent';
      chat.addSystemMessage(`Priority changed from ${oldPriority} to ${priority} by ${agentName}`);
    }
    
    await chat.save();
    
    // Send update to connected clients via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(`chat:${chat._id}`).emit('chat_updated', {
        chatId: chat._id,
        priority: chat.priority
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat priority updated successfully',
      priority: chat.priority
    });
  } catch (error) {
    console.error('Update chat priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat priority',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};
