import axios from 'axios';

// Base API URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// URL Metadata endpoints
const URL_METADATA_ENDPOINTS = {
  GET_METADATA: `${API_URL}/api/url-metadata`,
};

const state = {
  metadata: {},
  loading: false,
  error: null
};

const getters = {
  getMetadataByUrl: (state) => (url) => {
    return state.metadata[url] || null;
  },
  isLoading: (state) => state.loading
};

const actions = {
  async fetchUrlMetadata({ commit, state }, url) {
    // Return cached metadata if available
    if (state.metadata[url]) {
      return state.metadata[url];
    }
    
    commit('SET_LOADING', true);
    
    try {
      const response = await axios.get(URL_METADATA_ENDPOINTS.GET_METADATA, {
        params: { url }
      });
      
      commit('SET_URL_METADATA', { url, data: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      
      // Create fallback metadata
      const fallbackData = {
        title: extractTitleFromUrl(url),
        description: '',
        image: ''
      };
      
      commit('SET_ERROR', error.message || 'Failed to fetch URL metadata');
      commit('SET_URL_METADATA', { url, data: fallbackData });
      return fallbackData;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const mutations = {
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_URL_METADATA(state, { url, data }) {
    state.metadata = { ...state.metadata, [url]: data };
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

// Helper function to extract a title from URL when metadata fetch fails
function extractTitleFromUrl(url) {
  try {
    // Try to extract a title-like part from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      // Use the last path segment as a potential title
      const lastSegment = pathParts[pathParts.length - 1];
      // Replace hyphens and underscores with spaces and capitalize
      return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.[^/.]+$/, '') // Remove file extension if present
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
