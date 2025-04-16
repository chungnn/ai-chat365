<template>
  <div class="app-container">
    <Notification />
    <div v-if="isAuthenticated">
      <Sidebar />      <div class="main-content">
        <AppHeader />
        <router-view />
      </div>
    </div>
    <div v-else>
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import AppHeader from './components/layout/Header.vue';
import Sidebar from './components/layout/Sidebar.vue';
import Notification from './components/common/Notification.vue';

export default {
  name: 'App',
  components: {
    AppHeader,
    Sidebar,
    Notification
  },  setup() {
    const store = useStore();
    // Removed unused router variable
    
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

    onMounted(() => {
      // Check if token exists in local storage and validate it
      store.dispatch('auth/checkAuthStatus');
      
      // Setup socket connection if authenticated
      if (isAuthenticated.value) {
        store.dispatch('chat/initSocket');
      }
    });

    return {
      isAuthenticated
    };
  }
}
</script>

<style>
.app-container {
  width: 100%;
  height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 250px; /* Width of the sidebar */
  background-color: #f5f7fa;
  height: 100vh;
  overflow-y: auto;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  color: #333;
}
</style>
