import axios from '@/plugins/axios';

const state = {
  metadata: {},
  loading: false,
  error: null
};

const getters = {
  getMetadataByUrl: (state) => (url) => {
    return state.metadata[url] || null;
  },
  isLoading: (state) => state.loading
};

const actions = {
  async fetchUrlMetadata({ commit, state }, url) {
    // Trả về dữ liệu đã cache nếu có
    if (state.metadata[url]) {
      return state.metadata[url];
    }
    
    commit('SET_LOADING', true);
    
    try {
      const response = await axios.get('/url-metadata', {
        params: { url }
      });
      
      commit('SET_URL_METADATA', { url, data: response.data });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy metadata URL:', error);
      
      // Tạo dữ liệu dự phòng
      const fallbackData = {
        title: extractTitleFromUrl(url),
        description: '',
        image: ''
      };
      
      commit('SET_ERROR', error.message || 'Không thể lấy metadata URL');
      commit('SET_URL_METADATA', { url, data: fallbackData });
      return fallbackData;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const mutations = {
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_URL_METADATA(state, { url, data }) {
    state.metadata = { ...state.metadata, [url]: data };
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

// Hàm trích xuất tiêu đề từ URL khi không lấy được metadata
function extractTitleFromUrl(url) {
  try {
    // Cố gắng trích xuất phần giống tiêu đề từ URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      // Sử dụng phần cuối cùng của đường dẫn làm tiêu đề tiềm năng
      const lastSegment = pathParts[pathParts.length - 1];
      // Thay thế gạch ngang và gạch dưới bằng khoảng trắng và viết hoa
      return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.[^/.]+$/, '') // Xóa phần mở rộng tệp nếu có
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
