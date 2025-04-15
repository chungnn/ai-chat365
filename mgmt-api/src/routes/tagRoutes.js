const express = require('express');
const tagController = require('../controllers/tagController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Get all tags
router.get('/', tagController.getTags);

// Get a specific tag by ID
router.get('/:id', tagController.getTagById);

// Create a new tag
router.post('/', tagController.createTag);

// Update a tag
router.put('/:id', tagController.updateTag);

// Delete a tag
router.delete('/:id', tagController.deleteTag);

module.exports = router;
