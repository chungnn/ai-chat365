import axios from '@/plugins/axios';

const state = {
  courses: [],
  featuredCourses: [],
  currentCourse: null,
  myCourses: [],
  loading: false,
  error: null,
  totalCourses: 0,
  filters: {
    category: null,
    search: '',
    page: 1,
    limit: 12,
    sort: 'createdAt'
  }
};

const getters = {
  allCourses: state => state.courses,
  featuredCourses: state => state.featuredCourses,
  currentCourse: state => state.currentCourse,
  myCourses: state => state.myCourses,
  isLoading: state => state.loading,
  error: state => state.error,
  totalPages: state => Math.ceil(state.totalCourses / state.filters.limit),
  currentFilters: state => state.filters
};

const mutations = {
  SET_COURSES(state, courses) {
    state.courses = courses;
  },
  SET_FEATURED_COURSES(state, courses) {
    state.featuredCourses = courses;
  },
  SET_CURRENT_COURSE(state, course) {
    state.currentCourse = course;
  },
  SET_MY_COURSES(state, courses) {
    state.myCourses = courses;
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_TOTAL_COURSES(state, total) {
    state.totalCourses = total;
  },
  UPDATE_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters };
  },
  CLEAR_FILTERS(state) {
    state.filters = {
      category: null,
      search: '',
      page: 1,
      limit: 12,
      sort: 'createdAt'
    };
  }
};

const actions = {
  async fetchCourses({ commit, state }) {
    commit('SET_LOADING', true);
    try {
      // Xây dựng query params từ filters
      const params = {
        page: state.filters.page,
        limit: state.filters.limit,
        sort: state.filters.sort
      };
      
      if (state.filters.search) {
        params.search = state.filters.search;
      }
      
      if (state.filters.category) {
        params.category = state.filters.category;
      }
      
      const response = await axios.get('/courses', { params });
      commit('SET_COURSES', response.data.courses);
      commit('SET_TOTAL_COURSES', response.data.total);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải danh sách khóa học');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchFeaturedCourses({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/courses/featured');
      commit('SET_FEATURED_COURSES', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải khóa học nổi bật');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchCourseById({ commit }, id) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/courses/${id}`);
      commit('SET_CURRENT_COURSE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải thông tin khóa học');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchMyCourses({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/courses/my-courses');
      commit('SET_MY_COURSES', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải khóa học của bạn');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  updateFilters({ commit, dispatch }, filters) {
    commit('UPDATE_FILTERS', filters);
    return dispatch('fetchCourses');
  },
  
  clearFilters({ commit, dispatch }) {
    commit('CLEAR_FILTERS');
    return dispatch('fetchCourses');
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};