const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/', chatController.getAllChats);
router.get('/:id', chatController.getChatById);
router.post('/:id/assign', chatController.assignChat);
router.post('/:id/message', chatController.sendMessage);
router.post('/:id/reply', chatController.replyToChat);
router.post('/:id/close', chatController.closeChat);
router.put('/:id/status', chatController.updateChatStatus);
router.put('/:id/tags', chatController.updateChatTags);
router.put('/:id/category', chatController.updateChatCategory);
router.put('/:id/priority', chatController.updateChatPriority);

module.exports = router;
