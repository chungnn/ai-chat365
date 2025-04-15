<template>  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Trung Tâm Hỗ Trợ Management</h2>
    </div>
    <nav class="sidebar-nav">
      <router-link
        to="/dashboard"
        class="nav-link"
        active-class="active"
      >
        <span class="icon">📊</span>
        <span>Dashboard</span>
      </router-link>      <router-link
        to="/chats"
        class="nav-link"
        active-class="active"
      >
        <span class="icon">💬</span>
        <span>Chats</span>
        <span
          v-if="unreadChats > 0"
          class="badge"
        >{{ unreadChats }}</span>
      </router-link>      <router-link
        to="/tags"
        class="nav-link"
        active-class="active"
      >
        <span class="icon">🏷️</span>
        <span>Tags</span>
      </router-link>
      <router-link
        to="/categories"
        class="nav-link"
        active-class="active"
      >
        <span class="icon">📂</span>
        <span>Danh Mục</span>
      </router-link>
      <router-link
        to="/users"
        class="nav-link"
        active-class="active"
      >
        <span class="icon">👥</span>
        <span>Người Dùng</span>
      </router-link>    </nav>
    <div class="sidebar-footer">
      <p>© 2025 Trung Tâm Hỗ Trợ</p>
    </div>
  </aside>
</template>

<script>
// import { computed } from 'vue';
// import { useStore } from 'vuex';

export default {
  name: 'SidebarComponent',
  
  setup() {
    // //const store = useStore();
    
    // const unreadChats = computed(() => {
    //   //return store.getters['chat/allChats'].filter(chat => chat.unread).length;
    // });
    
    // return {
    //   unreadChats
    // };
  }
}
</script>

<style scoped>
.sidebar {
  background-color: var(--dark-color);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.sidebar-nav {
  padding: 20px 0;
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link .icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border-left: 4px solid var(--primary-color);
}

.badge {
  position: absolute;
  right: 15px;
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  padding: 2px 8px;
}

.sidebar-footer {
  padding: 15px 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
