import io from 'socket.io-client';
import chatApiClient, { CHAT_ENDPOINTS, configureChatApi } from '@/config/chatApi';

const state = {
  socket: null,
  chats: [],
  currentChat: null,
  loading: false,
  error: null,
  typingUsers: {}, // Track users who are typing
  isTyping: false, // Track if current agent is typing
  processedMessages: {}, // Cache to track processed messages and prevent duplicates
  agents: [] // List of available agents
};

const getters = {
  allChats: (state) => state.chats,
  currentChat: (state) => state.currentChat,
  chatLoading: (state) => state.loading,
  agents: (state) => state.agents
};

const actions = {
  // Initialize socket connection  
  initSocket({ commit, dispatch, rootState }) {
    const token = rootState.auth.token;

    if (!token) return;

    // Configure chat API client with the token
    configureChatApi(token);

    // Connect to socket server with auth token using centralized API URL config
    // Đảm bảo dùng cùng URL với end-user
    const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000';
    console.log('Connecting to socket server at:', SOCKET_URL);

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        userType: 'agent' // Xác định là agent để server phân biệt
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      commit('SET_SOCKET', socket);

      // Join agent room to receive notifications about new chats
      socket.emit('join_agent_room');
      console.log('Joined agent room for notifications');
      
      // Also explicitly join the agent-dashboard room to receive new_user_message events
      socket.emit('join_agent_dashboard');
      console.log('Joined agent-dashboard room for real-time user messages');
    });    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    // Handle authentication errors
    socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
      if (error.requireRelogin) {
        // Force user to re-login
        dispatch('auth/forceRelogin', null, { root: true });
      }
    });
    
    // Handle new user messages coming from the new_user_message event
    socket.on('new_user_message', (data) => {
      console.log('Received new_user_message event:', data);
      
      // Create a unique message identifier based on content, sessionId and approximate timestamp
      const messageContent = typeof data.message === 'string' ? data.message : 
                            (data.message && data.message.content ? data.message.content : '');
      const timestamp = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
      const sessionId = data.sessionId || '';
      
      // Create a unique key for this message
      const messageKey = `${sessionId}-${messageContent}-${Math.floor(timestamp/1000)}`;
      
      // Check if we've already processed this message in the last 2 seconds
      if (state.processedMessages[messageKey]) {
        console.log('Ignoring duplicate message:', messageKey);
        return; // Skip processing this duplicate message
      }
      
      // Mark this message as processed
      commit('ADD_PROCESSED_MESSAGE', messageKey);
      
      // Format message for our store
      const message = {
        chatId: data.chatId,
        sessionId: data.sessionId,
        content: data.message,
        sender: 'user',
        timestamp: data.timestamp || new Date(),
        userInfo: data.userInfo
      };
      
      // Add message to the chat
      commit('ADD_MESSAGE', message);
      
      // If this is the current chat, refresh to get updated data
      // if (state.currentChat && (message.chatId === state.currentChat._id || message.sessionId === state.currentChat.sessionId)) {
      //   dispatch('fetchChatById', state.currentChat._id);
      // }
      
      // Show notification for new message
      dispatch('notification/showNotification', {
        type: 'info',
        message: 'Có tin nhắn mới từ người dùng',
        title: data.userInfo && data.userInfo.name ? `Tin nhắn từ ${data.userInfo.name}` : 'Tin nhắn mới'
      }, { root: true });
      // Refresh the chats list to update unread counts and latest messages
      //dispatch('fetchChats');
    });

    // // Handle new incoming chat messages from user - for compatibility with end-user implementation
    // socket.on('receive_message', (data) => {
    //   console.log('Received user message:', data);

    //   // Format message to match our expected format
    //   const message = {
    //     chatId: data.sessionId || data.chatId,
    //     content: data.content || data.message,
    //     sender: 'user',
    //     timestamp: data.timestamp || new Date()
    //   };

    //   commit('ADD_MESSAGE', message);

    //   // If this is for the current chat, update it
    //   if (state.currentChat && message.chatId === state.currentChat._id) {
    //     dispatch('fetchChatById', message.chatId);
    //   }

    //   // Show notification for new message
    //   dispatch('notification/showNotification', {
    //     type: 'info',
    //     message: 'Có tin nhắn mới từ người dùng'
    //   }, { root: true });
    // });

    // // Legacy support - Handle new incoming chat messages with old event name
    // socket.on('new_message', (message) => {
    //   commit('ADD_MESSAGE', message);

    //   // If this is for the current chat, update it
    //   if (state.currentChat && message.chatId === state.currentChat._id) {
    //     dispatch('fetchChatById', message.chatId);
    //   }

    //   // Show notification for new message
    //   dispatch('notification/showNotification', {
    //     type: 'info',
    //     message: 'New message received'
    //   }, { root: true });
    // });

    // Handle reply received confirmation
    socket.on('reply_sent', (data) => {
      if (state.currentChat && data.chatId === state.currentChat._id) {
        // Add the message to the current chat
        commit('ADD_REPLY_TO_CURRENT', data.message);
        commit('SET_LOADING', false);

        // Show success notification
        dispatch('notification/showNotification', {
          type: 'success',
          message: 'Reply sent successfully'
        }, { root: true });
      }
    });

    // Handle chat updates from other clients
    socket.on('chat_updated', (data) => {
      // Refresh the chat if currently viewing
      if (state.currentChat && data.chatId === state.currentChat._id) {
        dispatch('fetchChatById', data.chatId);
      }
    });

    // Handle user typing notification
    socket.on('user_typing', (data) => {
      if (state.currentChat && data.room === state.currentChat._id) {
        commit('SET_USER_TYPING', {
          userId: data.userId,
          isTyping: data.isTyping
        });

        // Auto-clear typing after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            commit('SET_USER_TYPING', {
              userId: data.userId,
              isTyping: false
            });
          }, 3000);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      commit('SET_ERROR', error.message || 'Connection error occurred');
      commit('SET_LOADING', false);
    });
  },
  // Fetch active agents/users
  async fetchAgents({ commit, rootState }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      // Only get active users (isActive=true)
      const response = await chatApiClient.get(`/api/users?isActive=true`);
      
      if (response.data && response.data.users) {
        commit('SET_AGENTS', response.data.users);
        return response.data.users;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      commit('SET_ERROR', 'Failed to load agents');
      return [];
    } finally {
      commit('SET_LOADING', false);
    }
  },
  // Assign chat to an agent
  async assignChat({ commit, rootState }, { chatId, agentId }) {
    try {
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.post(CHAT_ENDPOINTS.ASSIGN_CHAT(chatId), { 
        agentId 
      });
      
      if (response.data) {
        // Update the current chat with the new assignment info
        commit('UPDATE_CHAT_ASSIGNMENT', {
          chatId,
          agentId
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error assigning chat:', error);
      throw error;
    }
  },
  
  // Disconnect socket
  disconnectSocket({ commit, state }) {
    if (state.socket) {
      state.socket.disconnect();
      commit('SET_SOCKET', null);
    }
  },  // Fetch all chats
  async fetchChats({ commit, rootState }) {
    try {
      commit('SET_LOADING', true);
      console.log('Fetching chats from:', CHAT_ENDPOINTS.GET_CHATS);
      console.log('Auth token available:', !!rootState.auth.token);

      // Make sure chat API is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.get(CHAT_ENDPOINTS.GET_CHATS);
      console.log('API Response:', response);

      // For debugging
      if (response.data && response.data.chats) {
        console.log('Found chats array in response.data.chats with length:', response.data.chats.length);
      } else {
        console.log('Response data format:', response.data);
      }

      // Extract chats from response based on format
      if (Array.isArray(response.data)) {
        // Direct array format
        commit('SET_CHATS', response.data);
      } else if (response.data && Array.isArray(response.data.chats)) {
        // Object with chats array property (matches our API format)
        commit('SET_CHATS', response.data.chats);
      } else {
        // Create mock data for testing if needed
        console.error('Unexpected response format:', response.data);

        // For development: create mock data to test UI
        const mockChats = [
          {
            _id: 'mock1',
            user: { name: 'Test User 1', email: 'test1@example.com' },
            status: 'active',
            messages: [
              { content: 'Hello, I need help with my course', sender: 'user', timestamp: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'mock2',
            user: { name: 'Test User 2', email: 'test2@example.com' },
            status: 'waiting',
            messages: [
              { content: 'When does the next session start?', sender: 'user', timestamp: new Date().toISOString() }
            ],
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];

        commit('SET_CHATS', mockChats);
        commit('SET_ERROR', 'Using mock data - API returned unexpected format');
      }
    } catch (error) {
      commit('SET_ERROR', 'Failed to load chats');
      console.error('Chat fetch error:', error.response || error);
      commit('SET_CHATS', []); // Reset chats to empty array on error
    } finally {
      commit('SET_LOADING', false);
    }
  },  // Fetch a specific chat by ID
  async fetchChatById({ commit, rootState }, chatId) {
    try {
      commit('SET_LOADING', true);
      console.log('Fetching chat details for ID:', chatId);
      console.log('Chat endpoint URL:', CHAT_ENDPOINTS.GET_CHAT_DETAIL(chatId));

      // Ensure the API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }

      const response = await chatApiClient.get(CHAT_ENDPOINTS.GET_CHAT_DETAIL(chatId));
      console.log('Chat API response:', response);

      if (response.data) {
        console.log('Chat data structure:', Object.keys(response.data));

        // Kiểm tra xem phản hồi có đúng định dạng không
        let chatData = response.data;

        // Kiểm tra nếu phản hồi là { chat: {...} } và trích xuất dữ liệu chat
        if (response.data.chat) {
          chatData = response.data.chat;
          console.log('Extracted chat from response.data.chat');
        }

        // Kiểm tra và đảm bảo thuộc tính messages tồn tại
        if (!chatData.messages) {
          console.warn('No messages array in chat data, initializing empty array');
          chatData.messages = [];
        } else {
          console.log('Found messages array with length:', chatData.messages.length);
        }

        // Lưu dữ liệu chat đã xử lý
        commit('SET_CURRENT_CHAT', chatData);
      } else {
        console.error('Empty response data for chat');
        commit('SET_ERROR', 'Empty response from server');
      }
    } catch (error) {
      commit('SET_ERROR', 'Failed to load chat details');
      console.error('Error fetching chat:', error.response || error);
    } finally {
      commit('SET_LOADING', false);
    }
  },  // Send a reply to a chat using socket connection
  async sendReply({ commit, state, rootState }, { chatId, content, sessionId }) {
    try {
      commit('SET_LOADING', true);

      // Check if socket is connected
      if (!state.socket || !state.socket.connected) {
        throw new Error('Socket not connected. Please try again.');
      }

      // Send the reply via socket
      state.socket.emit('send_reply', {
        chatId,
        content,
        sessionId
      });

      // Note: We don't update the UI here as we'll receive the confirmation via socket
      // The 'reply_sent' event handler in initSocket will update the UI

      return { success: true };
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to send reply');
      console.error('Socket reply error:', error);

      // Show error notification
      // Fallback to HTTP if socket fails
      try {
        console.log('Falling back to HTTP request for reply');
        
        // Ensure API client is configured
        if (rootState.auth.token) {
          configureChatApi(rootState.auth.token);
        }
        
        const response = await chatApiClient.post(CHAT_ENDPOINTS.SEND_REPLY(chatId), {
          content
        });

        // Update the current chat with the new message
        if (state.currentChat && state.currentChat._id === chatId) {
          commit('ADD_REPLY_TO_CURRENT', response.data);
        }

        commit('SET_LOADING', false);
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback HTTP reply failed:', fallbackError);
        throw error; // Throw the original socket error
      }
    }
  },
  // Clear the current chat
  clearCurrentChat({ commit }) {
    commit('SET_CURRENT_CHAT', null);
  },
    // Update chat tags
  async updateChatTags({ commit, state, rootState }, { chatId, tags }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.put(CHAT_ENDPOINTS.UPDATE_TAGS(chatId), { tags });
      
      // Update the chat in state
      if (state.currentChat && state.currentChat._id === chatId) {
        state.currentChat.tags = response.data.tags || tags;
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update chat tags');
      console.error('Update chat tags error:', error.response || error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
    // Update chat category
  async updateChatCategory({ commit, state, rootState }, { chatId, categoryId }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.put(CHAT_ENDPOINTS.UPDATE_CATEGORY(chatId), { categoryId });
      
      // Update the chat in state
      if (state.currentChat && state.currentChat._id === chatId) {
        state.currentChat.category = categoryId;
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update chat category');
      console.error('Update chat category error:', error.response || error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
    // Legacy support for status update - will be deprecated
  async updateChatStatus({ commit, state, rootState }, { chatId, status, isTransferredToAgent }) {
    try {
      commit('SET_LOADING', true);
      
      const updateData = { status };
      
      // If isTransferredToAgent is provided, include it in the update
      if (typeof isTransferredToAgent === 'boolean') {
        updateData.isTransferredToAgent = isTransferredToAgent;
      }
      
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.put(CHAT_ENDPOINTS.UPDATE_STATUS(chatId), updateData);
      
      // Update the chat in state
      if (state.currentChat && state.currentChat._id === chatId) {
        if (status) {
          state.currentChat.status = status;
        }
        if (typeof isTransferredToAgent === 'boolean') {
          state.currentChat.isTransferredToAgent = isTransferredToAgent;
        }
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update chat status');
      console.error('Update chat status error:', error.response || error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },  // Update chat priority
  async updateChatPriority({ commit, state, rootState }, { chatId, priority }) {
    try {
      commit('SET_LOADING', true);
      
      // Ensure API client is configured
      if (rootState.auth.token) {
        configureChatApi(rootState.auth.token);
      }
      
      const response = await chatApiClient.put(CHAT_ENDPOINTS.UPDATE_PRIORITY(chatId), { priority });
      
      // Update the chat in state
      if (state.currentChat && state.currentChat._id === chatId) {
        state.currentChat.priority = priority;
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update chat priority');
      console.error('Update chat priority error:', error.response || error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
};

const mutations = {
  SET_SOCKET(state, socket) {
    state.socket = socket;
  },

  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },

  SET_CHATS(state, chats) {
    state.chats = chats;
  },

  SET_CURRENT_CHAT(state, chat) {
    state.currentChat = chat;
  },
  ADD_MESSAGE(state, message) {
    // Find the chat in the list and add the message
    // const chat = state.chats.find(c => 
    //   c._id === message.chatId || 
    //   c.sessionId === message.sessionId);
      
    // if (chat) {
    //   if (!chat.messages) chat.messages = [];
    //   chat.messages.push(message);
    //   chat.updatedAt = new Date().toISOString();
    //   chat.unread = true;
    // }
    
    // Also add to current chat if this message belongs to it
    if (state.currentChat && (
        state.currentChat._id === message.chatId || 
        state.currentChat.sessionId === message.sessionId)) {
      if (!state.currentChat.messages) state.currentChat.messages = [];
      state.currentChat.messages.push(message);
      state.currentChat.updatedAt = new Date().toISOString();
    }
  },
  ADD_REPLY_TO_CURRENT(state, message) {
    if (state.currentChat) {
      if (!state.currentChat.messages) state.currentChat.messages = [];
      state.currentChat.messages.push(message);
      state.currentChat.updatedAt = new Date().toISOString();
    }
  },
  
  ADD_PROCESSED_MESSAGE(state, messageKey) {
    // Add message to processed cache
    state.processedMessages[messageKey] = Date.now();
    
    // Clean up old processed messages (older than 5 seconds)
    const now = Date.now();
    const keysToRemove = [];
    
    // Find keys to remove (messages older than 5 seconds)
    Object.keys(state.processedMessages).forEach(key => {
      if (now - state.processedMessages[key] > 5000) {
        keysToRemove.push(key);
      }
    });
    
    // Remove old keys to prevent memory leaks
    keysToRemove.forEach(key => {
      delete state.processedMessages[key];
    });
  },
  
  SET_AGENTS(state, agents) {
    state.agents = agents;
  },

  UPDATE_CHAT_ASSIGNMENT(state, { chatId, agentId }) {
    const chat = state.chats.find(c => c._id === chatId);
    if (chat) {
      chat.agentId = agentId;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
