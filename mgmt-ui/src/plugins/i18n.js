import { createI18n } from 'vue-i18n';
import en from '../locales/en.js';
import vi from '../locales/vi.js';
import http from './axios';

// Khởi tạo ngôn ngữ mặc định từ localStorage hoặc 'en'
const storedLanguage = localStorage.getItem('userLanguage') || 'en';

const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: storedLanguage, // Default locale
  fallbackLocale: 'en', // Fallback locale
  messages: {
    en,
    vi
  }
});

// Hàm cập nhật ngôn ngữ có thể được sử dụng khắp ứng dụng
export const setLanguage = async (locale) => {
  try {
    // Lưu vào localStorage
    localStorage.setItem('userLanguage', locale);
    
    // Cập nhật locale cho i18n
    i18n.global.locale.value = locale;
    
    // Gọi API để cập nhật trong session server
    const response = await http.post('/api/languages/set', { locale });
    
    return response.data.success;
  } catch (error) {
    console.error('Error setting language:', error);
    return false;
  }
};

export default i18n;
