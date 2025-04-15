const Chat = require('../models/Chat');
const User = require('../models/User'); // Replace Admin with User
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Helper function to authenticate socket connections with JWT
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return next(new Error('Authentication error: Admin not found'));
    }
    
    // Add user to socket
    socket.admin = user; // Keep the reference as socket.admin for compatibility
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

const handleSocket = (socket) => {
  // Check if the connection has been authenticated
  if (!socket.admin) {
    console.warn('Unauthenticated socket connection attempt');
    socket.disconnect();
    return;
  }
    const adminId = socket.admin._id;
  const adminName = socket.admin.firstName ? 
    `${socket.admin.firstName} ${socket.admin.lastName || ''}`.trim() : 
    (socket.admin.name || socket.admin.email || 'Unknown Admin');
  
  console.log(`Admin connected: ${adminName} (${adminId})`);
  
  // Join admin specific room for targeted updates
  socket.join(`admin:${adminId}`);
  
  // Handle joining a room directly (from end-user format)
  socket.on('join_room', async (roomId) => {
    try {
      if (!roomId) {
        socket.emit('error', { message: 'Invalid room ID: roomId is required' });
        return;
      }
      
      // The roomId is the session ID
      socket.join(roomId);
      console.log(`Admin ${adminId} joined room with session ID: ${roomId}`);
      
      // Try to find the chat with this session ID
      let chat;
      try {
        // First try to find by sessionId field
        chat = await Chat.findOne({ sessionId: roomId });
        
        // If not found, try to use the room ID as the chat ID
        if (!chat) {
          chat = await Chat.findById(roomId);
        }
        
        if (!chat) {
          console.warn(`No chat found for session ID: ${roomId}`);
          // We don't return here as we still want to join the room
          // in case messages arrive later
        }
      } catch (error) {
        console.error(`Error finding chat with session ID ${roomId}:`, error);
        // Continue execution - we still want to join the room
      }
      
      // Emit success event even if no chat was found
      socket.emit('room_joined', { roomId, success: true });
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { 
        message: 'Failed to join room', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Handle admin leaving a room directly (for end-user format)
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Admin ${adminId} left room: ${roomId}`);
  });
  
  // Handle message read status updates
  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatId, messageIds } = data;
      
      // Update messages
      await Chat.updateOne(
        { _id: chatId, 'messages._id': { $in: messageIds } },
        { $set: { 'messages.$[elem].isRead': true } },
        { arrayFilters: [{ 'elem._id': { $in: messageIds } }], multi: true }
      );
      
      // Notify the chat room about read status update
      socket.to(`chat:${chatId}`).emit('messages_read', {
        chatId,
        messageIds,
        adminId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to update read status' });
    }
  });
  
  // Handle admin closing a chat
  socket.on('close_chat', async (data) => {
    try {
      const { chatId } = data;
      
      // Check if chat exists
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }
      
      // Close the chat
      chat.status = 'closed';
      
      // Add system message
      chat.messages.push({
        sender: 'system',
        senderId: adminId,
        content: 'Chat has been closed',
        timestamp: Date.now(),
        isRead: true
      });
      
      await chat.save();
      
      // Notify all clients in this chat room
      socket.to(`chat:${chatId}`).emit('chat_closed', {
        chatId,
        closedBy: {
          id: adminId,
          name: socket.admin.name
        },
        timestamp: Date.now()
      });
      
      // Confirm chat was closed
      socket.emit('chat_closed_confirmation', { chatId, success: true });
    } catch (error) {
      console.error('Error closing chat:', error);
      socket.emit('error', { message: 'Failed to close chat' });
    }
  });
    // Handle admin sending a reply
  socket.on('send_reply', async (data) => {
    try {
      const { chatId, content, sessionId } = data;
      
      // Check if chat exists
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }
      
      const agentName = socket.admin.name || 'Agent';
        // Add agent message using the helper method from Chat model
      chat.addAgentMessage(content, adminId.toString(), agentName);
      
      await chat.save();
      
      // Get the newly added message (last message in the array)
      const sentMessage = chat.messages[chat.messages.length - 1];
      
      // Broadcast to the end-user room using the standardized sessionId
      socket.to(sessionId).emit('agent_message', {
        role: 'agent',
        content: sentMessage.content,
        agentName,
        timestamp: sentMessage.timestamp
      });
      
      // Confirm reply was sent successfully to the sender
      socket.emit('reply_sent', {
        sessionId,
        message: sentMessage,
        success: true
      });
      
      console.log(`Admin ${agentName} (${adminId}) sent reply to (session: ${sessionId})`);
    } catch (error) {
      console.error('Error sending reply:', error);
      socket.emit('error', { message: 'Failed to send reply' });
    }
  });

  // Handle admin reconnection by rejoining their assigned chats
  socket.on('admin_reconnect', async () => {
    try {
      // Find all active chats assigned to this admin
      const activeChats = await Chat.find({ 
        adminId, 
        status: 'active' 
      }).select('_id');
      
      // Join all active chat rooms
      activeChats.forEach(chat => {
        socket.join(`chat:${chat._id}`);
        console.log(`Admin ${adminId} rejoined chat: ${chat._id}`);
      });
      
      socket.emit('reconnect_success', { 
        activeChats: activeChats.map(chat => chat._id) 
      });
    } catch (error) {
      console.error('Error during admin reconnection:', error);
      socket.emit('error', { message: 'Failed to reconnect to active chats' });
    }  });
  
  // Handle joining agent dashboard for global notifications
  socket.on('join_agent_dashboard', () => {
    socket.join('agent-dashboard');
    console.log(`Admin ${adminId} joined agent-dashboard room`);
  });

  // The socket server will forward the new_user_message event to all admins in the agent-dashboard room
  // This is already handled in the io.on('connection') setup in index.js
  
  // Handle admin disconnection
  socket.on('disconnect', () => {
    console.log(`Admin disconnected: ${socket.admin.name} (${adminId})`);
  });
};

module.exports = {
  authenticateSocket,
  handleSocket
};
