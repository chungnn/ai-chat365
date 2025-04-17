const Chat = require('../models/Chat');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const ragService = require('../services/ragService');
const elasticsearchRagService = require('../services/elasticsearchRagService');
const analyticsService = require('../services/analyticsService');

// Kiểm tra cấu hình Gemini
const checkGeminiConfig = () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[WARNING] GEMINI_API_KEY không được cấu hình trong biến môi trường. Hệ thống sẽ sử dụng giá trị mặc định.');
    }
    return true;
  } catch (error) {
    console.error('[ERROR] Không thể khởi tạo Google Gemini:', error);
    return false;
  }
};

// Gọi hàm kiểm tra khi khởi tạo
checkGeminiConfig();

/**
 * Initialize a new chat session
 * @route POST /api/chat/session
 * @access Public
 */
exports.initSession = async (req, res) => {
  try {
    // Check if a session ID is provided in the request
    const providedSessionId = req.body.sessionId;
    let chat;
    
    // If a session ID was provided, try to find the existing chat
    if (providedSessionId) {
      chat = await Chat.findOne({ sessionId: providedSessionId });
      
      // If we found the chat, return it along with its messages
      if (chat) {
        return res.status(200).json({
          success: true,
          sessionId: chat.sessionId,
          messages: chat.messages.filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          isExistingSession: true
        });
      }
      // If sessionId was provided but no chat found, we'll create a new one below
    }
    
    // Generate a unique session ID if not provided or not found
    const sessionId = providedSessionId || uuidv4();
    
    // Extract user info if provided
    const { name, email, phone } = req.body;
    
    // Track analytics event for new chat session
    analyticsService.trackEvent('chat_session_started', {
      sessionId,
      source: req.body.source || 'website',
      referrer: req.headers.referer || '',
      isAuthenticated: req.user ? true : false
    });    // Create a new chat session
    const ticketId = 'HD-' + Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit ticket ID
    
    // Get translated greeting message
    const { t } = require('../utils/translation');
    const greeting = t(req, 'chat.greeting', { ticketId });
    chat = new Chat({
      sessionId,
      ticketId: ticketId,
      status: 'open',
      priority: 'medium',
      category: null,
      userInfo: {
        name: name || '',
        email: email || '',
        phone: phone || ''
      },
      messages: [
        {
          role: 'system',
          content: 'You are an AI helpdesk assistant. Be friendly, concise, and helpful. Your goal is to help users solve their problems or direct them to the right department. If you can\'t resolve an issue, offer to escalate it to a human agent.'
        },
        {
          role: 'assistant',
          content: greeting
        }
      ],
      metadata: {
        source: req.body.source || 'website',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        referrer: req.headers.referer || '',
        intent: 'general_inquiry',
        topics: []
      }
    });
    
    // If user is authenticated, associate this chat with their account
    if (req.user && req.user.id) {
      chat.userId = req.user.id;
      
      // If user info isn't provided in the request but we have a logged-in user
      // populate it from their profile
      if (!name && !email && !phone) {
        const user = await User.findById(req.user.id).select('name email phone');
        if (user) {
          chat.userInfo = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
          };
        }
      }
    }
      await chat.save();
    
      res.status(201).json({
      success: true,
      sessionId,
      messages: [
        {
          role: 'assistant',
          content: greeting
        }
      ]
    });
    
  } catch (error) {
    console.error('Error initializing chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Could not initialize chat session',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Send a message to the AI and get a response
 * @route POST /api/chat/message
 * @access Public
 */
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and message are required'
      });
    }
    
    // Find the existing chat session
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // If chat is already transferred to human agent, handle differently
    if (chat.isTransferredToAgent && !chat.isAgentResolved) {
      chat.messages.push({
        role: 'user',
        content: message
      });
      
      // Save the message but respond that the chat is waiting for agent
      await chat.save();
      
      // Get the io instance from the app
      
      const io = req.app.get('io');
      
      // Emit event to agent dashboard for real-time updates
      // if (io) {
      //   console.log(`[SOCKET DEBUG] Emitting new_user_message to agent-dashboard for sessionId: ${sessionId}`);
      //   io.to(`agent-dashboard`).emit('new_user_message', {
      //     sessionId,
      //     message,
      //     timestamp: new Date(),
      //     userInfo: chat.userInfo
      //   });
      // } else {
      //   console.log('[SOCKET DEBUG] io instance not available in controller');
      // }
      
      return res.json({
        success: true,
        message: 'Tin nhắn của bạn đã được gửi tới nhân viên tư vấn. Vui lòng đợi phản hồi.',
        waitingForAgent: true
      });
    }
    
    // Check if the request has a valid auth token and associate the user with this chat
    if (req.user && req.user.id) {
      // If this chat wasn't associated with a user before, associate it now
      if (!chat.userId) {
        chat.userId = req.user.id;
      }
      
      // If user info is empty but we have user data, fill it in
      if (!chat.userInfo.name || !chat.userInfo.email) {
        const user = await User.findById(req.user.id).select('name email phone');
        if (user) {
          chat.userInfo = {
            name: chat.userInfo.name || user.name || '',
            email: chat.userInfo.email || user.email || '',
            phone: chat.userInfo.phone || user.phone || ''
          };
        }
      }    }
    
    console.log(`[SOCKET DEBUG] Processing user message in chatController: "${message}"`);
    
    // Add user message to the chat history
    chat.messages.push({
      role: 'user',
      content: message
    });
    
    // Use NLP to detect intent from the message
    console.log('[SOCKET DEBUG] Detecting intent for message');
    const intent = await aiService.detectIntent(message);
    console.log('[SOCKET DEBUG] Intent detection result:', intent);
    
    // Update chat metadata with detected intent
    if (intent) {
      chat.metadata.intent = intent.mainIntent || intent.name;
      if (intent.topics && intent.topics.length > 0) {
        chat.metadata.topics = [...new Set([...chat.metadata.topics, ...intent.topics])];
      } else if (intent.name && intent.confidence > 0) {
        // Backwards compatibility for older intent detection format
        if (!chat.metadata.topics.includes(intent.name)) {
          chat.metadata.topics.push(intent.name);
        }
      }    console.log('[SOCKET DEBUG] Updated chat metadata:', chat.metadata);
    }
    
    // Get relevant information from Elasticsearch knowledge base
    console.log('[SOCKET DEBUG] Getting relevant information from Elasticsearch');
    const relevantInfo = await elasticsearchRagService.getRelevantInformation(message);
    console.log('[SOCKET DEBUG] Elasticsearch RAG relevant info found:', !!relevantInfo);
    
    // Prepare context for AI response generation
    const messagesForAI = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // If we have relevant info from RAG, add it as context
    if (relevantInfo) {
      console.log('[SOCKET DEBUG] Adding RAG context to AI messages');
      messagesForAI.push({
        role: 'system',
        content: `Use the following information to answer the user query: ${relevantInfo}`
      });
    }
      // Check for product inquiry to suggest products
    // let productSuggestions = [];
    // if (intent && (intent.mainIntent === 'product_inquiry' || intent.mainIntent === 'pricing_inquiry' || 
    //     intent.name === 'ask_pricing' || intent.name === 'course_info')) {
    //   console.log('[SOCKET DEBUG] Getting product recommendations for product inquiry');
    //   productSuggestions = await aiService.getRecommendedProducts(message, chat.metadata.topics);
    //   console.log('[SOCKET DEBUG] Product recommendations count:', productSuggestions.length);
    // }
      // Ensure messagesForAI is an array before passing it to aiService
    if (!Array.isArray(messagesForAI)) {
      messagesForAI = [];
      console.error('[SOCKET DEBUG] Error: messagesForAI is not an array. Creating empty array instead.');
    }
    console.log('[SOCKET DEBUG] Messages for AI:', messagesForAI);

    // Lấy ngôn ngữ từ session nếu có, nếu không thì sử dụng req.locale hoặc mặc định là 'en'
    const userLocale = (req.session && req.session.locale) || req.locale || 'en';
    console.log(`[SOCKET DEBUG] Using locale for AI response: ${userLocale}`);

    // Thêm chỉ dẫn về ngôn ngữ cần sử dụng để trả lời
    const languageInstruction = {
      en: "Please respond in English.",
      vi: "Vui lòng trả lời bằng tiếng Việt."
    };

    // Thêm tin nhắn hệ thống chỉ định ngôn ngữ phản hồi
    messagesForAI.push({
      role: 'system',
      content: `${languageInstruction[userLocale] || languageInstruction.en} The user's preferred language is ${userLocale}.`
    });

    // Generate AI response using Gemini with user's locale
    console.log('[SOCKET DEBUG] Generating AI response from messages using Gemini');
    const aiResponse = await aiService.generateResponse(messagesForAI, { locale: userLocale });
    console.log('[SOCKET DEBUG] AI response generated successfully with Gemini');
    
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
      })),
      req.locale
    );
    console.log('[SOCKET DEBUG] Should transfer to human:', shouldSuggestHumanTransfer);
    
    // Update the chat session
    chat.updatedAt = Date.now();
    await chat.save();
    console.log('[SOCKET DEBUG] Chat session updated and saved');
    
    // Get the io instance from the app
    const io = req.app.get('io');
    
    // Emit event to the specific client's room
    if (io) {
      console.log(`[SOCKET DEBUG] Emitting receive_message to room: ${sessionId}`);
      io.to(sessionId).emit('receive_message', {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
    } else {
      console.log('[SOCKET DEBUG] io instance not available in controller for emitting response');
    }
      // Track analytics for the user message
    analyticsService.trackEvent('chat_message_received', {
      sessionId,
      intent: chat.metadata.intent,
      topics: chat.metadata.topics,
      isAuthenticated: req.user ? true : false
    });
    
    // Always notify the agent dashboard about new messages, regardless of transfer status
    // This ensures agents can see all messages in real-time
    
    // if (io) {
    //   console.log(`[SOCKET DEBUG] Always emitting new_user_message to agent-dashboard for visibility: ${sessionId}`);
    //   io.to('agent-dashboard').emit('new_user_message', {
    //     sessionId,
    //     chatId: chat._id,
    //     message: {
    //       role: 'user',
    //       content: message,
    //       timestamp: new Date()
    //     },
    //     userInfo: chat.userInfo
    //   });
    // }
    
    const response = {
      success: true,
      message: aiResponse
    };
    
    // Add product suggestions if available
    if (productSuggestions && productSuggestions.length > 0) {
      console.log('[SOCKET DEBUG] Adding product suggestions to response');
      response.suggestions = {
        products: productSuggestions
      };
    }
    
    // Suggest human transfer if needed
    if (shouldSuggestHumanTransfer.shouldTransfer) {
      console.log('[SOCKET DEBUG] Adding human transfer suggestion to response');
      response.suggestHumanTransfer = true;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('[SOCKET DEBUG] Error processing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your message',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Update user information in a chat session
 * @route PUT /api/chat/:sessionId/user-info
 * @access Public
 */
exports.updateUserInfo = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, email, phone } = req.body;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if we're collecting contact info for the first time
    const isNewContactInfo = !chat.userInfo.phone && phone;
    
    // Update user info
    chat.userInfo = {
      name: name || chat.userInfo.name,
      email: email || chat.userInfo.email,
      phone: phone || chat.userInfo.phone
    };
    
    await chat.save();
    
    // Track lead capture event for analytics if this is new contact info
    if (isNewContactInfo) {
      analyticsService.trackEvent('lead_captured', {
        sessionId,
        source: chat.metadata.source,
        phone: phone
      });
    }
    
    res.json({
      success: true,
      message: 'User information updated'
    });
    
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update user information',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Transfer chat to a human agent
 * @route POST /api/chat/:sessionId/transfer
 * @access Public
 */
exports.transferToAgent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Mark the chat as transferred to agent
    chat.isTransferredToAgent = true;
    chat.isAgentResolved = false;
    chat.agentTransferReason = reason || 'User requested';
    
    // Add a system message indicating transfer
    chat.messages.push({
      role: 'system',
      content: `Chat transferred to human agent. Reason: ${chat.agentTransferReason}`
    });
    
    // Add an assistant message to inform the user
    chat.messages.push({
      role: 'assistant',
      content: 'Yêu cầu của bạn đang được chuyển cho nhân viên tư vấn. Vui lòng đợi trong giây lát, nhân viên của chúng tôi sẽ phản hồi sớm nhất có thể.'
    });
    
    await chat.save();
    
    // Get the io instance from the app
    const io = req.app.get('io');
    
    // Emit event to client
    if (io) {
      io.to(sessionId).emit('receive_message', {
        role: 'assistant',
        content: 'Yêu cầu của bạn đang được chuyển cho nhân viên tư vấn. Vui lòng đợi trong giây lát, nhân viên của chúng tôi sẽ phản hồi sớm nhất có thể.',
        timestamp: new Date()
      });
      
      // Notify all agents about new transferred chat
      io.to('agent-dashboard').emit('chat_transferred', {
        sessionId,
        reason: chat.agentTransferReason,
        userInfo: chat.userInfo,
        timestamp: new Date()
      });
    }
    
    // Track the transfer event
    analyticsService.trackEvent('chat_transferred_to_agent', {
      sessionId,
      reason: chat.agentTransferReason
    });
    
    res.json({
      success: true,
      message: 'Chat transferred to human agent'
    });
    
  } catch (error) {
    console.error('Error transferring chat:', error);
    res.status(500).json({
      success: false,
      message: 'Could not transfer chat to agent',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Agent sends message to user
 * @route POST /api/chat/:sessionId/agent-message
 * @access Private
 */
exports.sendAgentMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, agentId, agentName } = req.body;
    
    if (!message || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'Message and agent ID are required'
      });
    }
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Add agent message to chat
    chat.messages.push({
      role: 'agent',
      content: message,
      agentId,
      agentName: agentName || 'Nhân viên tư vấn'
    });
    
    chat.lastAgentResponse = Date.now();
    await chat.save();
    
    // Get the io instance from the app
    const io = req.app.get('io');
    
    // Emit event to the specific client's room
    if (io) {
      io.to(sessionId).emit('receive_message', {
        role: 'agent',
        content: message,
        agentName: agentName || 'Nhân viên tư vấn',
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Agent message sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending agent message:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send agent message',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Resolve agent chat session and return to AI
 * @route POST /api/chat/:sessionId/resolve
 * @access Private
 */
exports.resolveAgentChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { resolution, agentId } = req.body;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Mark chat as resolved by agent
    chat.isAgentResolved = true;
    chat.resolution = resolution || 'Resolved by agent';
    
    // Add system message for the resolution
    chat.messages.push({
      role: 'system',
      content: `Chat resolved by agent ${agentId}. Resolution: ${chat.resolution}`
    });
    
    // Add message to inform user they're back with AI
    const informMessage = 'Cảm ơn bạn đã trao đổi với nhân viên tư vấn của chúng tôi. Bây giờ bạn đang trò chuyện lại với trợ lý AI. Tôi có thể giúp gì thêm cho bạn?';
    
    chat.messages.push({
      role: 'assistant',
      content: informMessage
    });
    
    await chat.save();
    
    // Get the io instance from the app
    const io = req.app.get('io');
    
    // Emit event to client and agent dashboard
    if (io) {
      io.to(sessionId).emit('receive_message', {
        role: 'assistant',
        content: informMessage,
        timestamp: new Date()
      });
      
      io.to(sessionId).emit('chat_resolved', {
        agentId,
        resolution: chat.resolution,
        timestamp: new Date()
      });
      
      // Update agent dashboard
      io.to('agent-dashboard').emit('chat_resolved', {
        sessionId,
        agentId,
        resolution: chat.resolution,
        timestamp: new Date()
      });
    }
    
    // Track resolution for analytics
    analyticsService.trackEvent('chat_agent_resolved', {
      sessionId,
      agentId,
      resolution: chat.resolution
    });
    
    res.json({
      success: true,
      message: 'Chat resolved successfully'
    });
    
  } catch (error) {
    console.error('Error resolving chat:', error);
    res.status(500).json({
      success: false,
      message: 'Could not resolve chat',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get chat history
 * @route GET /api/chat/:sessionId/history
 * @access Public
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
      res.json({
      success: true,
      chat: {
        sessionId: chat.sessionId,
        userInfo: chat.userInfo,
        messages: chat.messages,
        isTransferredToAgent: chat.isTransferredToAgent,
        isAgentResolved: chat.isAgentResolved,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        metadata: chat.metadata
      }
    });
    
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve chat history',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Update the knowledge base with a new text file
 * @route POST /api/chat/knowledge
 * @access Private
 */
exports.updateKnowledgeBase = async (req, res) => {
  try {
    if (!req.files || !req.files.knowledgeFile) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const file = req.files.knowledgeFile;
    
    // Check if it's a text file
    if (file.mimetype !== 'text/plain') {
      return res.status(400).json({
        success: false,
        message: 'Only plain text (.txt) files are supported'
      });
    }
    
    // Process the file content
    const fileContent = file.data.toString('utf8');
    
    // Update RAG knowledge base with new content
    const updateResult = await ragService.updateKnowledgeBase(fileContent);
    
    res.json({
      success: true,
      message: 'Knowledge base updated successfully',
      stats: updateResult
    });
    
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update knowledge base',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get list of all active chats for admin
 * @route GET /api/chat/admin/active
 * @access Private
 */
exports.getActiveChatsList = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get filter parameters
    const { transferredOnly, hasContactInfo, dateFrom, dateTo } = req.query;
    
    // Build query
    const query = {};
    
    if (transferredOnly === 'true') {
      query.isTransferredToAgent = true;
      query.isAgentResolved = { $ne: true };
    }
    
    if (hasContactInfo === 'true') {
      query['userInfo.phone'] = { $exists: true, $ne: '' };
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }
    
    // Get total count
    const totalCount = await Chat.countDocuments(query);
    
    // Get chats
    const chats = await Chat.find(query)
      .select('sessionId userInfo metadata isTransferredToAgent isAgentResolved createdAt updatedAt lastAgentResponse')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      success: true,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      chats
    });
    
  } catch (error) {
    console.error('Error getting active chats:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve active chats',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Search chat history by keyword
 * @route GET /api/chat/admin/search
 * @access Private
 */
exports.searchChatHistory = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }
    
    // Search in messages content and user info
    const chats = await Chat.find({
      $or: [
        { 'messages.content': { $regex: keyword, $options: 'i' } },
        { 'userInfo.name': { $regex: keyword, $options: 'i' } },
        { 'userInfo.email': { $regex: keyword, $options: 'i' } },
        { 'userInfo.phone': { $regex: keyword, $options: 'i' } }
      ]
    }).select('sessionId userInfo metadata messages createdAt updatedAt');
    
    res.json({
      success: true,
      count: chats.length,
      chats
    });
    
  } catch (error) {
    console.error('Error searching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Could not search chat history',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get analytics for chats
 * @route GET /api/chat/admin/analytics
 * @access Private
 */
exports.getChatAnalytics = async (req, res) => {
  try {
    const { timeFrame } = req.query;
    const period = timeFrame || '30days';
    
    // Get date range based on period
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '7days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get analytics from analytics service
    const analyticsData = await analyticsService.getChatAnalytics(startDate, endDate);
    
    res.json({
      success: true,
      period,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Error getting chat analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve chat analytics',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get chat history for authenticated user
 * @route GET /api/chat/user/history
 * @access Private
 */
exports.getUserChats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Paginate results
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get count of all user chats
    const totalCount = await Chat.countDocuments({ userId: req.user.id });
    
    // Get user chats ordered by last activity
    const chats = await Chat.find({ userId: req.user.id })
      .select('sessionId userInfo messages metadata createdAt updatedAt isTransferredToAgent isAgentResolved')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format the response
    const formattedChats = chats.map(chat => ({
      sessionId: chat.sessionId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      lastMessage: chat.messages.length > 0 ? 
        chat.messages[chat.messages.length - 1].content : 
        '',
      lastMessageTimestamp: chat.messages.length > 0 ? 
        chat.messages[chat.messages.length - 1].timestamp : 
        chat.createdAt,
      isTransferredToAgent: chat.isTransferredToAgent,
      isAgentResolved: chat.isAgentResolved,
      intent: chat.metadata.intent,
      topics: chat.metadata.topics,
      messageCount: chat.messages.length,
      source: chat.metadata.source
    }));
    
    res.json({
      success: true,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      chats: formattedChats
    });
    
  } catch (error) {
    console.error('Error retrieving user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve chat history',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Link an anonymous chat session to a user account after login
 * @route POST /api/chat/link-session
 * @access Private
 */
exports.linkChatSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    // Find the chat session
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Check if this chat is already linked to a different user
    if (chat.userId && chat.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This chat session belongs to another user'
      });
    }
    
    // Link the chat to the user
    chat.userId = req.user.id;
    
    // Update user info if needed
    const user = await User.findById(req.user.id).select('name email phone');
    if (user) {
      // Only update fields that are empty in the chat but present in the user profile
      chat.userInfo = {
        name: chat.userInfo.name || user.name || '',
        email: chat.userInfo.email || user.email || '',
        phone: chat.userInfo.phone || user.phone || ''
      };
    }
      await chat.save();
    
    res.json({
      success: true,
      message: 'Chat session linked to your account successfully'
    });
    
  } catch (error) {
    console.error('Error linking chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Could not link chat session to your account',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};