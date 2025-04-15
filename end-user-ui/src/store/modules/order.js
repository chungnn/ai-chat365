import axios from '@/plugins/axios';

const state = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null
};

const getters = {
  allOrders: state => state.orders,
  currentOrder: state => state.currentOrder,
  isLoading: state => state.loading,
  error: state => state.error
};

const mutations = {
  SET_ORDERS(state, orders) {
    state.orders = orders;
  },
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order;
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchOrders({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/orders');
      commit('SET_ORDERS', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchOrderById({ commit }, orderId) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/orders/${orderId}`);
      commit('SET_CURRENT_ORDER', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async createOrder({ commit, dispatch }, orderData) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/orders', orderData);
      
      // Xóa giỏ hàng sau khi tạo đơn hàng thành công
      dispatch('cart/clearCart', null, { root: true });
      
      commit('SET_CURRENT_ORDER', response.data);
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Đặt hàng thành công'
      }, { root: true });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tạo đơn hàng');
      
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể tạo đơn hàng'
      }, { root: true });
      
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async processPayment({ commit, dispatch }, paymentData) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/orders/payment', paymentData);
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Thanh toán thành công'
      }, { root: true });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể xử lý thanh toán');
      
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể xử lý thanh toán'
      }, { root: true });
      
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async cancelOrder({ commit, dispatch }, orderId) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.put(`/orders/${orderId}/cancel`);
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Hủy đơn hàng thành công'
      }, { root: true });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể hủy đơn hàng');
      
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể hủy đơn hàng'
      }, { root: true });
      
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
  mutations,
  actions
};