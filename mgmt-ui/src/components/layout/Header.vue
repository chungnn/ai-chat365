<template>
  <header class="main-header">
    <div class="header-content">
      <h1>Admin Dashboard</h1>
      <div class="user-menu">
        <span>{{ adminName }}</span>
        <button
          class="btn btn-sm"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'HeaderComponent',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const admin = computed(() => store.getters['auth/currentAdmin']);
    const adminName = computed(() => admin.value?.name || 'Admin');
    
    const logout = async () => {
      // Disconnect socket
      store.dispatch('chat/disconnectSocket');
      
      // Logout
      await store.dispatch('auth/logout');
      
      // Redirect to login
      router.push('/login');
    };
    
    return {
      adminName,
      logout
    };
  }
}
</script>

<style scoped>
.main-header {
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 15px 30px;
  position: fixed;
  top: 0;
  right: 0;
  left: 250px; /* Match sidebar width */
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-menu span {
  font-weight: 500;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #f1f5f9;
  color: #334155;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-sm:hover {
  background-color: #e2e8f0;
}
</style>
