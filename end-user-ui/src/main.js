import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import axios from './plugins/axios';
import SocketPlugin from './plugins/socket';

// Cấu hình Vuetify
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
});

// Tạo ứng dụng Vue 3
const app = createApp(App);

// Đăng ký các plugins và store
app.use(router);
app.use(store);
app.use(vuetify);
app.use(SocketPlugin);

// Đăng ký instance axios
app.config.globalProperties.$http = axios;

// Mount ứng dụng
app.mount('#app');