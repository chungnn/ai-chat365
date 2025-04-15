const state = {
  notifications: [],
  nextId: 1
};

const getters = {
  notifications: (state) => state.notifications
};

const actions = {
  showNotification({ commit }, { type, message, timeout = 5000 }) {
    // Create a unique ID for the notification
    const id = state.nextId;
    
    // Add notification to the state
    commit('ADD_NOTIFICATION', {
      id,
      type,
      message,
      timestamp: new Date()
    });
    
    // Set timer to remove the notification
    setTimeout(() => {
      commit('REMOVE_NOTIFICATION', id);
    }, timeout);
  },
  
  removeNotification({ commit }, id) {
    commit('REMOVE_NOTIFICATION', id);
  }
};

const mutations = {
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push(notification);
    state.nextId++;
  },
  
  REMOVE_NOTIFICATION(state, id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
