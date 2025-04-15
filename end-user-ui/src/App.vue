<template>
  <v-app>    <v-app-bar color="primary" dark>
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-app-bar-title>Trung tâm hỗ trợ khách hàng</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="!isAuthenticated" text to="/login">Đăng nhập</v-btn>
      <v-btn v-if="!isAuthenticated" variant="outlined" to="/register">Đăng ký</v-btn>
      <v-menu v-else location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32">
              <v-img v-if="userAvatar" :src="userAvatar"></v-img>
              <v-icon v-else>mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/profile">
            <v-list-item-title>Hồ sơ</v-list-item-title>
          </v-list-item>
          <v-list-item to="/">
            <v-list-item-title>Yêu cầu hỗ trợ</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title>Đăng xuất</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar><v-navigation-drawer v-model="drawer" temporary>      <v-list-item>
        <v-list-item-title class="text-h6">Hỗ trợ khách hàng</v-list-item-title>
        <v-list-item-subtitle>Giải pháp hỗ trợ tức thì</v-list-item-subtitle>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>      <v-list-item to="/" link>
          <template v-slot:prepend>
            <v-icon>mdi-chat-processing</v-icon>
          </template>
          <v-list-item-title>Hỗ trợ trực tuyến</v-list-item-title>
        </v-list-item>
        <v-list-item to="/about" link>
          <template v-slot:prepend>
            <v-icon>mdi-information</v-icon>
          </template>
          <v-list-item-title>Giới thiệu</v-list-item-title>
        </v-list-item>
        <v-list-item to="/contact" link>
          <template v-slot:prepend>
            <v-icon>mdi-email</v-icon>
          </template>
          <v-list-item-title>Liên hệ</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>    <v-footer app>
      <div class="w-100 text-center">
        {{ new Date().getFullYear() }} — <strong>Trung tâm hỗ trợ khách hàng</strong>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const router = useRouter();

const drawer = ref(false);
const userAvatar = ref(null);

// Computed properties
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const user = computed(() => store.getters['auth/user']);
// No longer needed for helpdesk application

// Watchers
watch(user, (newUser) => {
  if (newUser && newUser.avatar) {
    userAvatar.value = newUser.avatar;
  }
}, { immediate: true });

// Methods
const logout = async () => {
  await store.dispatch('auth/logout');
  router.push('/login');
};

// Lifecycle hooks
onMounted(() => {
  // Kiểm tra token và tự động đăng nhập nếu có
  if (localStorage.getItem('token')) {
    store.dispatch('auth/fetchUser');
  }
  // Initialize chat history if needed
  store.dispatch('chat/initializeChats');
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.v-application {
  font-family: 'Roboto', sans-serif;
  display: flex;
  min-height: 100vh;
  width: 100%;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
}

.v-main {
  display: flex;
  flex: 1 0 auto;
  max-width: 100%;
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-container {
  width: 100%;
  padding: 16px;
  margin-right: auto;
  margin-left: auto;
}

.w-100 {
  width: 100%;
}

.text-center {
  text-align: center;
}
</style>