/**
 * i18n configuration for the end-user-api
 */

const path = require('path');
const fs = require('fs');

// Available locales
const LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';

// Load all translation files
const translations = {};
LOCALES.forEach(locale => {
  const filePath = path.join(__dirname, '..', 'locales', `${locale}.js`);
  if (fs.existsSync(filePath)) {
    translations[locale] = require(filePath);
  } else {
    console.warn(`Translation file for locale ${locale} not found at ${filePath}`);
  }
});

/**
 * Get translation for a key in the specified locale
 * @param {string} key - The translation key in dot notation (e.g., 'chat.sessionCreated')
 * @param {string} locale - The locale to use
 * @param {Object} params - Parameters to interpolate in the translation string
 * @returns {string} - The translated string
 */
const translate = (key, locale = DEFAULT_LOCALE, params = {}) => {
  // Default to English if requested locale is not available
  if (!LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  // Get the translation object for the locale
  const localeTranslations = translations[locale] || translations[DEFAULT_LOCALE];
  
  // Split the key into parts (e.g., 'chat.sessionCreated' -> ['chat', 'sessionCreated'])
  const keyParts = key.split('.');
  
  // Navigate through the translation object to find the requested key
  let result = localeTranslations;
  for (const part of keyParts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      // Key not found, fallback to default locale or return the key itself
      result = getFromDefaultLocale(key) || key;
      break;
    }
  }
  
  // If the result is not a string, return the key
  if (typeof result !== 'string') {
    return key;
  }
  
  // Replace parameters in the string (format: {paramName})
  return result.replace(/{(\w+)}/g, (match, paramName) => {
    return params[paramName] !== undefined ? params[paramName] : match;
  });
};

/**
 * Try to get a translation from the default locale
 * @param {string} key - The translation key
 * @returns {string|null} - The translated string or null if not found
 */
const getFromDefaultLocale = (key) => {
  if (translations[DEFAULT_LOCALE]) {
    const keyParts = key.split('.');
    let result = translations[DEFAULT_LOCALE];
    
    for (const part of keyParts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return null;
      }
    }
    
    return typeof result === 'string' ? result : null;
  }
  
  return null;
};

module.exports = {
  translate,
  LOCALES,
  DEFAULT_LOCALE
};
