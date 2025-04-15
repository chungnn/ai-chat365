const express = require('express');
const urlMetadataController = require('../controllers/urlMetadataController');
const router = express.Router();

/**
 * @route GET /api/url-metadata
 * @desc Fetch metadata for a URL
 * @access Public
 */
router.get('/', urlMetadataController.fetchUrlMetadata);

module.exports = router;
