const express = require('express');
const i18nService = require('../services/i18nService');
const router = express.Router();

/**
 * @route GET /api/languages
 * @desc Lấy danh sách các ngôn ngữ được hỗ trợ
 * @access Public
 */
router.get('/', (req, res) => {
  return res.json({
    success: true,
    data: {
      supported: ['en', 'vi'],
      current: req.locale || 'en'
    }
  });
});

/**
 * @route POST /api/languages/set
 * @desc Cập nhật ngôn ngữ hiện tại cho phiên làm việc
 * @access Public
 */
router.post('/set', (req, res) => {
  const { locale } = req.body;
  
  if (!locale || !i18nService.isLocaleSupported(locale)) {
    return res.status(400).json({
      success: false,
      message: res.__('errors.badRequest')
    });
  }

  
  // Nếu người dùng đã đăng nhập, có thể lưu lựa chọn vào DB
  if (req.user && req.user.id) {
    // Giả sử có model Admin với field language
    // Admin.findByIdAndUpdate(req.user.id, { language: locale }).catch(err => console.error('Error updating user language:', err));
  }
  
  return res.json({
    success: true,
    data: {
      locale,
      message: res.__('common.languageUpdated')
    }
  });
});

/**
 * @route GET /api/languages/:locale
 * @desc Lấy các bản dịch cho một ngôn ngữ cụ thể
 * @access Public
 */
router.get('/:locale', (req, res) => {
  const { locale } = req.params;
  
  if (!i18nService.isLocaleSupported(locale)) {
    return res.status(400).json({
      success: false,
      message: res.__('errors.badRequest')
    });
  }
  
  const translations = i18nService.getTranslations(locale);
  
  return res.json({
    success: true,
    data: {
      locale,
      translations
    }
  });
});

module.exports = router;
