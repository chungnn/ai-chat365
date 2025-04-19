const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { buildQueryFromPoliciesMiddleware, checkIAMPermission, buildARN } = require('../middleware/iamAuthorization');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Apply policy-based query middleware for GET all chats
router.get('/', buildQueryFromPoliciesMiddleware('chat:List', 'chat'), chatController.getAllChats);

// Apply IAM authorization for specific operations
const chatResourceResolver = (req) => buildARN('chat', 'message', req.params.id || '*');

router.get('/:id', checkIAMPermission('chat:Get', chatResourceResolver), chatController.getChatById);
router.post('/:id/assign', checkIAMPermission('chat:Assign', chatResourceResolver), chatController.assignChat);
router.post('/:id/message', checkIAMPermission('chat:SendMessage', chatResourceResolver), chatController.sendMessage);
router.post('/:id/reply', checkIAMPermission('chat:Reply', chatResourceResolver), chatController.replyToChat);
router.post('/:id/close', checkIAMPermission('chat:Close', chatResourceResolver), chatController.closeChat);
router.put('/:id/status', checkIAMPermission('chat:UpdateStatus', chatResourceResolver), chatController.updateChatStatus);
router.put('/:id/tags', checkIAMPermission('chat:UpdateTags', chatResourceResolver), chatController.updateChatTags);
router.put('/:id/category', checkIAMPermission('chat:UpdateCategory', chatResourceResolver), chatController.updateChatCategory);
router.put('/:id/priority', checkIAMPermission('chat:UpdatePriority', chatResourceResolver), chatController.updateChatPriority);

module.exports = router;
