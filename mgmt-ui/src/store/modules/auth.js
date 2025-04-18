import axios from 'axios';
import { configureAxios } from '@/config/api';
import router from '@/router';

// Base API URL from environment variable
export const API_BASE_URL = process.env.VUE_APP_API_URL || '';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  // Add other auth-related endpoints as needed
};


const state = {
    admin: null,
    token: null,
    loading: false,
    error: null
};

const getters = {
    isAuthenticated: (state) => !!state.token,
    currentAdmin: (state) => state.admin,
    authLoading: (state) => state.loading,
    authError: (state) => state.error
};

const actions = {

    async login({ commit }, credentials) {
        try {
            commit('SET_LOADING', true);
            commit('SET_ERROR', null);

            const response = await axios.post(AUTH_ENDPOINTS.LOGIN, credentials);
            console.log('Login response:', response.data);            if (response.data.token && (response.data.admin || response.data.user)) {
                const userData = response.data.admin || response.data.user;
                commit('SET_AUTH_DATA', {
                    token: response.data.token,
                    admin: userData
                });
                // Set auth header for future requests
                configureAxios(axios, response.data.token);
                return true;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            commit('SET_ERROR', errorMessage);
            return false;
        } finally {
            commit('SET_LOADING', false);
        }
    },

    // Force re-login when authentication fails
    async forceRelogin({ commit, dispatch }) {
      console.warn('Authentication failed. Forcing re-login...');
      
      // Show notification to user
      dispatch('notification/showNotification', {
        type: 'error',
        message: 'Your session has expired. Please log in again.'
      }, { root: true });
      
      // Clear authentication data
      commit('CLEAR_AUTH_DATA');
      
      // Redirect to login page
      if (router) {
        router.push('/login');
      } else {
        // Fallback if router is not available
        window.location.href = '/login';
      }
    },
    
    async logout({ commit }) {
        commit('CLEAR_AUTH_DATA');
        delete axios.defaults.headers.common['Authorization'];
    },
    checkAuthStatus({ state }) {
        if (state.token) {
            // Set auth header if token exists
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
    }
};

const mutations = {
    SET_LOADING(state, isLoading) {
        state.loading = isLoading;
    },

    SET_ERROR(state, error) {
        state.error = error;
    },

    SET_AUTH_DATA(state, data) {
        state.token = data.token;
        state.admin = data.admin;
    },

    CLEAR_AUTH_DATA(state) {
        state.token = null;
        state.admin = null;
        state.error = null;
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
