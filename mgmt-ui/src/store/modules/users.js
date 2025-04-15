import axios from 'axios';

// Base API URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// User endpoints
const USER_ENDPOINTS = {
  GET_USERS: `${API_URL}/api/users`,
  GET_USER: (id) => `${API_URL}/api/users/${id}`,
  CREATE_USER: `${API_URL}/api/users`,
  UPDATE_USER: (id) => `${API_URL}/api/users/${id}`,
  DELETE_USER: (id) => `${API_URL}/api/users/${id}`,
  CHANGE_STATUS: (id) => `${API_URL}/api/users/${id}/status`,
  RESET_PASSWORD: (id) => `${API_URL}/api/users/${id}/reset-password`
};

const state = {
  users: [],
  loading: false,
  error: null,
  currentUser: null
};

const getters = {
  allUsers: (state) => state.users,
  usersLoading: (state) => state.loading,
  hasError: (state) => state.error !== null,
  errorMessage: (state) => state.error,
  currentUser: (state) => state.currentUser
};

const mutations = {
  SET_USERS(state, users) {
    state.users = users;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_CURRENT_USER(state, user) {
    state.currentUser = user;
  },
  ADD_USER(state, user) {
    state.users.push(user);
  },
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex(u => u._id === updatedUser._id);
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser);
    }
  },
  DELETE_USER(state, userId) {
    state.users = state.users.filter(u => u._id !== userId);
  }
};

const actions = {
  // Fetch all users
  async fetchUsers({ commit }) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.get(USER_ENDPOINTS.GET_USERS);
      
      if (response.data && Array.isArray(response.data.users)) {
        commit('SET_USERS', response.data.users);
        return response.data.users;
      } else if (Array.isArray(response.data)) {
        commit('SET_USERS', response.data);
        return response.data;
      } else {
        console.error('Unexpected response format from users API:', response.data);
        commit('SET_ERROR', 'Invalid response format from server');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to load users');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch user by ID
  async fetchUserById({ commit }, userId) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.get(USER_ENDPOINTS.GET_USER(userId));
      
      if (response.data && response.data.user) {
        commit('SET_CURRENT_USER', response.data.user);
        return response.data.user;
      } else if (response.data) {
        commit('SET_CURRENT_USER', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to load user details');
      return null;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new user
  async createUser({ commit }, userData) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.post(USER_ENDPOINTS.CREATE_USER, userData);
      
      if (response.data && response.data.user) {
        commit('ADD_USER', response.data.user);
        return response.data.user;
      } else if (response.data) {
        commit('ADD_USER', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create user');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update an existing user
  async updateUser({ commit }, { userId, userData }) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.put(USER_ENDPOINTS.UPDATE_USER(userId), userData);
      
      if (response.data && response.data.user) {
        commit('UPDATE_USER', response.data.user);
        return response.data.user;
      } else if (response.data) {
        commit('UPDATE_USER', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update user');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete a user
  async deleteUser({ commit }, userId) {
    try {
      commit('SET_LOADING', true);
      
      await axios.delete(USER_ENDPOINTS.DELETE_USER(userId));
      commit('DELETE_USER', userId);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete user');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Change user status (activate/deactivate)
  async changeUserStatus({ commit }, { userId, isActive }) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.put(USER_ENDPOINTS.CHANGE_STATUS(userId), { isActive });
      
      if (response.data && response.data.user) {
        commit('UPDATE_USER', response.data.user);
        return response.data.user;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to change user status:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to change user status');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Reset user password  
  async resetUserPassword({ commit }, { userId, newPassword }) {
    try {
      commit('SET_LOADING', true);
      
      const response = await axios.put(USER_ENDPOINTS.RESET_PASSWORD(userId), { newPassword });
      return response.data;
    } catch (error) {
      console.error('Failed to reset user password:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to reset user password');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
