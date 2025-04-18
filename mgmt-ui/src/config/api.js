/**
 * Centralized API configuration
 * All API endpoints and configurations should be defined here
 */

// We'll get the store dynamically to avoid circular dependencies
// And avoid problems with checking authentication state
let storeInstance = null;

// This will be called from store/index.js after store is created
export const setStore = (store) => {
  storeInstance = store;
};

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
  
  // Clear any existing interceptors to avoid duplicates
  if (axios.interceptors.response.handlers && axios.interceptors.response.handlers.length > 0) {
    axios.interceptors.response.eject(axios.interceptors.response.handlers[0].id);
  }
  
  // Setup response interceptor to handle authentication errors
  axios.interceptors.response.use(
    (response) => response, // Return successful responses as-is
    (error) => {
      // If unauthorized (401) or forbidden (403), force re-login
      console.log('API error:', error.response ? error.response.status : 'No response', error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('API authentication error:', error.response.status, error.response.data);
        
        // Đảm bảo chúng ta có storeInstance
        if (storeInstance) {
          const isAuthenticated = storeInstance.getters['auth/isAuthenticated'];
          console.log('User authenticated status:', isAuthenticated);
          
          if (isAuthenticated) {
            console.log('Forcing re-login due to 401/403 error');
            storeInstance.dispatch('auth/forceRelogin');
            return Promise.reject(new Error('Session expired. Please log in again.'));
          }
        } else {
          console.warn('Store instance not available, cannot force re-login');
          // Fallback to redirect if store isn't available
          window.location.href = '/login';
        }
      }
      return Promise.reject(error); // Propagate the error for further handling
    }
  );
  
  // You can add other axios configurations here
};
