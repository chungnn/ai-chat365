import axios from 'axios';

// Cấu hình Axios
const apiURL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

// Tạo instance axios với baseURL từ biến môi trường
const axiosInstance = axios.create({
  baseURL: apiURL
});

// Thêm interceptor để xử lý token authentication và ngôn ngữ
axiosInstance.interceptors.request.use(config => {
  // Thêm token xác thực nếu có
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Thêm ngôn ngữ hiện tại vào header Accept-Language
  const userLanguage = localStorage.getItem('userLanguage') || 'en';
  config.headers['Accept-Language'] = userLanguage;
  
  // Thêm tham số ngôn ngữ vào URL
  if (!config.params) {
    config.params = {};
  }
  config.params.lang = userLanguage;
  
  return config;
});

export default axiosInstance;