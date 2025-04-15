import axios from '@/plugins/axios';

const state = {
  token: localStorage.getItem('token') || null,
  user: null,
  status: ''
};

const getters = {
  isAuthenticated: state => !!state.token,
  user: state => state.user,
  authStatus: state => state.status
};

const mutations = {
  AUTH_REQUEST(state) {
    state.status = 'loading';
  },
  AUTH_SUCCESS(state, { token, user }) {
    state.status = 'success';
    state.token = token;
    state.user = user;
  },
  AUTH_ERROR(state) {
    state.status = 'error';
  },
  SET_USER(state, user) {
    state.user = user;
  },
  UPDATE_USER(state, user) {
    state.user = { ...state.user, ...user };
  },
  LOGOUT(state) {
    state.status = '';
    state.token = null;
    state.user = null;
  }
};

const actions = {
  async login({ commit, dispatch }, credentials) {
    commit('AUTH_REQUEST');
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      commit('AUTH_SUCCESS', { token, user });
      return response;
    } catch (error) {
      commit('AUTH_ERROR');
      localStorage.removeItem('token');
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Đăng nhập thất bại'
      }, { root: true });
      throw error;
    }
  },
  
  async register({ commit, dispatch }, userData) {
    commit('AUTH_REQUEST');
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      commit('AUTH_SUCCESS', { token, user });
      return response;
    } catch (error) {
      commit('AUTH_ERROR');
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Đăng ký thất bại'
      }, { root: true });
      throw error;
    }
  },
  
  async fetchUser({ commit }) {
    try {
      const response = await axios.get('/auth/me');
      commit('SET_USER', response.data);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        commit('LOGOUT');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
      throw error;
    }
  },
  
  async updateProfile({ commit, dispatch }, userData) {
    try {
      const response = await axios.put('/auth/profile', userData);
      commit('UPDATE_USER', response.data);
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Cập nhật thông tin thành công'
      }, { root: true });
      
      return response;
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Cập nhật thông tin thất bại'
      }, { root: true });
      throw error;
    }
  },
  
  async changePassword({ dispatch }, passwordData) {
    try {
      const response = await axios.put('/auth/password', passwordData);
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Đổi mật khẩu thành công'
      }, { root: true });
      
      return response;
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại'
      }, { root: true });
      throw error;
    }
  },
  
  async forgotPassword({ dispatch }, email) {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Vui lòng kiểm tra email để đặt lại mật khẩu'
      }, { root: true });
      
      return response;
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu'
      }, { root: true });
      throw error;
    }
  },
  
  async resetPassword({ dispatch }, { token, password }) {
    try {
      const response = await axios.post('/auth/reset-password', { token, password });
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Đặt lại mật khẩu thành công'
      }, { root: true });
      
      return response;
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Đặt lại mật khẩu thất bại'
      }, { root: true });
      throw error;
    }
  },
  
  logout({ commit }) {
    return new Promise(resolve => {
      commit('LOGOUT');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      resolve();
    });
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};