const i18nService = require('../services/i18nService');

/**
 * Middleware để xử lý ngôn ngữ trong các request
 */
const languageMiddleware = (req, res, next) => {
  // Lấy ngôn ngữ từ header, hoặc cookie, hoặc query parameter
  const locale = req.headers['accept-language'] || 
                req.cookies?.language || 
                req.query?.lang || 
                'en';
  
  // Lấy phiên bản ngắn của mã ngôn ngữ (ví dụ: 'en-US' -> 'en')
  const shortLocale = locale.split('-')[0];
  
  // Nếu ngôn ngữ được hỗ trợ, thiết lập cho request
  if (i18nService.isLocaleSupported(shortLocale)) {
    req.locale = shortLocale;
  } else {
    req.locale = 'en'; // Mặc định là tiếng Anh
  }
  
  // Thêm hàm trợ giúp vào đối tượng phản hồi
  res.__ = (key) => i18nService.translate(key, req.locale);
  
  next();
};

module.exports = languageMiddleware;
