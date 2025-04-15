/**
 * Centralized API configuration
 * All API endpoints and configurations should be defined here
 */

// Add other feature endpoints as needed
// export const FEATURE_ENDPOINTS = {...};

/**
 * Configure axios defaults
 * @param {Object} axios - The axios instance
 * @param {String} token - The auth token
 */
export const configureAxios = (axios, token = null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  
  // You can add other axios configurations here
};
