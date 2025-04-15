const state = {
  notifications: []
};

const getters = {
  notifications: state => state.notifications
};

const mutations = {
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push({
      ...notification,
      id: new Date().getTime() + Math.random(),
      show: true
    });
  },
  REMOVE_NOTIFICATION(state, notificationId) {
    const index = state.notifications.findIndex(notification => notification.id === notificationId);
    if (index !== -1) {
      state.notifications.splice(index, 1);
    }
  },
  HIDE_NOTIFICATION(state, notificationId) {
    const notification = state.notifications.find(notification => notification.id === notificationId);
    if (notification) {
      notification.show = false;
    }
  }
};

const actions = {
  addNotification({ commit }, notification) {
    commit('ADD_NOTIFICATION', notification);
    
    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      commit('HIDE_NOTIFICATION', notification.id);
      
      // Xóa thông báo khỏi state sau khi animation kết thúc
      setTimeout(() => {
        commit('REMOVE_NOTIFICATION', notification.id);
      }, 300);
    }, notification.timeout || 5000);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};