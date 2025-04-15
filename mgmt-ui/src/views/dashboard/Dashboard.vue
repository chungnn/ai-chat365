<template>
  <div class="dashboard">
    <h2 class="page-title">
      Dashboard
    </h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          💬
        </div>
        <div class="stat-content">
          <h3>{{ chatStats.total }}</h3>
          <p>Total Chats</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          🔔
        </div>
        <div class="stat-content">
          <h3>{{ chatStats.active }}</h3>
          <p>Active Chats</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          ✅
        </div>
        <div class="stat-content">
          <h3>{{ chatStats.resolved }}</h3>
          <p>Resolved</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          ⏱️
        </div>
        <div class="stat-content">
          <h3>{{ chatStats.avgResponseTime }}m</h3>
          <p>Avg Response Time</p>
        </div>
      </div>
    </div>
    
    <div class="recent-activity">
      <div class="card">
        <h3 class="card-title">
          Recent Chats
        </h3>
        <div
          v-if="loading"
          class="loading-container"
        >
          <p>Loading...</p>
        </div>
        <div
          v-else-if="recentChats.length === 0"
          class="empty-state"
        >
          <p>No recent chat activity</p>
        </div>
        <table
          v-else
          class="table"
        >
          <thead>
            <tr>
              <th>User</th>
              <th>Last Message</th>
              <th>Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="chat in recentChats"
              :key="chat._id"
            >
              <td>{{ chat.user?.name || 'Anonymous' }}</td>
              <td class="message-preview">
                {{ getLastMessage(chat) }}
              </td>
              <td>{{ formatTime(chat.updatedAt) }}</td>
              <td>
                <span :class="['status-badge', `status-${chat.status}`]">
                  {{ chat.status }}
                </span>
              </td>
              <td>
                <router-link
                  :to="`/chats/${chat._id}`"
                  class="btn btn-sm btn-primary"
                >
                  View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'DashboardView',
  setup() {
    const store = useStore();
    const loading = ref(true);
    
    // Mock data for demo purposes - in a real app this would come from the API
    const chatStats = ref({
      total: 0,
      active: 0,
      resolved: 0,
      avgResponseTime: 0
    });
    
    const recentChats = computed(() => {
      // Get 5 most recent chats
      const chats = [...store.getters['chat/allChats']];
      return chats
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
    });
    
    const getLastMessage = (chat) => {
      if (!chat.messages || chat.messages.length === 0) {
        return 'No messages';
      }
      
      const lastMessage = chat.messages[chat.messages.length - 1];
      return lastMessage.content.length > 40
        ? lastMessage.content.substring(0, 40) + '...'
        : lastMessage.content;
    };
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    
    onMounted(async () => {
      try {
        // Fetch all chats
        await store.dispatch('chat/fetchChats');
        
        // Calculate stats
        const chats = store.getters['chat/allChats'];
        chatStats.value = {
          total: chats.length,
          active: chats.filter(c => c.status === 'active').length,
          resolved: chats.filter(c => c.status === 'resolved').length,
          avgResponseTime: 3 // Mock value, would be calculated from real data
        };
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load dashboard data'
        });
      } finally {
        loading.value = false;
      }
    });
    
    return {
      loading,
      chatStats,
      recentChats,
      getLastMessage,
      formatTime
    };
  }
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
  margin-top: 60px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #1d2537;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
  padding: 12px;
  background-color: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
  border-radius: 8px;
}

.stat-content h3 {
  font-size: 24px;
  margin: 0 0 6px 0;
  color: #1d2537;
}

.stat-content p {
  margin: 0;
  color: #6b7a99;
  font-size: 14px;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.card-title {
  font-size: 18px;
  margin: 0 0 20px 0;
  color: #1d2537;
}

.loading-container,
.empty-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  color: #6b7a99;
}

.message-preview {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(46, 213, 115, 0.1);
  color: #2ed573;
}

.status-resolved {
  background-color: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
}

.status-waiting {
  background-color: rgba(255, 191, 0, 0.1);
  color: #ffbf00;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
