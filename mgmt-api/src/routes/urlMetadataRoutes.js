const express = require('express');
const urlMetadataController = require('../controllers/urlMetadataController');

const router = express.Router();

// Get metadata from a URL
router.get('/', urlMetadataController.getUrlMetadata);

module.exports = router;
