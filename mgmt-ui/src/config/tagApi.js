// filepath: d:\ANH CHUNG\Projects\ai-chat365\mgmt-ui\src\config\tagApi.js
/**
 * API Client for tag module
 * Centralized API client with proper error handling and authentication
 */

import axios from 'axios';
import { configureAxios } from './api';

// Create a dedicated axios instance for tag API
const tagApiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api'
});

// Configure the API client with error handling
export const configureTagApi = (token) => {
  // Configure the tag API client with authentication token and error handling
  configureAxios(tagApiClient, token);
};

// API endpoints for tag module
export const TAG_ENDPOINTS = {
  GET_TAGS: `/api/tags`,
  GET_TAG: (id) => `/api/tags/${id}`,
  CREATE_TAG: `/api/tags`,
  UPDATE_TAG: (id) => `/api/tags/${id}`,
  DELETE_TAG: (id) => `/api/tags/${id}`
};

// Export the API client for use in the tag module
export default tagApiClient;
