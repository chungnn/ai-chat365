import tagApiClient, { TAG_ENDPOINTS, configureTagApi } from '@/config/tagApi';

// Helper function to ensure API client is configured before every request
const ensureConfigured = (rootState) => {
  if (rootState.auth && rootState.auth.token) {
    configureTagApi(rootState.auth.token);
  }
};

const state = {
  tags: [],
  loading: false,
  error: null
};

const getters = {
  allTags: (state) => state.tags,
  tagsLoading: (state) => state.loading
};

const actions = {
  // Fetch all tags
  async fetchTags({ commit, rootState }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      ensureConfigured(rootState);
      
      const response = await tagApiClient.get(TAG_ENDPOINTS.GET_TAGS);
      
      if (response.data && Array.isArray(response.data.tags)) {
        commit('SET_TAGS', response.data.tags);
        return response.data.tags;
      } else if (Array.isArray(response.data)) {
        commit('SET_TAGS', response.data);
        return response.data;
      } else {
        console.error('Unexpected response format from tags API:', response.data);
        commit('SET_ERROR', 'Invalid response format from server');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      commit('SET_ERROR', 'Failed to load tags');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new tag
  async createTag({ commit, rootState }, { name, color }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      ensureConfigured(rootState);
      
      const response = await tagApiClient.post(TAG_ENDPOINTS.CREATE_TAG, { name, color });
      
      if (response.data && response.data.tag) {
        commit('ADD_TAG', response.data.tag);
        return response.data.tag;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      commit('SET_ERROR', 'Failed to create tag');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update an existing tag
  async updateTag({ commit, rootState }, { id, name, color }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      ensureConfigured(rootState);
      
      const response = await tagApiClient.put(TAG_ENDPOINTS.UPDATE_TAG(id), { name, color });
      
      if (response.data && response.data.tag) {
        commit('UPDATE_TAG', response.data.tag);
        return response.data.tag;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to update tag:', error);
      commit('SET_ERROR', 'Failed to update tag');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete a tag
  async deleteTag({ commit, rootState }, id) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      ensureConfigured(rootState);
      
      await tagApiClient.delete(TAG_ENDPOINTS.DELETE_TAG(id));
      
      commit('REMOVE_TAG', id);
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      commit('SET_ERROR', 'Failed to delete tag');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const mutations = {
  SET_TAGS(state, tags) {
    state.tags = tags;
  },
  ADD_TAG(state, tag) {
    state.tags.push(tag);
  },
  UPDATE_TAG(state, updatedTag) {
    const index = state.tags.findIndex(tag => tag._id === updatedTag._id);
    if (index !== -1) {
      state.tags.splice(index, 1, updatedTag);
    }
  },
  REMOVE_TAG(state, id) {
    state.tags = state.tags.filter(tag => tag._id !== id);
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
