const Chat = require('../models/Chat');
const User = require('../models/User');
const analyticsService = require('../services/analyticsService');

/**
 * Update ticket status
 * @route PUT /api/ticket/:ticketId/status
 * @access Private (Agent)
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, note } = req.body;
    
    if (!['open', 'in-progress', 'waiting', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const chat = await Chat.findOne({ ticketId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const oldStatus = chat.status;
    chat.status = status;
    
    // If resolving or closing the ticket, calculate resolution time
    if ((status === 'resolved' || status === 'closed') && oldStatus !== 'resolved' && oldStatus !== 'closed') {
      const createdAt = new Date(chat.createdAt);
      const now = new Date();
      const resolutionTimeMinutes = Math.round((now - createdAt) / (1000 * 60));
      chat.resolutionTimeMinutes = resolutionTimeMinutes;
    }
    
    // Add a system message about the status change
    chat.messages.push({
      role: 'system',
      content: `Ticket status changed from ${oldStatus} to ${status}${note ? ': ' + note : ''}`,
      timestamp: new Date()
    });
    
    await chat.save();
    
    // Track analytics event
    analyticsService.trackEvent('ticket_status_changed', {
      ticketId,
      oldStatus,
      newStatus: status,
      agentId: req.user.id,
      resolutionTimeMinutes: chat.resolutionTimeMinutes
    });
    
    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      chat
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status'
    });
  }
};

/**
 * Update ticket priority
 * @route PUT /api/ticket/:ticketId/priority
 * @access Private (Agent)
 */
exports.updateTicketPriority = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;
    
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value'
      });
    }
    
    const chat = await Chat.findOne({ ticketId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const oldPriority = chat.priority;
    chat.priority = priority;
    
    // Add a system message about the priority change
    chat.messages.push({
      role: 'system',
      content: `Ticket priority changed from ${oldPriority} to ${priority}`,
      timestamp: new Date()
    });
    
    await chat.save();
    
    // Track analytics event
    analyticsService.trackEvent('ticket_priority_changed', {
      ticketId,
      oldPriority,
      newPriority: priority,
      agentId: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Ticket priority updated successfully',
      chat
    });
  } catch (error) {
    console.error('Error updating ticket priority:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket priority'
    });
  }
};

/**
 * Assign ticket to agent
 * @route PUT /api/ticket/:ticketId/assign
 * @access Private (Agent)
 */
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { agentId } = req.body;
    
    const chat = await Chat.findOne({ ticketId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    let agent = null;
    let agentName = "Unassigned";
    
    if (agentId) {
      agent = await User.findById(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        });
      }
      agentName = agent.name || agent.email;
    }
    
    const oldAssignee = chat.assignedTo || "Unassigned";
    chat.agentId = agentId;
    chat.assignedTo = agentName;
    
    // If assigning to agent, update status to in-progress
    if (agentId && chat.status === 'open') {
      chat.status = 'in-progress';
    }
    
    // Add a system message about the assignment change
    chat.messages.push({
      role: 'system',
      content: agentId 
        ? `Ticket assigned to ${agentName}` 
        : `Ticket unassigned from ${oldAssignee}`,
      timestamp: new Date()
    });
    
    await chat.save();
    
    // Track analytics event
    analyticsService.trackEvent('ticket_assigned', {
      ticketId,
      oldAssignee,
      newAssignee: agentName,
      updatedBy: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      chat
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket'
    });
  }
};

/**
 * Set ticket category
 * @route PUT /api/ticket/:ticketId/category
 * @access Private (Agent)
 */
exports.updateTicketCategory = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    const chat = await Chat.findOne({ ticketId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    const oldCategory = chat.category;
    chat.category = category;
    
    // Add a system message about the category change
    if (oldCategory !== category) {
      chat.messages.push({
        role: 'system',
        content: `Ticket category changed from ${oldCategory || 'general'} to ${category}`,
        timestamp: new Date()
      });
    }
    
    await chat.save();
    
    return res.status(200).json({
      success: true,
      message: 'Ticket category updated successfully',
      chat
    });
  } catch (error) {
    console.error('Error updating ticket category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket category'
    });
  }
};

/**
 * Submit customer satisfaction rating for a ticket
 * @route POST /api/ticket/:ticketId/satisfaction
 * @access Public
 */
exports.submitSatisfactionRating = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const chat = await Chat.findOne({ ticketId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    chat.customerSatisfaction = {
      rating,
      feedback: feedback || ''
    };
    
    await chat.save();
    
    // Track analytics event
    analyticsService.trackEvent('satisfaction_rating_submitted', {
      ticketId,
      rating,
      hasFeedback: !!feedback
    });
    
    return res.status(200).json({
      success: true,
      message: 'Satisfaction rating submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting satisfaction rating:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit satisfaction rating'
    });
  }
};

/**
 * Get all tickets with filtering and pagination
 * @route GET /api/ticket
 * @access Private (Agent)
 */
exports.getTickets = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category,
      assignedTo,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }
    
    const skip = (page - 1) * limit;
    const tickets = await Chat.find(filter)
      .select('ticketId status priority category assignedTo userInfo createdAt updatedAt resolutionTimeMinutes')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });
      
    const total = await Chat.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get tickets'
    });
  }
};

/**
 * Get ticket dashboard statistics
 * @route GET /api/ticket/stats
 * @access Private (Agent)
 */
exports.getTicketStats = async (req, res) => {
  try {
    // Count tickets by status
    const statusCounts = await Chat.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Format status counts
    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item._id || 'unknown'] = item.count;
    });
    
    // Count tickets by priority
    const priorityCounts = await Chat.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);
    
    // Format priority counts
    const priorityStats = {};
    priorityCounts.forEach(item => {
      priorityStats[item._id || 'unknown'] = item.count;
    });
    
    // Calculate average resolution time
    const resolutionStats = await Chat.aggregate([
      { 
        $match: { 
          resolutionTimeMinutes: { $exists: true, $gt: 0 },
          status: { $in: ['resolved', 'closed'] }
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgResolutionTime: { $avg: "$resolutionTimeMinutes" },
          minResolutionTime: { $min: "$resolutionTimeMinutes" },
          maxResolutionTime: { $max: "$resolutionTimeMinutes" }
        } 
      }
    ]);
    
    // Calculate satisfaction rating average
    const satisfactionStats = await Chat.aggregate([
      { 
        $match: { 
          "customerSatisfaction.rating": { $exists: true, $gte: 1 }
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: "$customerSatisfaction.rating" },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    return res.status(200).json({
      success: true,
      stats: {
        byStatus: statusStats,
        byPriority: priorityStats,
        resolution: resolutionStats.length > 0 ? resolutionStats[0] : {
          avgResolutionTime: 0,
          minResolutionTime: 0,
          maxResolutionTime: 0
        },
        satisfaction: satisfactionStats.length > 0 ? {
          avgRating: satisfactionStats[0].avgRating,
          count: satisfactionStats[0].count
        } : {
          avgRating: 0,
          count: 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get ticket statistics'
    });
  }
};
