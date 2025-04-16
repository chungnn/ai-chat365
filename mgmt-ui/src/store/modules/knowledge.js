// filepath: d:\ANH CHUNG\Projects\ai-chat365\mgmt-ui\src\store\modules\knowledge.js
import axios from 'axios';

// Base API URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// Knowledge endpoints
const KNOWLEDGE_ENDPOINTS = {
  GET_KNOWLEDGE: `${API_URL}/api/knowledge`,
  SEARCH_KNOWLEDGE: (query) => `${API_URL}/api/knowledge/search?query=${encodeURIComponent(query)}`,
  CREATE_KNOWLEDGE: `${API_URL}/api/knowledge`,
  UPDATE_KNOWLEDGE: (id) => `${API_URL}/api/knowledge/${id}`,
  DELETE_KNOWLEDGE: (id) => `${API_URL}/api/knowledge/${id}`
};

const state = {
  knowledgeItems: [],
  loading: false,
  error: null,
  currentItem: null
};

const getters = {
  allKnowledgeItems: state => state.knowledgeItems,
  isLoading: state => state.loading,
  hasError: state => state.error,
  currentItem: state => state.currentItem
};

const actions = {
  // Fetch all knowledge items
  async fetchKnowledge({ commit }) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const response = await axios.get(KNOWLEDGE_ENDPOINTS.GET_KNOWLEDGE);
      
      if (response.data && Array.isArray(response.data.knowledgeItems)) {
        commit('SET_KNOWLEDGE_ITEMS', response.data.knowledgeItems);
        return response.data.knowledgeItems;
      } else if (Array.isArray(response.data)) {
        commit('SET_KNOWLEDGE_ITEMS', response.data);
        return response.data;
      } else {
        console.error('Unexpected response format from knowledge API:', response.data);
        commit('SET_ERROR', 'Định dạng phản hồi không hợp lệ từ máy chủ');
        return [];
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      commit('SET_ERROR', 'Không thể tải dữ liệu tri thức. Vui lòng thử lại sau.');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Search knowledge items
  async searchKnowledge({ commit, dispatch }, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return dispatch('fetchKnowledge');
    }
    
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const response = await axios.get(KNOWLEDGE_ENDPOINTS.SEARCH_KNOWLEDGE(searchTerm));
      
      if (response.data && Array.isArray(response.data.knowledgeItems)) {
        commit('SET_KNOWLEDGE_ITEMS', response.data.knowledgeItems);
        return response.data.knowledgeItems;
      } else if (Array.isArray(response.data)) {
        commit('SET_KNOWLEDGE_ITEMS', response.data);
        return response.data;
      } else {
        console.error('Unexpected response format from knowledge search API:', response.data);
        commit('SET_ERROR', 'Định dạng phản hồi không hợp lệ từ máy chủ');
        return [];
      }
    } catch (error) {
      console.error('Error searching knowledge:', error);
      commit('SET_ERROR', 'Không thể tìm kiếm tri thức. Vui lòng thử lại sau.');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create new knowledge item
  async createKnowledge({ commit, dispatch }, knowledge) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.post(KNOWLEDGE_ENDPOINTS.CREATE_KNOWLEDGE, knowledge);
        if (response.data && response.data.knowledge) {
        commit('ADD_KNOWLEDGE_ITEM', response.data.knowledge);
        dispatch('notification/showNotification', {
          type: 'success',
          message: 'Thêm tri thức mới thành công!'
        }, { root: true });
        return response.data.knowledge;
      } else {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }
    } catch (error) {      console.error('Error creating knowledge:', error);
      dispatch('notification/showNotification', {
        type: 'error',
        message: 'Đã xảy ra lỗi khi lưu tri thức. Vui lòng thử lại.'
      }, { root: true });
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update existing knowledge item
  async updateKnowledge({ commit, dispatch }, knowledge) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.put(KNOWLEDGE_ENDPOINTS.UPDATE_KNOWLEDGE(knowledge.id), knowledge);
        if (response.data && response.data.knowledge) {
        commit('UPDATE_KNOWLEDGE_ITEM', response.data.knowledge);
        dispatch('notification/showNotification', {
          type: 'success',
          message: 'Cập nhật tri thức thành công!'
        }, { root: true });
        return response.data.knowledge;
      } else {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }
    } catch (error) {      console.error('Error updating knowledge:', error);
      dispatch('notification/showNotification', {
        type: 'error',
        message: 'Đã xảy ra lỗi khi cập nhật tri thức. Vui lòng thử lại.'
      }, { root: true });
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete knowledge item
  async deleteKnowledge({ commit, dispatch }, id) {
    try {
      commit('SET_LOADING', true);
      
      await axios.delete(KNOWLEDGE_ENDPOINTS.DELETE_KNOWLEDGE(id));
        commit('REMOVE_KNOWLEDGE_ITEM', id);
      dispatch('notification/showNotification', {
        type: 'success',
        message: 'Xóa tri thức thành công!'
      }, { root: true });
      return true;
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      dispatch('notification/show', {
        type: 'error',
        message: 'Đã xảy ra lỗi khi xóa tri thức. Vui lòng thử lại.'
      }, { root: true });
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Set current item for editing
  setCurrentItem({ commit }, item) {
    commit('SET_CURRENT_ITEM', item);
  },
  
  // Clear current item
  clearCurrentItem({ commit }) {
    commit('SET_CURRENT_ITEM', null);
  }
};

const mutations = {
  SET_KNOWLEDGE_ITEMS(state, items) {
    state.knowledgeItems = items;
  },
  ADD_KNOWLEDGE_ITEM(state, item) {
    state.knowledgeItems.push(item);
  },
  UPDATE_KNOWLEDGE_ITEM(state, updatedItem) {
    const index = state.knowledgeItems.findIndex(item => item._id === updatedItem._id || item.id === updatedItem.id);
    if (index !== -1) {
      state.knowledgeItems.splice(index, 1, updatedItem);
    }
  },
  REMOVE_KNOWLEDGE_ITEM(state, id) {
    state.knowledgeItems = state.knowledgeItems.filter(item => item._id !== id && item.id !== id);
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_CURRENT_ITEM(state, item) {
    state.currentItem = item;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
