import axios from 'axios';

// Cấu hình Axios
const apiURL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

// Tạo instance axios với baseURL từ biến môi trường
const axiosInstance = axios.create({
  baseURL: apiURL
});

// Thêm interceptor để xử lý token authentication
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;