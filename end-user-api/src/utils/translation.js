/**
 * Translation utility for controllers
 * Provides a simple interface for controllers to access translations
 */

const { translate } = require('../config/i18n');

/**
 * Get a translation based on the request's locale
 * @param {Object} req - Express request object
 * @param {string} key - Translation key (e.g., 'chat.sessionCreated')
 * @param {Object} params - Parameters to interpolate in the translation
 * @returns {string} - Translated string
 */
const t = (req, key, params = {}) => {
  return translate(key, req.locale, params);
};

/**
 * Create a response object with translated messages
 * @param {Object} req - Express request object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} messageKey - Translation key for the message
 * @param {Object} data - Additional data to include in the response
 * @param {Object} params - Parameters to interpolate in the translation
 * @returns {Object} - Response object with translated message
 */
const createResponse = (req, success, messageKey, data = {}, params = {}) => {
  return {
    success,
    message: t(req, messageKey, params),
    ...data
  };
};

module.exports = {
  t,
  createResponse
};
