import axios from '@/plugins/axios';

const state = {
  items: [],
  loading: false
};

const getters = {
  cartItems: state => state.items,
  totalItemCount: state => state.items.reduce((total, item) => total + 1, 0),
  totalPrice: state => state.items.reduce((total, item) => total + item.price, 0),
  isLoading: state => state.loading
};

const mutations = {
  SET_CART_ITEMS(state, items) {
    state.items = items;
  },
  ADD_CART_ITEM(state, item) {
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItem = state.items.find(i => i._id === item._id);
    if (!existingItem) {
      state.items.push(item);
    }
  },
  REMOVE_CART_ITEM(state, itemId) {
    state.items = state.items.filter(item => item._id !== itemId);
  },
  CLEAR_CART(state) {
    state.items = [];
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  }
};

const actions = {
  async initializeCart({ commit }) {
    // Lấy giỏ hàng từ localStorage khi khởi động ứng dụng
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        commit('SET_CART_ITEMS', JSON.parse(savedCart));
      } catch (error) {
        localStorage.removeItem('cart');
      }
    }
  },
  
  async fetchCart({ commit, dispatch }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/cart');
      commit('SET_CART_ITEMS', response.data.items);
      return response.data;
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể tải giỏ hàng'
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async addToCart({ commit, dispatch, state }, course) {
    commit('SET_LOADING', true);
    try {
      // Thêm vào giỏ hàng ở phía client trước
      commit('ADD_CART_ITEM', course);
      
      // Lưu vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
      
      // Nếu đã đăng nhập, cập nhật lên server
      if (localStorage.getItem('token')) {
        await axios.post('/cart', { courseId: course._id });
      }
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: `Đã thêm "${course.title}" vào giỏ hàng`
      }, { root: true });
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể thêm vào giỏ hàng'
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async removeFromCart({ commit, dispatch, state }, itemId) {
    commit('SET_LOADING', true);
    try {
      // Xóa khỏi giỏ hàng ở phía client trước
      commit('REMOVE_CART_ITEM', itemId);
      
      // Lưu vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
      
      // Nếu đã đăng nhập, cập nhật lên server
      if (localStorage.getItem('token')) {
        await axios.delete(`/cart/${itemId}`);
      }
      
      dispatch('notification/addNotification', {
        type: 'success',
        message: 'Đã xóa sản phẩm khỏi giỏ hàng'
      }, { root: true });
    } catch (error) {
      dispatch('notification/addNotification', {
        type: 'error',
        message: error.response?.data?.message || 'Không thể xóa khỏi giỏ hàng'
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async clearCart({ commit }) {
    commit('CLEAR_CART');
    localStorage.removeItem('cart');
    
    // Nếu đã đăng nhập, xóa giỏ hàng trên server
    if (localStorage.getItem('token')) {
      try {
        await axios.delete('/cart');
      } catch (error) {
        console.error('Failed to clear cart on server:', error);
      }
    }
  },
  
  async syncCart({ state, dispatch }) {
    // Đồng bộ giỏ hàng từ localStorage lên server khi đăng nhập
    if (localStorage.getItem('token') && state.items.length > 0) {
      try {
        const courseIds = state.items.map(item => item._id);
        await axios.post('/cart/sync', { courseIds });
      } catch (error) {
        dispatch('notification/addNotification', {
          type: 'error',
          message: 'Không thể đồng bộ giỏ hàng'
        }, { root: true });
      }
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