const express = require('express');
const router = express.Router();
const { translate } = require('../config/i18n');
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * Get all available languages
 * @route GET /api/language/list
 * @access Public
 */
router.get('/list', (req, res) => {
  try {
    // Return available languages
    res.json({
      success: true,
      languages: [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Tiếng Việt' }
      ]
    });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      success: false,
      message: translate('common.error', req.locale),
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

/**
 * Set user's language preference
 * @route POST /api/language/preference
 * @access Public
 */
router.post('/preference', (req, res) => {  try {
    const { language } = req.body;
    
    // Validate language
    if (!language || !['en', 'vi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: translate('common.invalidLanguage', req.locale)
      });
    }
    
    // Set language in session
    req.locale = language;
    
    // Lưu ngôn ngữ vào session nếu có
    if (req.session) {
      req.session.locale = language;
    }
    
    res.json({
      success: true,
      message: translate('common.languageUpdated', language)
    });
  } catch (error) {
    console.error('Error setting language preference:', error);
    res.status(500).json({
      success: false,
      message: translate('common.error', req.locale),
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

/**
 * Save language preference for authenticated user
 * @route POST /api/language/save
 * @access Private
 */
router.post('/save', auth, async (req, res) => {
  try {
    const { language } = req.body;
    
    // Validate language
    if (!language || !['en', 'vi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: translate('common.invalidLanguage', req.locale)
      });
    }
    
    // Save to user profile
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.language = language;
        await user.save();
      }
    }
      // Set language in session
    req.locale = language;
    
    // Lưu ngôn ngữ vào session nếu có
    if (req.session) {
      req.session.locale = language;
    }
    
    res.json({
      success: true,
      message: translate('common.languageUpdated', language)
    });
  } catch (error) {
    console.error('Error saving language preference:', error);
    res.status(500).json({
      success: false,
      message: translate('common.error', req.locale),
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
});

module.exports = router;
