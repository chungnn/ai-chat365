<template>
  <div class="chat-detail">
    <div class="chat-header">
      <router-link
        to="/chats"
        class="back-button"
      >
        &larr; {{ t('chatDetail.backToChats') }}
      </router-link>      <h2 class="page-title">
        {{ t('chatDetail.chatWith') }} {{ chatUser }} 
        <span v-if="currentChat && currentChat.ticketId" class="ticket-badge">
          <span class="ticket-id">{{ currentChat.ticketId }}</span>
        </span>
      </h2>
    </div>

    <div class="chat-layout">
      <!-- Left column: Chat messages -->
      <div class="chat-container">
        <div
          v-if="loading"
          class="loading-overlay"
        >
          <p>{{ t('chatDetail.loading') }}</p>
        </div>

        <div
          v-else-if="!currentChat"
          class="empty-state"
        >
          <p>{{ t('chatDetail.chatNotFound') }}</p>
        </div>

        <div
          v-else
          class="chat-content"
        >
          <div
            ref="messagesContainer"
            class="messages-container"
          >
            <div
              v-if="currentChat.messages && currentChat.messages.length === 0"
              class="empty-chat"
            >
              <p>{{ t('chatDetail.noMessages') }}</p>
            </div>
            <div v-else>
              <div 
                v-for="(message, index) in currentChat.messages" 
                :key="index"
                :class="['message', message.role ? `${message.role}-message` : 'user-message']"
              >
                <div class="message-sender">
                  {{ message.role }}
                </div>                <div class="message-bubble">
                  <div class="message-content markdown-content">
                    <template v-if="hasUrl(message.content)">                      <div v-html="renderMarkdown(formatMessageWithoutUrl(message.content))"></div>
                      <url-preview :url="extractUrl(message.content)"></url-preview>
                    </template>
                    <template v-else>
                      <div v-html="renderMarkdown(message.content)"></div>
                    </template>
                  </div>
                  <div class="message-meta">
                    {{ formatTime(message.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="reply-form">
            <textarea 
              v-model="replyMessage" 
              :placeholder="t('chatDetail.typeReply')" 
              class="reply-input"
              @keydown.enter.exact.prevent="sendReply"
            />
            <button 
              class="btn btn-primary send-button" 
              :disabled="!replyMessage.trim() || sending" 
              @click="sendReply"
            >
              {{ sending ? t('chatDetail.sending') : t('chatDetail.send') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right column: Admin tools -->      <div class="admin-tools">
        <div class="tools-section">
          <div class="tools-header">
            <h3 class="tools-title">{{ t('chatDetail.chatTools') }}</h3>
            <button 
              @click="showKnowledgeModal = true" 
              class="btn btn-sm btn-primary distill-button"
              :disabled="!currentChat || !currentChat.messages || currentChat.messages.length === 0"
              :title="t('chatDetail.distillHelp')"
            >
              {{ t('knowledge.distill') }}
            </button>
          </div>
            <!-- Assignment section (updated) -->
          <div class="tool-card">
            <h4 class="tool-header">{{ t('chatDetail.assignChat') }}</h4>            <div class="tool-content">
              <select 
                v-model="selectedAgentId" 
                class="form-control"
                :disabled="assigningChat"
                @change="autoAssignToAgent()"
              >
                <option value="">{{ t('chatDetail.selectAgent') }}</option>
                <option 
                  v-for="user in adminAgents" 
                  :key="user._id" 
                  :value="user._id"
                >
                  {{ user.name || user.email }}
                </option>
              </select>
              <div v-if="assigningChat" class="mt-2 text-center">
                <span class="status-text">{{ t('chatDetail.assigning') }}</span>
              </div>
            </div>
          </div>

          <!-- Classification section (updated to use dynamic categories) -->
          <div class="tool-card">
            <h4 class="tool-header">{{ t('chatDetail.classification') }}</h4>
            <div class="tool-content">
              <select 
                v-model="selectedCategoryId" 
                class="form-control"
                :disabled="savingCategory"
                @change="saveCategory()"
              >
                <option value="">{{ t('chatDetail.selectCategory') }}</option>
                <option 
                  v-for="category in allCategories" 
                  :key="category._id" 
                  :value="category._id"
                >
                  {{ category.name }}
                </option>
              </select>
              <div v-if="savingCategory" class="mt-2 text-center">
                <span class="status-text">{{ t('chatDetail.savingCategory') }}</span>
              </div>              <div class="priority-selector mt-2">
                <span>{{ t('chatDetail.priority') }}</span>
                <div class="priority-options">
                  <button 
                    class="priority-btn low" 
                    :class="{ 'selected': selectedPriority === 'low' }"
                    @click="updatePriority('low')"
                    :disabled="savingPriority"
                  >
                    {{ t('chatDetail.low') }}
                  </button>
                  <button 
                    class="priority-btn medium" 
                    :class="{ 'selected': selectedPriority === 'medium' }"
                    @click="updatePriority('medium')"
                    :disabled="savingPriority"
                  >
                    {{ t('chatDetail.medium') }}
                  </button>
                  <button 
                    class="priority-btn high" 
                    :class="{ 'selected': selectedPriority === 'high' }"
                    @click="updatePriority('high')"
                    :disabled="savingPriority"
                  >
                    {{ t('chatDetail.high') }}
                  </button>
                </div>
                <div v-if="savingPriority" class="mt-2 text-center">
                  <span class="status-text">{{ t('chatDetail.savingPriority') }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tags section (updated with translations) -->
          <div class="tool-card">
            <h4 class="tool-header">{{ t('chatDetail.tags') }}</h4>
            <div class="tool-content">
              <div v-if="selectedTags.length" class="selected-tags">
                <span 
                  v-for="(tag, index) in selectedTags" 
                  :key="index" 
                  :style="{ backgroundColor: tag.color || '#e2e8f0' }"
                  class="tag-item"
                >
                  {{ tag.name }}
                  <button @click.prevent="removeTag(tag)" class="tag-remove">&times;</button>
                </span>
              </div>
              <div class="tags-dropdown">
                <input 
                  type="text" 
                  v-model="tagSearchQuery" 
                  :placeholder="t('chatDetail.searchTags')" 
                  class="tag-search" 
                  @focus="showTagDropdown = true"
                />
                <div v-if="showTagDropdown" class="tags-dropdown-menu">
                  <div 
                    v-for="tag in filteredTags" 
                    :key="tag._id" 
                    class="tag-option"
                    :style="{ borderLeftColor: tag.color || '#e2e8f0' }"
                    @click="addTag(tag)"
                  >
                    {{ tag.name }}
                  </div>
                  <div v-if="filteredTags.length === 0" class="tag-option no-results">
                    {{ t('chatDetail.noMatchingTags') }}
                  </div>
                  <div class="tag-option tag-manage" @click="goToTagManagement">
                    <i class="fas fa-cog"></i> {{ t('chatDetail.manageTags') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      <!-- Knowledge Extraction Modal -->
    <knowledge-extraction-modal
      :show="showKnowledgeModal"
      :chat-id="currentChat?._id || ''"
      :session-id="sessionId"
      @close="showKnowledgeModal = false"
      @saved="onKnowledgeSaved"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUpdated, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UrlPreview from '@/components/common/UrlPreview.vue';
import KnowledgeExtractionModal from '@/components/knowledge/KnowledgeExtractionModal.vue';
import { parseMarkdown } from '@/utils/markdown';

export default {
  name: 'ChatDetailView',
  components: {
    UrlPreview,
    KnowledgeExtractionModal
  },
    setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n(); // Add i18n support
    
    const loading = ref(true);
    const sending = ref(false);
    const replyMessage = ref('');
    const messagesContainer = ref(null);
    const socketJoined = ref(false);
    const assigningChat = ref(false);
    const selectedAgentId = ref('');
      // For category selection
    const allCategories = ref([]);
    const selectedCategoryId = ref('');
    const savingCategory = ref(false);
    
    // For priority selection
    const selectedPriority = ref('');
    const savingPriority = ref(false);
    
    // For tag selection
    const selectedTags = ref([]);
    const allTags = ref([]);
    const tagSearchQuery = ref('');
    const showTagDropdown = ref(false);
    
    // For knowledge extraction
    const showKnowledgeModal = ref(false);
    
    // Method for handling successfully saved knowledge
    const onKnowledgeSaved = (results) => {
      console.log('Knowledge items saved:', results);
      // You could do something with the results here if needed
    };
    
    // Filter tags based on search query
    const filteredTags = computed(() => {
      if (!tagSearchQuery.value) {
        return allTags.value.filter(tag => !selectedTags.value.some(selectedTag => selectedTag._id === tag._id));
      }
      
      const query = tagSearchQuery.value.toLowerCase();
      return allTags.value.filter(tag => 
        tag.name.toLowerCase().includes(query) && 
        !selectedTags.value.some(selectedTag => selectedTag._id === tag._id)
      );
    });
      const currentChat = computed(() => store.getters['chat/currentChat']);
    const socket = computed(() => store.state.chat.socket);
    const agents = computed(() => store.getters['chat/agents']);
    
    // Lọc ra các agent có role là admin
    const adminAgents = computed(() => {
      return agents.value.filter(user => user.role === 'admin');
    });
    
    const chatUser = computed(() => {
      if (!currentChat.value || !currentChat.value.userInfo) {
        return 'Anonymous';
      }
      return currentChat.value.userInfo.name || 'Anonymous';
    });
    
    // Get session ID which is always used as the primary room ID
    const sessionId = computed(() => {
      if (!currentChat.value) return null;
      // Always prioritize the sessionId field and fall back to _id only if necessary
      return currentChat.value.sessionId || currentChat.value._id;
    });    // Join chat room using only sessionId as the room identifier
    const joinChatRoom = () => {
      // Prevent duplicate joins and listeners
      if (socketJoined.value) {
        console.log('Already joined chat room, skipping');
        return true;
      }
      
      if (socket.value && socket.value.connected && sessionId.value) {
        console.log(`Joining chat room with session ID: ${sessionId.value}`);
        
        // Đảm bảo loại bỏ toàn bộ event listeners trước khi thêm mới
        // unregisterEventListeners();
        
        // Join using sessionId as the only room identifier
        socket.value.emit('join_room', sessionId.value);
        
        // Cài đặt các event listeners
        // registerEventListeners();
        
        socketJoined.value = true;
        return true;
      }
      return false;
    };
    
    // Scroll to bottom khi tin nhắn mới được thêm vào (từ vuex store)
    const scrollAfterNewMessage = () => {
      scrollToBottom();
    };
    
    // Watch cho sự thay đổi tin nhắn trong state để tự động scroll
    watch(
      () => store.state.chat.messages,
      (newVal, oldVal) => {
        if (newVal && oldVal && newVal.length > oldVal.length) {
          scrollAfterNewMessage();
        }
      },
      { deep: true }
    );
      // Leave chat room when component unmounts
    const leaveChatRoom = () => {
      if (socket.value && socket.value.connected && sessionId.value) {
        console.log(`Leaving chat room with session ID: ${sessionId.value}`);
        // Only use sessionId as the room identifier
        socket.value.emit('leave_room', sessionId.value);
        socketJoined.value = false;
        return true;
      }
      return false;
    };
      // URL handling methods
    const hasUrl = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return urlRegex.test(text);
    };
    
    const extractUrl = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = text.match(urlRegex);
      return matches ? matches[0] : '';
    };
      const formatMessageWithoutUrl = (text) => {
      if (!text) return '';
      return text.replace(/(https?:\/\/[^\s]+)/g, '');
    };
      // Parse markdown content - wrapper for the imported function
    const renderMarkdown = (text) => {
      return parseMarkdown(text || '');
    };
    
    // Scroll to bottom of messages container
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        setTimeout(() => {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }, 100);
      }
    };
    
    // Format timestamp
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
      // Agent assignment functions
    const fetchAgents = async () => {
      try {
        await store.dispatch('chat/fetchAgents');
      } catch (error) {
        console.error('Failed to fetch agents', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load agents list'
        });
      }
    };
      // Auto-assign when dropdown value changes
    const autoAssignToAgent = async () => {
      if (!selectedAgentId.value || assigningChat.value) return;
      
      try {
        assigningChat.value = true;
        
        await store.dispatch('chat/assignChat', {
          chatId: route.params.id,
          agentId: selectedAgentId.value
        });
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Chat assigned successfully'
        });
      } catch (error) {
        console.error('Failed to assign chat', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to assign chat'
        });
        
        // Reset to the previous value if there was an error
        if (currentChat.value && currentChat.value.agentId) {
          selectedAgentId.value = currentChat.value.agentId;
        } else {
          selectedAgentId.value = '';
        }
      } finally {
        assigningChat.value = false;
      }
    };
      // Set the selected agent when the chat data is loaded
    const setInitialAssignedAgent = () => {
      if (currentChat.value && currentChat.value.agentId) {
        selectedAgentId.value = currentChat.value.agentId;
      }
    };

    // Category methods
    const fetchCategories = async () => {
      try {
        const categories = await store.dispatch('categories/fetchCategories');
        allCategories.value = categories;
      } catch (error) {
        console.error('Failed to fetch categories', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load categories'
        });
      }
    };

    const setInitialCategory = () => {
      if (currentChat.value && currentChat.value.category) {
        selectedCategoryId.value = currentChat.value.category;
      }
    };

    const setInitialPriority = () => {
      if (currentChat.value && currentChat.value.priority) {
        selectedPriority.value = currentChat.value.priority;
      } else {
        // Default to medium if no priority is set
        selectedPriority.value = 'medium';
      }
    };

    const saveCategory = async () => {
      if (savingCategory.value) return;
      
      try {
        savingCategory.value = true;
        
        // Call API to save category
        await store.dispatch('chat/updateChatCategory', {
          chatId: route.params.id,
          categoryId: selectedCategoryId.value
        });
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Category updated successfully'
        });
      } catch (error) {
        console.error('Failed to update category', error);
        
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to update category'
        });
        
        // Reset to the previous value if there was an error
        if (currentChat.value && currentChat.value.category) {
          selectedCategoryId.value = currentChat.value.category;
        } else {
          selectedCategoryId.value = '';
        }
      } finally {
        savingCategory.value = false;
      }
    };

    const updatePriority = async () => {
      if (savingPriority.value) return;
      
      try {
        savingPriority.value = true;
        
        // Call API to save category
        await store.dispatch('chat/updateChatPriority', {
          chatId: route.params.id,
          priority: selectedPriority.value
        });
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Priority updated successfully'
        });
      } catch (error) {
        console.error('Failed to update priority', error);
        
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to update priority'
        });
        
        // Reset to the previous value if there was an error
        if (currentChat.value && currentChat.value.priority) {
          selectedPriority.value = currentChat.value.priority;
        } else {
          selectedPriority.value = '';
        }
      } finally {
        savingPriority.value = false;
      }
    };

    // Tags methods
    const addTag = async (tag) => {
      // Don't add duplicate tags
      if (selectedTags.value.some(t => t._id === tag._id)) {
        return;
      }
      
      selectedTags.value.push(tag);
      tagSearchQuery.value = ''; // Clear search after adding
      
      try {
        await saveChatTags();
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: `Tag "${tag.name}" added to chat`
        });
      } catch (error) {
        console.error('Failed to save tags', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to add tag'
        });
      }
    };
    
    const removeTag = async (tag) => {
      selectedTags.value = selectedTags.value.filter(t => t._id !== tag._id);
      
      try {
        await saveChatTags();
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: `Tag "${tag.name}" removed from chat`
        });
      } catch (error) {
        console.error('Failed to remove tag', error);
        store.dispatch('notification/showNotification', {
          type: 'error', 
          message: 'Failed to remove tag'
        });
      }
    };
    
    const saveChatTags = async () => {
      try {
        const tagIds = selectedTags.value.map(tag => tag._id);
        await store.dispatch('chat/updateChatTags', {
          chatId: route.params.id,
          tags: tagIds
        });
        return true;
      } catch (error) {
        console.error('Error saving chat tags:', error);
        throw error;
      }
    };
    
    const fetchTags = async () => {
      try {
        const tags = await store.dispatch('tags/fetchTags');
        allTags.value = tags;
      } catch (error) {
        console.error('Failed to fetch tags', error);
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load tags'
        });
      }
    };
    
    const goToTagManagement = () => {
      router.push('/tags');
      showTagDropdown.value = false;
    };
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showTagDropdown.value && !event.target.closest('.tags-dropdown')) {
        showTagDropdown.value = false;
      }
    };
    
    // Send reply to chat
    const sendReply = async () => {
      if (!replyMessage.value.trim() || sending.value) return;
      
      try {
        sending.value = true;
        
        const payload = {
          chatId: route.params.id,
          content: replyMessage.value,
          sessionId: sessionId.value // Add sessionId for compatibility with end-user
        };
        
        // Lưu tin nhắn để hiển thị ngay lập tức
        const newMessage = {
          content: replyMessage.value,
          role: 'admin',
          timestamp: new Date().toISOString()
        };
        
        // Thêm tin nhắn vào state local trước khi gửi đến server
        if (currentChat.value && Array.isArray(currentChat.value.messages)) {
          currentChat.value.messages.push(newMessage);
        }
        
        // Ensure we're in the correct room before sending
        if (!socketJoined.value) {
          joinChatRoom();
        }
          // Gửi tin nhắn đến server
        await store.dispatch('chat/sendReply', payload);
        
        // Clear input and scroll to bottom
        replyMessage.value = '';
        scrollToBottom();
        
        // Show success notification
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Reply sent successfully'
        });
      } catch (error) {
        console.error('Failed to send reply', error);
        
        // Nếu gửi thất bại, xóa tin nhắn tạm khỏi giao diện
        if (currentChat.value && Array.isArray(currentChat.value.messages)) {
          currentChat.value.messages.pop();
        }
        
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to send reply'
        });
      } finally {
        sending.value = false;
      }
    };
      // Fetch chat on mount
    onMounted(async () => {
      try {
        await store.dispatch('chat/fetchChatById', route.params.id);
        
        if (currentChat.value) {
          // Load chat tags if available
          if (currentChat.value.tags && Array.isArray(currentChat.value.tags)) {
            selectedTags.value = currentChat.value.tags;
          }
          
          // Fetch all available tags, categories and agents
          await fetchTags();
          await fetchCategories();
          await fetchAgents();
          
          // Set the initially assigned agent and category if there is one
          setInitialAssignedAgent();
          setInitialCategory();
          setInitialPriority();
          
          // Join chat room after data is loaded
          setTimeout(() => {
            joinChatRoom();
          }, 500);
          
          // Add click outside listener for tag dropdown
          document.addEventListener('click', handleClickOutside);
        } else {
          // Chat not found, redirect to chat list
          router.push('/chats');
          
          store.dispatch('notification/showNotification', {
            type: 'error',
            message: 'Chat not found'
          });
        }
      } catch (error) {
        console.error('Failed to load chat', error);
        
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to load chat details'
        });
      } finally {
        loading.value = false;
      }
    });
    
    // Scroll to bottom when messages change
    watch(
      () => currentChat.value?.messages,
      () => scrollToBottom(),
      { deep: true }
    );
      // Clean up when component unmounts
    onUnmounted(() => {
      leaveChatRoom();
      store.dispatch('chat/clearCurrentChat');
      document.removeEventListener('click', handleClickOutside);
    });
    
    onUpdated(() => {
      scrollToBottom();
    });      return {
      loading,
      sending,
      currentChat,
      chatUser,
      replyMessage,
      messagesContainer,
      formatTime,
      sendReply,
      // URL handling methods
      hasUrl,
      extractUrl,
      formatMessageWithoutUrl,
      
      //format markdown content
      renderMarkdown,
      // Tag-related data and methods
      selectedTags,
      allTags,
      tagSearchQuery,
      showTagDropdown,
      filteredTags,
      addTag,
      removeTag,
      goToTagManagement,
      // Agent assignment
      agents,
      adminAgents,
      selectedAgentId,
      assigningChat,
      autoAssignToAgent,
      // Category-related data and methods
      allCategories,
      selectedCategoryId,
      savingCategory,
      saveCategory,
      // Priority
      selectedPriority,
      savingPriority,
      updatePriority,
      // Knowledge extraction
      showKnowledgeModal,
      onKnowledgeSaved,
      // Session ID for socket communication
      sessionId,
      // Add the t function for i18n
      t
    };
  }
};
</script>

<style scoped>
.chat-detail {
  padding: 20px;
  margin-top: 60px;
}

.chat-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.back-button {
  padding: 8px 16px;
  background-color: #f1f5f9;
  color: #334155;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background-color: #e2e8f0;
}

.page-title {
  font-size: 20px;
  margin: 0;
  color: #1d2537;
  display: flex;
  align-items: center;
}

.ticket-badge {
  margin-left: 10px;
  padding: 3px 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: normal;
}

.ticket-id {
  color: #4a6cf7;
  font-weight: 500;
}

/* Two-column layout */
.chat-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 150px);
}

/* Left column styles - Chat container */
.chat-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 3; /* 75% of the available space */
}

/* Right column styles - Admin tools */
.admin-tools {
  flex: 1; /* 25% of the available space */
  border-left: 2px solid #e2e8f0;
  padding-left: 15px;
  margin-left: 5px;
  position: relative;
  background-color: #f8fafc;
  border-radius: 8px;
  box-shadow: -3px 0px 10px rgba(0, 0, 0, 0.03);
}

.admin-tools:before {
  content: '';
  position: absolute;
  left: -6px;
  top: 30px;
  height: 40px;
  width: 10px;
  background-color: #4a6cf7;
  border-radius: 5px;
}

.tools-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 5px;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px dashed #cbd5e1;
  padding-bottom: 8px;
}

.tools-title {
  font-size: 16px;
  margin: 0;
  color: #1d2537;
}

.distill-button {
  font-size: 12px;
  padding: 4px 8px;
}

.tool-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-bottom: 16px;
}

.tool-header {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.priority-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.priority-options {
  display: flex;
  gap: 5px;
}

.priority-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.priority-btn.low {
  background-color: #e2f2e2;
  color: #27662d;
}

.priority-btn.low.selected {
  background-color: #27662d;
  color: white;
  font-weight: bold;
}

.priority-btn.medium {
  background-color: #fef3c7;
  color: #92400e;
}

.priority-btn.medium.selected {
  background-color: #92400e;
  color: white;
  font-weight: bold;
}

.priority-btn.high {
  background-color: #fee2e2;
  color: #b91c1c;
}

.priority-btn.high.selected {
  background-color: #b91c1c;
  color: white;
  font-weight: bold;
}

.mt-2 {
  margin-top: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-secondary {
  background-color: #64748b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

/* Tag styles */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.tag-item {
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  color: #333;
  margin-right: 2px;
}

.tag-remove {
  background: none;
  border: none;
  font-size: 14px;
  margin-left: 5px;
  cursor: pointer;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
}

.tags-dropdown {
  position: relative;
}

.tag-search {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.tags-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.tag-option {
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.tag-option:hover {
  background-color: #f7fafc;
}

.tag-manage {
  border-top: 1px solid #e2e8f0;
  color: #4a6cf7;
}

.no-results {
  color: #cbd5e1;
  font-style: italic;
}

/* Loading states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7a99;
}

/* Chat content */
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6b7a99;
}

.message {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.user-message {
  align-items: flex-start;
}

.admin-message, .assistant-message, .agent-message {
  align-items: flex-end;
}

.message-sender {
  font-size: 12px;
  margin-bottom: 4px;
  font-weight: 500;
  color: #64748b;
}

.message-bubble {
  max-width: 85%;
  border-radius: 16px;
  padding: 12px 16px;
  position: relative;
}

.user-message .message-bubble {
  background-color: #f1f5f9;
  color: #334155;
  border-bottom-left-radius: 4px;
}

.admin-message .message-bubble {
  background-color: #4a6cf7;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant-message .message-bubble {
  background-color: #6b7dd8;
  color: white;
  border-bottom-right-radius: 4px;
}

.agent-message .message-bubble {
  background-color: #3f9a9d;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-content {
  word-wrap: break-word;
}

/* Markdown content styles */
.markdown-content {
  line-height: 1;
}

.markdown-content code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 10px 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  display: block;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h1 {
  font-size: 1.5em;
}

.markdown-content h2 {
  font-size: 1.3em;
}

.markdown-content h3 {
  font-size: 1.1em;
}

.markdown-content ul, 
.markdown-content ol {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-content li {
  margin-bottom: 2px;
}

.markdown-content ul, 
.markdown-content ol {
  padding-left: 20px;
  margin: 4px 0;
}

.markdown-content a {
  color: #4a6cf7;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.message-meta {
  font-size: 12px;
  margin-top: 6px;
  text-align: right;
  opacity: 0.8;
}

.reply-form {
  display: flex;
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  gap: 10px;
}

.reply-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 12px;
  min-height: 60px;
  max-height: 200px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.send-button {
  align-self: flex-end;
  padding: 12px 24px;
  height: fit-content;
}

@media (max-width: 1024px) {
  .chat-layout {
    flex-direction: column;
    height: auto;
  }
  
  .chat-container {
    max-width: 100%;
    height: 500px;
  }
  
  .admin-tools {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .message-bubble {
    max-width: 90%;
  }
}
</style>
