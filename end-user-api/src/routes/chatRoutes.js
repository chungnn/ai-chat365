const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth'); // Middleware for authentication
const adminAuth = require('../middleware/adminAuth'); // Middleware for admin authentication

/*
 * Public routes - no authentication required
 */
// Create a new chat session
router.post('/session', chatController.initSession);

// Send a message and get AI response
router.post('/message', chatController.sendMessage);

// Get chat history
router.get('/:sessionId/history', chatController.getChatHistory);

// Update user info in chat session
router.put('/:sessionId/user-info', chatController.updateUserInfo);

// Transfer chat to a human agent
router.post('/:sessionId/transfer', chatController.transferToAgent);

/*
 * Protected routes - authentication required
 */
// Get all chats for the logged-in user
router.get('/user/history', auth, chatController.getUserChats);

// Link an anonymous chat session to a user account after login
router.post('/link-session', auth, chatController.linkChatSession);

// Agent sends message to user
router.post('/:sessionId/agent-message', auth, chatController.sendAgentMessage);

// Resolve agent chat and return to AI
router.post('/:sessionId/resolve', auth, chatController.resolveAgentChat);

/*
 * Admin routes - admin authentication required
 */
// Update knowledge base with a new text file
router.post('/knowledge', adminAuth, chatController.updateKnowledgeBase);

// Get list of all active chats for admin
router.get('/admin/active', adminAuth, chatController.getActiveChatsList);

// Search chat history
router.get('/admin/search', adminAuth, chatController.searchChatHistory);

// Get analytics for chats
router.get('/admin/analytics', adminAuth, chatController.getChatAnalytics);

// Export the router
module.exports = router;