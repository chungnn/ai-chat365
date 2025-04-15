/**
 * Language detection middleware
 * 
 * This middleware detects the user's preferred language from:
 * 1. Query parameter 'lang'
 * 2. Accept-Language header
 * 3. User's saved preference (if authenticated)
 * 4. Default to English
 */

const { LOCALES, DEFAULT_LOCALE } = require('../config/i18n');
const User = require('../models/User');

/**
 * Detect and set the user's preferred language
 */
const languageMiddleware = async (req, res, next) => {
  try {
    // Priority 0: Check session first (highest priority)
    let locale = req.session?.locale;
    
    // Priority 1: Check query parameter if no session
    if (!locale) {
      locale = req.query.lang;
    }
    
    // Priority 2: Check Accept-Language header
    if (!locale && req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      // Parse the Accept-Language header (e.g. 'en-US,en;q=0.9,vi;q=0.8')
      const languages = acceptLanguage.split(',').map(lang => {
        const [code, weight] = lang.trim().split(';q=');
        return { 
          code: code.split('-')[0], // Extract primary language code
          weight: weight ? parseFloat(weight) : 1.0 
        };
      }).sort((a, b) => b.weight - a.weight); // Sort by weight, highest first
      
      // Find the first supported language
      const preferred = languages.find(lang => LOCALES.includes(lang.code));
      if (preferred) {
        locale = preferred.code;
      }
    }
    
    // Priority 3: Check user's saved preference (if authenticated)
    if (!locale && req.user && req.user.id) {
      try {
        const user = await User.findById(req.user.id).select('language');
        if (user && user.language && LOCALES.includes(user.language)) {
          locale = user.language;
        }
      } catch (err) {
        console.error('Error fetching user language preference:', err);
        // Continue with other methods if user fetch fails
      }
    }
    
    // Ensure the locale is supported, otherwise use default
    if (!locale || !LOCALES.includes(locale)) {
      locale = DEFAULT_LOCALE;
    }
    
    // Set the locale on the request object
    req.locale = locale;
    
    next();
  } catch (error) {
    console.error('Error in language middleware:', error);
    req.locale = DEFAULT_LOCALE;
    next();
  }
};

module.exports = languageMiddleware;
