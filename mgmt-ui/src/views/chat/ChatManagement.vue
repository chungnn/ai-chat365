<template>
  <div class="chat-management">
    <h2 class="page-title">
      Chats Management
    </h2>
    
    <div class="filters">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by name or message..." 
          class="form-control"
        >
      </div>
      
      <div class="filter-buttons">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value" 
          :class="['filter-button', { active: currentFilter === filter.value }]" 
          @click="setStatusFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
    
    <div class="card">
      <div
        v-if="loading"
        class="loading-container"
      >
        <p>Loading chats...</p>
      </div>
      
      <div
        v-else-if="filteredChats.length === 0"
        class="empty-state"
      >
        <p>No chats found.</p>
      </div>
      
      <table
        v-else
        class="table"
      >        <thead>          <tr>
            <th>User</th>
            <th>Latest Message</th>
            <th>Tags</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>          <tr 
            v-for="chat in filteredChats" 
            :key="chat._id" 
            :class="{ unread: chat.unread }"
          >
            <td>{{ chat.user?.name || 'Anonymous' }}</td>
            <td class="message-preview">
              {{ getLastMessage(chat) }}
            </td>
            <td>
              <div v-if="chat.tags && chat.tags.length" class="chat-tags">
                <span 
                  v-for="tag in chat.tags" 
                  :key="tag._id" 
                  class="tag"
                  :style="{ backgroundColor: tag.color || '#e2e8f0' }"
                >
                  {{ tag.name }}
                </span>
              </div>
              <span v-else class="no-tags">No tags</span>
            </td>
            <td>{{ formatDate(chat.createdAt) }}</td>
            <td>{{ formatDate(chat.updatedAt) }}</td>
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
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'ChatManagementView',
  
  setup() {
    const store = useStore();
    const loading = ref(true);
    const searchQuery = ref('');
    const currentFilter = ref('all');
      const statusFilters = [
      { label: 'All', value: 'all' }
    ];

    const chats = computed(() => {
      const allChats = store.getters['chat/allChats'];
      return Array.isArray(allChats) ? allChats : [];
    });

    const filteredChats = computed(() => {
      let result = chats.value;

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(chat => 
          (chat.user?.name?.toLowerCase().includes(query)) || 
          (chat.lastMessage && chat.lastMessage.content.toLowerCase().includes(query))
        );
      }

      return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
      const getLastMessage = (chat) => {
      if (!chat.lastMessage) {
        return 'No messages yet';
      }
      
      const preview = chat.lastMessage.content.length > 40
        ? chat.lastMessage.content.substring(0, 40) + '...'
        : chat.lastMessage.content;
        
      const sender = chat.lastMessage.role === 'agent' ? 'Agent: ' : 
                    chat.lastMessage.role === 'user' ? 'User: ' : 
                    chat.lastMessage.role === 'assistant' ? 'AI: ' : '';
      return sender + preview;
    };
    
    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    
    const setStatusFilter = (filter) => {
      currentFilter.value = filter;
    };
    
    onMounted(async () => {
      try {
        await store.dispatch('chat/fetchChats');
      } catch (error) {
        console.error('Failed to fetch chats', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load chats'
        });
      } finally {
        loading.value = false;
      }
    });
    
    return {
      loading,
      searchQuery,
      statusFilters,
      currentFilter,
      filteredChats,
      getLastMessage,
      formatDate,
      setStatusFilter
    };
  }
}
</script>

<style scoped>
.chat-management {
  padding: 20px;
  margin-top: 60px;
  width: 100%;
}

.page-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #1d2537;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-button {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #6b7a99;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background-color: #f8fafc;
}

.filter-button.active {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  width: 100%;
}

.table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
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

.unread {
  background-color: rgba(74, 108, 247, 0.05);
  font-weight: 500;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 14px;
}

.chat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-tags {
  color: #a0aec0;
  font-size: 12px;
  font-style: italic;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
