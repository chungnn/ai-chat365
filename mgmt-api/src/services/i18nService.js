const en = require('../locales/en');
const vi = require('../locales/vi');

const translations = {
  en,
  vi
};

const defaultLocale = 'en';

/**
 * Dịch vụ đa ngôn ngữ
 */
class I18nService {
  /**
   * Lấy bản dịch dựa trên khóa và ngôn ngữ
   * @param {string} key - Khóa để truy cập bản dịch (ví dụ: 'errors.notFound')
   * @param {string} locale - Mã ngôn ngữ (ví dụ: 'en', 'vi')
   * @returns {string} Bản dịch
   */
  translate(key, locale = defaultLocale) {
    const language = translations[locale] || translations[defaultLocale];
    
    // Hỗ trợ khóa lồng nhau (ví dụ: 'errors.notFound')
    const keys = key.split('.');
    let translation = language;
    
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        // Nếu không tìm thấy, trả về khóa gốc
        return key;
      }
    }
    
    return translation;
  }
  
  /**
   * Lấy tất cả các bản dịch cho một ngôn ngữ cụ thể
   * @param {string} locale - Mã ngôn ngữ (ví dụ: 'en', 'vi')
   * @returns {Object} - Đối tượng chứa tất cả bản dịch
   */
  getTranslations(locale = defaultLocale) {
    return translations[locale] || translations[defaultLocale];
  }
  
  /**
   * Kiểm tra xem ngôn ngữ có được hỗ trợ hay không
   * @param {string} locale - Mã ngôn ngữ cần kiểm tra
   * @returns {boolean} - true nếu ngôn ngữ được hỗ trợ
   */
  isLocaleSupported(locale) {
    return Object.keys(translations).includes(locale);
  }
}

module.exports = new I18nService();
