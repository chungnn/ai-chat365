import { createStore } from 'vuex';
import auth from './modules/auth';
import cart from './modules/cart';
import course from './modules/course';
import chat from './modules/chat';
import order from './modules/order';
import notification from './modules/notification';
import urlMetadata from './modules/urlMetadata';

export default createStore({
  modules: {
    auth,
    cart,
    course,
    chat,
    order,
    notification,
    urlMetadata
  },
  state: {
    isLoading: false,
    error: null
  },
  mutations: {
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    CLEAR_ERROR(state) {
      state.error = null;
    }
  },
  actions: {
    setLoading({ commit }, isLoading) {
      commit('SET_LOADING', isLoading);
    },
    setError({ commit }, error) {
      commit('SET_ERROR', error);
    },
    clearError({ commit }) {
      commit('CLEAR_ERROR');
    }
  },
  getters: {
    isLoading: state => state.isLoading,
    error: state => state.error
  }
});