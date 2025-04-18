// filepath: d:\ANH CHUNG\Projects\ai-chat365\mgmt-ui\src\config\urlMetaApi.js
/**
 * API Client for URL metadata module
 * Centralized API client with proper error handling and authentication
 */

import axios from 'axios';
import { configureAxios } from './api';

// Create a dedicated axios instance for URL metadata API
const urlMetaApiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api'
});

// Configure the API client with error handling
export const configureUrlMetaApi = (token) => {
  // Configure the URL metadata API client with authentication token and error handling
  configureAxios(urlMetaApiClient, token);
};

// API endpoints for URL metadata module
export const URL_META_ENDPOINTS = {
  GET_METADATA: `/api/url-metadata`,
};

// Export the API client for use in the URL metadata module
export default urlMetaApiClient;
