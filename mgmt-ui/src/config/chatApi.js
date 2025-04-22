/**
 * API Client for chat module
 * Centralized API client with proper error handling and authentication
 */

import axios from 'axios';
import { configureAxios } from './api';

// Create a dedicated axios instance for chat API
const chatApiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api'
});

// Configure the API client with error handling
export const configureChatApi = (token) => {
  // Configure the chat API client with authentication token and error handling
  configureAxios(chatApiClient, token);
};

// Base API URL
// const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// API endpoints for chat module
export const CHAT_ENDPOINTS = {
  GET_CHATS: `/api/chats`,
  GET_CHAT_DETAIL: (chatId) => `/api/chats/${chatId}`,
  ASSIGN_CHAT: (chatId) => `/api/chats/${chatId}/assign`,
  GET_AGENTS: `/api/users?role=agent`,
  UPDATE_TAGS: (chatId) => `/api/chats/${chatId}/tags`,  UPDATE_CATEGORY: (chatId) => `/api/chats/${chatId}/category`,
  UPDATE_STATUS: (chatId) => `/api/chats/${chatId}/status`,
  UPDATE_PRIORITY: (chatId) => `/api/chats/${chatId}/priority`,
  SEND_REPLY: (chatId) => `/api/chats/${chatId}/reply`,
  EXTRACT_KNOWLEDGE: (chatId) => `/api/chats/${chatId}/extract-knowledge`,
};

// Export the API client for use in the chat module
export default chatApiClient;
