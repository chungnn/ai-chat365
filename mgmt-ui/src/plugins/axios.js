import axios from 'axios';
import i18n from './i18n';

// Tạo một instance axios mới với URL cơ sở từ biến môi trường
const http = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm interceptor để gửi ngôn ngữ hiện tại với mỗi request
http.interceptors.request.use(config => {
  // Thêm header ngôn ngữ
  config.headers['Accept-Language'] = i18n.global.locale.value;
  
  // Thêm tham số ngôn ngữ cho tất cả các request
  if (config.params) {
    config.params = { ...config.params, lang: i18n.global.locale.value };
  } else {
    config.params = { lang: i18n.global.locale.value };
  }
  
  // Thêm token xác thực nếu có
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Xử lý response và các lỗi
http.interceptors.response.use(
  response => response,
  error => {
    // Xử lý các lỗi phổ biến
    if (error.response) {
      // Lỗi từ server với status code
      switch (error.response.status) {
        case 401: // Unauthorized
          // Có thể chuyển hướng đến trang đăng nhập
          break;
        case 403: // Forbidden
          break;
        case 404: // Not Found
          break;
        case 500: // Server Error
          break;
      }
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error('Network Error:', error.request);
    } else {
      // Có lỗi khi thiết lập request
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default http;
