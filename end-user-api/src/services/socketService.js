const Chat = require('../models/Chat');
const aiService = require('./aiService');
const analyticsService = require('./analyticsService');

/**
 * Initialize and configure the Socket.IO service
 * @param {Object} io - The Socket.IO server instance
 */
const initializeSocketService = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`[SOCKET DEBUG] User ${socket.id} joined room: ${roomId}`);
    });

    // Leave chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`[SOCKET DEBUG] User ${socket.id} left room: ${roomId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      console.log('[SOCKET DEBUG] Message received via socket:', JSON.stringify(data, null, 2));
      try {
        const { sessionId, message, userId, timestamp } = data;

        if (!sessionId || !message) {
          console.log('[SOCKET DEBUG] Error: Missing sessionId or message');
          socket.emit('error', { message: 'Session ID and message are required' });
          return;
        }
        
        // Find the existing chat session
        const chat = await Chat.findOne({ sessionId });

        if (!chat) {
          console.log(`[SOCKET DEBUG] Chat session not found for sessionId: ${sessionId}`);
          socket.emit('error', { message: 'Chat session not found' });
          return;
        }

        // Emit event to management API so agents can see all new user messages
        console.log(`[SOCKET DEBUG] Broadcasting user message to mgmt for sessionId: ${sessionId}`);
        io.emit('new_user_message', {
          sessionId,
          chatId: chat._id,
          message,
          userId,
          timestamp: timestamp || new Date(),
          userInfo: chat.userInfo || {}
        });

        // If chat is already transferred to human agent, handle differently
        if (chat.isTransferredToAgent && !chat.isAgentResolved) {
          console.log(`[SOCKET DEBUG] Message forwarded to agent for sessionId: ${sessionId}`);
          chat.messages.push({
            role: 'user',
            content: message
          });
          // Save the message and respond that the chat is waiting for agent
          await chat.save();

          // Emit to the mgmt-api agent channel
          io.emit('agent_support_needed', {
            chatId: sessionId,
            message,
            timestamp: new Date(),
            userInfo: chat.userInfo || {},
            isTransferred: true
          });

          socket.emit('system_message', {
            message: 'Tin nhắn của bạn đã được gửi tới nhân viên tư vấn. Vui lòng đợi phản hồi.',
            waitingForAgent: true
          });
          return;
        }
        // Add user message to the chat history
        chat.messages.push({
          role: 'user',
          content: message
        });

        console.log(`[SOCKET DEBUG] Processing user message: "${message}"`);

        // Prepare context for AI response generation
        const messagesForAI = chat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Simple version - no intent detection or RAG integration
        // We'll set some defaults for the metadata
        chat.metadata.intent = 'general_inquiry';

        // No product suggestions in simplified version
        let productSuggestions = [];

        // Generate AI response
        console.log('[SOCKET DEBUG] Generating AI response');
        const aiResponse = await aiService.generateResponse(messagesForAI);
        console.log('[SOCKET DEBUG] AI Response generated:', aiResponse);

        // Add AI response to chat history
        chat.messages.push({
          role: 'assistant',
          content: aiResponse
        });

        // Check if we should suggest human transfer
        console.log('[SOCKET DEBUG] Checking if should transfer to human');
        const shouldSuggestHumanTransfer = await aiService.shouldTransferToHuman(
          chat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        );
        console.log('[SOCKET DEBUG] Human transfer suggestion:', JSON.stringify(shouldSuggestHumanTransfer, null, 2));

        // Update the chat session
        chat.updatedAt = Date.now();
        await chat.save();
        console.log(`[SOCKET DEBUG] Chat session updated for sessionId: ${sessionId}`);

        // Send the AI response back to the specific client's room
        console.log(`[SOCKET DEBUG] Emitting AI response to room: ${sessionId}`);
        io.to(sessionId).emit('receive_message', {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });

        // Track analytics for the user message
        analyticsService.trackEvent('chat_message_received', {
          sessionId,
          intent: chat.metadata.intent,
          topics: chat.metadata.topics,
          isAuthenticated: userId !== 'anonymous'
        });

        // Add product suggestions if available
        if (productSuggestions && productSuggestions.length > 0) {
          console.log('[SOCKET DEBUG] Emitting product suggestions');
          socket.emit('suggestions', {
            products: productSuggestions
          });
        }

        // Suggest human transfer if needed
        if (shouldSuggestHumanTransfer.shouldTransfer) {
          console.log('[SOCKET DEBUG] Emitting suggestion for human transfer');
          socket.emit('suggest_human_transfer', true);
        }
      } catch (error) {
        console.error('[SOCKET DEBUG] Error processing message via socket:', error);
        socket.emit('error', {
          message: 'Error processing your message',
          error: process.env.NODE_ENV === 'production' ? null : error.message
        });
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      console.log(`[SOCKET DEBUG] User typing in room ${data.room}:`, JSON.stringify(data, null, 2));
      socket.to(data.room).emit('user_typing', data);
    });

    // Listen for agent messages from management UI
    socket.on('agent_message', async (data) => {
      try {
        console.log('[SOCKET DEBUG] Agent message received via agent_message event:', JSON.stringify(data, null, 2));
        const { sessionId, message, agentName, timestamp } = data;

        if (!sessionId || !message) {
          console.log('[SOCKET DEBUG] Error: Missing sessionId or message in agent_message');
          return;
        }

        await handleAgentReply(io, sessionId, message, agentName || 'Nhân viên tư vấn', socket.id);
      } catch (error) {
        console.error('[SOCKET DEBUG] Error processing agent_message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('[SOCKET DEBUG] Client disconnected:', socket.id);
    });
  });
};

/**
 * Handle agent replies to user messages
 * @param {Object} io - Socket.IO instance
 * @param {string} sessionId - Chat session ID
 * @param {string} content - Message content
 * @param {string} agentName - Name of the agent
 * @param {string} agentId - ID of the agent
 * @returns {Promise<boolean>} - Success status
 */
async function handleAgentReply(io, sessionId, content, agentName, agentId) {
  try {
    if (!sessionId || !content) {
      console.log('[SOCKET DEBUG] Error: Missing sessionId or content in agent reply');
      return false;
    }

    // Find the chat by sessionId
    const chat = await Chat.findOne({ sessionId });

    if (!chat) {
      console.log(`[SOCKET DEBUG] Chat session not found for sessionId: ${sessionId}`);
      return false;
    }

    // Prepare agent message
    const agentMessage = {
      role: 'agent',
      content: content,
      agentId: agentId,
      agentName: agentName || 'Nhân viên tư vấn',
      timestamp: new Date()
    };

    // Add agent message to chat history
    chat.messages.push(agentMessage);
    chat.lastAgentResponse = Date.now();
    await chat.save();

    console.log(`[SOCKET DEBUG] Agent message saved to chat ${sessionId} and forwarding to user`);

    // Forward message to user in their room (sessionId)
    io.to(sessionId).emit('receive_message', {
      role: 'agent',
      content: content,
      agentName: agentMessage.agentName,
      timestamp: new Date()
    });

    // Also notify other agents that this chat was updated
    io.to('agent-dashboard').emit('chat_updated', {
      chatId: sessionId,
      updatedBy: agentId,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('[SOCKET DEBUG] Error in handleAgentReply:', error);
    return false;
  }
}

module.exports = {
  initializeSocketService,
  handleAgentReply
};
