import categoryApiClient, { CATEGORY_ENDPOINTS } from '../../config/categoryApi';

const state = {
  categories: [],
  loading: false,
  error: null,
  currentCategory: null
};

const getters = {
  allCategories: state => state.categories,
  isLoading: state => state.loading,
  hasError: state => state.error !== null,
  errorMessage: state => state.error,
  currentCategory: state => state.currentCategory
};

const mutations = {
  SET_CATEGORIES(state, categories) {
    state.categories = categories;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_CURRENT_CATEGORY(state, category) {
    state.currentCategory = category;
  },
  ADD_CATEGORY(state, category) {
    state.categories.push(category);
  },
  UPDATE_CATEGORY(state, updatedCategory) {
    const index = state.categories.findIndex(cat => cat._id === updatedCategory._id);
    if (index !== -1) {
      state.categories.splice(index, 1, updatedCategory);
    }
  },
  REMOVE_CATEGORY(state, categoryId) {
    state.categories = state.categories.filter(cat => cat._id !== categoryId);
  }
};

const actions = {
  // Fetch all categories
  async fetchCategories({ commit }) {
    try {
      commit('SET_LOADING', true);
        const response = await categoryApiClient.get(CATEGORY_ENDPOINTS.GET_CATEGORIES);
      
      if (response.data && Array.isArray(response.data.categories)) {
        commit('SET_CATEGORIES', response.data.categories);
        return response.data.categories;
      } else if (Array.isArray(response.data)) {
        commit('SET_CATEGORIES', response.data);
        return response.data;
      } else {
        console.error('Unexpected response format from categories API:', response.data);
        commit('SET_ERROR', 'Invalid response format from server');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      commit('SET_ERROR', 'Failed to load categories');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },  
  // Fetch category by ID
  async fetchCategoryById({ commit }, categoryId) {
    try {
      commit('SET_LOADING', true);
        const response = await categoryApiClient.get(CATEGORY_ENDPOINTS.GET_CATEGORY(categoryId));
      
      if (response.data) {
        commit('SET_CURRENT_CATEGORY', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to fetch category details:', error);
      commit('SET_ERROR', 'Failed to load category details');
      return null;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new category
  async createCategory({ commit }, categoryData) {
    try {
      commit('SET_LOADING', true);
        const response = await categoryApiClient.post(CATEGORY_ENDPOINTS.CREATE_CATEGORY, categoryData);
      
      if (response.data && response.data.category) {
        commit('ADD_CATEGORY', response.data.category);
        return response.data.category;
      } else if (response.data) {
        commit('ADD_CATEGORY', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      commit('SET_ERROR', 'Failed to create category');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },  
  // Update an existing category
  async updateCategory({ commit }, { id, ...categoryData }) {
    try {
      commit('SET_LOADING', true);
        const response = await categoryApiClient.put(CATEGORY_ENDPOINTS.UPDATE_CATEGORY(id), categoryData);
      
      if (response.data && response.data.category) {
        commit('UPDATE_CATEGORY', response.data.category);
        return response.data.category;
      } else if (response.data) {
        commit('UPDATE_CATEGORY', response.data);
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      commit('SET_ERROR', 'Failed to update category');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete a category
  async deleteCategory({ commit }, id) {
    try {
      commit('SET_LOADING', true);
        await categoryApiClient.delete(CATEGORY_ENDPOINTS.DELETE_CATEGORY(id));
      
      commit('REMOVE_CATEGORY', id);
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      commit('SET_ERROR', 'Failed to delete category');
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
  actions,
  mutations
};
