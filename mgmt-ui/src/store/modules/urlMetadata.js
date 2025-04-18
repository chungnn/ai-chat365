import urlMetaApiClient, { URL_META_ENDPOINTS, configureUrlMetaApi } from '@/config/urlMetaApi';

// Helper function to ensure API client is configured before every request
const ensureConfigured = (rootState) => {
  if (rootState.auth && rootState.auth.token) {
    configureUrlMetaApi(rootState.auth.token);
  }
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

const actions = {  async fetchUrlMetadata({ commit, state, rootState }, url) {
    // Return cached metadata if available
    if (state.metadata[url]) {
      return state.metadata[url];
    }
    
    commit('SET_LOADING', true);
    
    try {
      // Đảm bảo API client được cấu hình với token xác thực trước khi gọi API
      ensureConfigured(rootState);
      
      const response = await urlMetaApiClient.get(URL_META_ENDPOINTS.GET_METADATA, {
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
