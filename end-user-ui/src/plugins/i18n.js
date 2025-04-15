import { createI18n } from 'vue-i18n';
import en from '../locales/en.js';
import vi from '../locales/vi.js';

const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: localStorage.getItem('userLanguage') || 'en', // Default locale
  fallbackLocale: 'en', // Fallback locale
  messages: {
    en,
    vi
  }
});

export default i18n;
