const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all knowledge items
router.get('/', knowledgeController.getAllKnowledge);

// Get a single knowledge item
router.get('/:id', knowledgeController.getKnowledgeById);

// Create a new knowledge item
router.post('/', knowledgeController.createKnowledge);

// Update a knowledge item
router.put('/:id', knowledgeController.updateKnowledge);

// Delete a knowledge item
router.delete('/:id', knowledgeController.deleteKnowledge);

// Search knowledge items
router.get('/search', knowledgeController.searchKnowledge);

module.exports = router;
