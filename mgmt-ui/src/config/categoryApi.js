/**
 * API Client for category module
 * Centralized API client with proper error handling and authentication
 */

import axios from 'axios';
import { configureAxios } from './api';

// Create a dedicated axios instance for category API
const categoryApiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api'
});

// Configure the API client with error handling
export const configureCategoryApi = (token) => {
  // Configure the category API client with authentication token and error handling
  configureAxios(categoryApiClient, token);
};

// API endpoints for category module
export const CATEGORY_ENDPOINTS = {
  GET_CATEGORIES: `/api/categories`,
  GET_CATEGORY: (id) => `/api/categories/${id}`,
  CREATE_CATEGORY: `/api/categories`,
  UPDATE_CATEGORY: (id) => `/api/categories/${id}`,
  DELETE_CATEGORY: (id) => `/api/categories/${id}`
};

// Export the API client for use in the category module
export default categoryApiClient;
