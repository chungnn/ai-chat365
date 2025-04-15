import axios from '@/plugins/axios';

// State mặc định
const state = {
  currentLanguage: localStorage.getItem('userLanguage') || 'en'
};

// Getters
const getters = {
  getCurrentLanguage: state => state.currentLanguage
};

// Mutations
const mutations = {
  SET_LANGUAGE(state, languageCode) {
    state.currentLanguage = languageCode;
    localStorage.setItem('userLanguage', languageCode);
  }
};

// Actions
const actions = {
  async changeLanguage({ commit }, { langCode, i18n }) {
    // Cập nhật i18n và localStorage
    i18n.locale = langCode;
    commit('SET_LANGUAGE', langCode);
    
    // Đồng bộ tùy chọn ngôn ngữ với API
    try {
      await axios.post('/language/preference', { language: langCode });
    } catch (error) {
      console.error('Error syncing language preference with API:', error);
    }
  },
  
  async saveLanguagePreference({ state }) {
    // Lưu tùy chọn ngôn ngữ vào hồ sơ người dùng nếu đã đăng nhập
    try {
      await axios.post('/language/save', { language: state.currentLanguage });
    } catch (error) {
      console.error('Error saving language preference to profile:', error);
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
