/**
 * API Client for knowledge module
 * Centralized API client with proper error handling and authentication
 */

import axios from 'axios';
import { configureAxios } from './api';

// Create a dedicated axios instance for knowledge API
const knowledgeApiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api'
});

// Configure the API client with error handling
export const configureKnowledgeApi = (token) => {
  // Configure the knowledge API client with authentication token and error handling
  configureAxios(knowledgeApiClient, token);
};

// API endpoints for knowledge module
export const KNOWLEDGE_ENDPOINTS = {
  GET_KNOWLEDGE_BASE: `/api/knowledge`,
  GET_KNOWLEDGE_ITEM: (id) => `/api/knowledge/${id}`,
  CREATE_KNOWLEDGE_ITEM: `/api/knowledge`,
  UPDATE_KNOWLEDGE_ITEM: (id) => `/api/knowledge/${id}`,
  DELETE_KNOWLEDGE_ITEM: (id) => `/api/knowledge/${id}`,
  UPLOAD_KNOWLEDGE_FILE: `/api/knowledge/upload`,
  SEARCH_KNOWLEDGE: (query) => `/api/knowledge/search?query=${encodeURIComponent(query)}`
};

// Export the API client for use in the knowledge module
export default knowledgeApiClient;
