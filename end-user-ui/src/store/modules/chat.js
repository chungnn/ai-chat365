import axios from '@/plugins/axios';
import { socket } from '@/plugins/socket';

const state = {
  messages: [],
  chatHistory: [],
  isConnected: false,
  isTyping: false,
  error: null,
  loading: false,
  currentChatId: null,
  ticketId: null, // Store the ticket ID for helpdesk
  status: 'open', // Track ticket status (open, in-progress, waiting, resolved, closed)  priority: 'medium', // Track ticket priority (low, medium, high, urgent)
  category: null, // Track ticket category
  assignedTo: null, // Track assigned agent
  activeAgents: [], // Track active agents in the chat
  typingUsers: {}, // Track users who are typing
  suggestHumanTransfer: false, // Track if human transfer is suggested
  isTransferredToAgent: false, // Track if chat is transferred to human agent
  waitingForAgent: false, // Track if waiting for agent response
  isTransferring: false, // Track if transfer is in progress
  resolutionTime: 0, // Track resolution time in minutes
  customerSatisfaction: null // Track customer satisfaction rating
};

const getters = {
  allMessages: state => state.messages,
  chatHistory: state => state.chatHistory,
  isConnected: state => state.isConnected,
  isTyping: state => state.isTyping,
  isLoading: state => state.loading,
  error: state => state.error,
  currentChatId: state => state.currentChatId,
  getSessionId: state => state.currentChatId || localStorage.getItem('chat_session_id'),
  activeAgents: state => state.activeAgents,
  typingUsers: state => state.typingUsers,
  suggestHumanTransfer: state => state.suggestHumanTransfer,
  isTransferredToAgent: state => state.isTransferredToAgent,
  waitingForAgent: state => state.waitingForAgent,
  isTransferring: state => state.isTransferring,
  
  // Getters for helpdesk functionality
  getTicketId: state => state.ticketId,
  getStatus: state => state.status,
  getPriority: state => state.priority,
  getCategory: state => state.category,
  getAssignedTo: state => state.assignedTo,
  getResolutionTime: state => state.resolutionTime,
  getCustomerSatisfaction: state => state.customerSatisfaction,
  isResolved: state => state.status === 'resolved' || state.status === 'closed'
};

const mutations = {
  SET_MESSAGES(state, messages) {
    state.messages = messages;
  },  ADD_MESSAGE(state, message) {
    state.messages.push(message);
    // Emit an event that can be listened to for scrolling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat-message-added', { detail: message }));
    }
  },
  SET_CHAT_HISTORY(state, chats) {
    state.chatHistory = chats;
  },
  SET_CONNECTION_STATUS(state, status) {
    state.isConnected = status;
  },
  SET_TYPING_STATUS(state, status) {
    state.isTyping = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_CURRENT_CHAT_ID(state, id) {
    state.currentChatId = id;
  },
  CLEAR_MESSAGES(state) {
    state.messages = [];
  },
  ADD_ACTIVE_AGENT(state, agent) {
    if (!state.activeAgents.some(a => a.agentId === agent.agentId)) {
      state.activeAgents.push(agent);
    }
  },
  REMOVE_ACTIVE_AGENT(state, agentId) {
    state.activeAgents = state.activeAgents.filter(a => a.agentId !== agentId);
  },
  SET_USER_TYPING(state, { userId, isTyping }) {
    if (isTyping) {
      state.typingUsers[userId] = new Date();
    } else {
      delete state.typingUsers[userId];
    }
  },
  SET_SUGGEST_HUMAN_TRANSFER(state, suggestion) {
    state.suggestHumanTransfer = suggestion;
  },
  // Mutations for helpdesk functionality
  SET_TICKET_ID(state, id) {
    state.ticketId = id;
  },
  SET_STATUS(state, status) {
    state.status = status;
  },
  SET_PRIORITY(state, priority) {
    state.priority = priority;
  },
  SET_CATEGORY(state, category) {
    state.category = category;
  },
  SET_ASSIGNED_TO(state, agent) {
    state.assignedTo = agent;
  },
  SET_RESOLUTION_TIME(state, time) {
    state.resolutionTime = time;
  },
  SET_CUSTOMER_SATISFACTION(state, satisfaction) {
    state.customerSatisfaction = satisfaction;
  },
  // Add new mutations for agent interactions
  SET_TRANSFERRED_TO_AGENT(state, status) {
    state.isTransferredToAgent = status;
  },
  SET_WAITING_FOR_AGENT(state, status) {
    state.waitingForAgent = status;
  },
  SET_TRANSFERRING(state, status) {
    state.isTransferring = status;
  },
  SET_AGENT_TYPING(state, { agentId, isTyping }) {
    // Create a copy of the current typing users object
    const updatedTypingUsers = { ...state.typingUsers };
    
    if (isTyping) {
      updatedTypingUsers[`agent-${agentId}`] = new Date();
    } else {
      delete updatedTypingUsers[`agent-${agentId}`];
    }
    
    state.typingUsers = updatedTypingUsers;
  }
};

const actions = {
  // Add a message received from Socket.io
  addMessageFromSocket({ commit }, messageData) {
    const message = {
      sender: messageData.role,
      content: messageData.content,
      timestamp: messageData.timestamp || new Date(),
      agentName: messageData.agentName
    };
    commit('ADD_MESSAGE', message);
  },
  
  // Add a system message
  addSystemMessage({ commit }, messageData) {
    const message = {
      sender: 'system',
      content: messageData.message,
      timestamp: messageData.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
    
    // Update waiting for agent status if included
    if (messageData.waitingForAgent !== undefined) {
      commit('SET_WAITING_FOR_AGENT', messageData.waitingForAgent);
    }
  },
  
  // Set user typing status from socket event
  setUserTyping({ commit }, data) {
    commit('SET_USER_TYPING', {
      userId: data.userId,
      isTyping: data.isTyping
    });
    
    // Auto-clear typing after 2 seconds
    if (data.isTyping) {
      setTimeout(() => {
        commit('SET_USER_TYPING', {
          userId: data.userId,
          isTyping: false
        });
      }, 2000);
    }
  },
  
  // Set agent typing status from socket event
  setAgentTyping({ commit }, data) {
    commit('SET_AGENT_TYPING', {
      agentId: data.agentId,
      isTyping: data.isTyping
    });
    
    // Auto-clear typing after 3 seconds
    if (data.isTyping) {
      setTimeout(() => {
        commit('SET_AGENT_TYPING', {
          agentId: data.agentId,
          isTyping: false
        });
      }, 3000);
    }
  },
  
  // Mark chat as resolved from socket event
  setChatResolved({ commit }, data) {
    // Add system message about resolution
    const message = {
      sender: 'system',
      content: `Chat resolved by agent. ${data.resolution || ''}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
  },
  
  // Handle suggestion for human transfer
  setSuggestHumanTransfer({ commit }, data) {
    commit('SET_SUGGEST_HUMAN_TRANSFER', true);
    
    // Add system message about suggested transfer
    const message = {
      sender: 'system',
      content: `${data.message || 'AI suggests transferring to a human agent for better assistance.'}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
  },
  
  // Handle agent joining chat
  agentJoinedChat({ commit }, agentData) {
    // Add system message that an agent has joined
    const message = {
      sender: 'system',
      content: `${agentData.agentName || 'Nhân viên tư vấn'} đã tham gia cuộc trò chuyện.`,
      timestamp: agentData.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
    
    // Add agent to active agents list
    commit('ADD_ACTIVE_AGENT', {
      agentId: agentData.agentId,
      agentName: agentData.agentName
    });
    
    // Mark chat as transferred to agent
    commit('SET_TRANSFERRED_TO_AGENT', true);
    
    // No longer waiting for agent
    commit('SET_WAITING_FOR_AGENT', false);
  },
  
  // Handle agent leaving chat
  agentLeftChat({ commit, state }, agentData) {
    // Add system message that agent has left
    const message = {
      sender: 'system',
      content: `${agentData.agentName || 'Nhân viên tư vấn'} đã rời khỏi cuộc trò chuyện.`,
      timestamp: agentData.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
    
    // Remove agent from active agents
    commit('REMOVE_ACTIVE_AGENT', agentData.agentId);
    
    // If no more agents, set transferred to false
    if (state.activeAgents.length === 0) {
      commit('SET_TRANSFERRED_TO_AGENT', false);
    }
  },
  
  // Add a message received from Socket.io
  addMessageFromSocket({ commit }, messageData) {
    const message = {
      sender: messageData.role,
      content: messageData.content,
      timestamp: messageData.timestamp || new Date(),
      agentName: messageData.agentName
    };
    commit('ADD_MESSAGE', message);
  },
  
  // Add a system message
  addSystemMessage({ commit }, messageData) {
    const message = {
      sender: 'system',
      content: messageData.message,
      timestamp: messageData.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
    
    // Update waiting for agent status if included
    if (messageData.waitingForAgent !== undefined) {
      // We could add this to state if needed
      console.log('[CHAT DEBUG] Waiting for agent:', messageData.waitingForAgent);
    }
  },
  
  // Set user typing status from socket event
  setUserTyping({ commit }, data) {
    commit('SET_USER_TYPING', {
      userId: data.userId,
      isTyping: data.isTyping
    });
    
    // Auto-clear typing after 2 seconds
    if (data.isTyping) {
      setTimeout(() => {
        commit('SET_USER_TYPING', {
          userId: data.userId,
          isTyping: false
        });
      }, 2000);
    }
  },
    // Mark chat as resolved from socket event
  setChatResolved({ commit }, data) {
    // Add system message about resolution
    const message = {
      sender: 'system',
      content: `Chat resolved by agent. ${data.resolution || ''}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
  },
  
  // Handle suggestion for human transfer
  setSuggestHumanTransfer({ commit }, data) {
    commit('SET_SUGGEST_HUMAN_TRANSFER', true);
    
    // Add system message about suggested transfer
    const message = {
      sender: 'system',
      content: `${data.message || 'AI suggests transferring to a human agent for better assistance.'}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
  },  async initSession({ commit, dispatch }) {
    try {
      // Kiểm tra xem đã có sessionId trong localStorage chưa
      const savedSessionId = localStorage.getItem('chat_session_id');
      const savedPseudoId = localStorage.getItem('pseudo_id');
      let response;
      
      if (savedSessionId) {
        // Nếu có sẵn sessionId, gửi lên server để validate và lấy lịch sử chat
        response = await axios.post('/chat/session', { sessionId: savedSessionId, pseudoId: savedPseudoId });
      } else {
        // Nếu chưa có, tạo mới sessionId
        response = await axios.post('/chat/session', { pseudoId: savedPseudoId });
      }
      
      if (response.data && response.data.sessionId) {
        // Lưu sessionId vào localStorage
        localStorage.setItem('chat_session_id', response.data.sessionId);
        
        // Cập nhật sessionId hiện tại trong store
        commit('SET_CURRENT_CHAT_ID', response.data.sessionId);
        
        // Connect socket and join the room for this chat session
        if (socket) {
          if (!socket.connected) {
            socket.connect();
          }
          socket.emit('join_room', response.data.sessionId);
          console.log(`[SOCKET DEBUG] Joined room: ${response.data.sessionId}`);
        }
        
        // Nếu là session mới hoàn toàn, set các tin nhắn ban đầu
        if (!response.data.isExistingSession && response.data.messages && response.data.messages.length > 0) {
          commit('SET_MESSAGES', response.data.messages.map(msg => ({
            sender: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date()
          })));
        }
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể khởi tạo phiên chat');
      throw error;
    }
  },
  async sendMessage({ commit, state, getters }, messageContent) {
    commit('SET_LOADING', true);
    try {
      // Lấy sessionId từ localStorage hoặc state
      const sessionId = getters.getSessionId;
      
      // Đảm bảo có sessionId trước khi gửi tin nhắn
      if (!sessionId) {
        throw new Error('Không tìm thấy sessionId. Vui lòng khởi tạo lại cuộc trò chuyện.');
      }
      
      // Thêm tin nhắn người dùng vào danh sách tin nhắn
      const userMessage = {
        sender: 'user',
        content: messageContent,
        timestamp: new Date()
      };
      commit('ADD_MESSAGE', userMessage);
      
      // Sử dụng socket trực tiếp thay vì thông qua getCurrentInstance
      
      // Send typing status via socket
      const userId = localStorage.getItem('user_id') || 'anonymous';
      if (socket.connected) {
        console.log('Sending typing status via socket');
        socket.emit('typing', {
          room: sessionId,
          userId: userId,
          isTyping: true
        });
      }

      // Hiển thị trạng thái đang nhập
      commit('SET_TYPING_STATUS', true);
    
      if (socket.connected) {
        console.log('Calling sendMessage with:', messageContent, sessionId);
        
        const messageData = {
          sessionId,
          message: messageContent,
          userId: userId,
          timestamp: new Date()
        };
        
        socket.emit('send_message', messageData);
        console.log('Message sent via socket:', messageData);
        
        setTimeout(() => {
          commit('SET_TYPING_STATUS', false);
        }, 500); // Short delay to ensure the UI shows typing indication
      } else {
        console.error('Socket connection not available: socket is not connected');
        throw new Error('Socket connection not available');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error.message);
      commit('SET_ERROR', error.message || 'Không thể gửi tin nhắn');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchChatHistory({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/chat/history');
      commit('SET_CHAT_HISTORY', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải lịch sử chat');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },  async fetchChatById({ commit, getters }, chatId) {
    commit('SET_LOADING', true);
    try {
      const sessionId = chatId || getters.getSessionId;
      if (!sessionId) {
        throw new Error('Không tìm thấy ID cuộc trò chuyện');
      }
      
      commit('SET_CURRENT_CHAT_ID', sessionId);
      
      // Join room via socket.io for this chat
      if (socket && socket.connected) {
        socket.emit('join_room', sessionId);
        console.log(`[SOCKET DEBUG] Joined room: ${sessionId}`);
      }
      
      const response = await axios.get(`/chat/${sessionId}/history`);
      
      if (response.data && response.data.chat && response.data.chat.messages) {
        // Lọc tin nhắn hệ thống và chỉ hiển thị tin nhắn user và assistant
        const filteredMessages = response.data.chat.messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            sender: msg.role === 'user' ? 'user' : (msg.role === 'agent' ? 'agent' : 'assistant'),
            content: msg.content,
            timestamp: msg.timestamp || new Date(response.data.chat.createdAt),
            agentName: msg.agentName || null
          }));
          
        commit('SET_MESSAGES', filteredMessages);
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể tải cuộc trò chuyện');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },  async createNewChat({ commit, state }) {
    commit('CLEAR_MESSAGES');
    commit('SET_CURRENT_CHAT_ID', null);
    localStorage.removeItem('chat_session_id');
    
    // Leave any previous chat room
    if (socket && socket.connected && state.currentChatId) {
      socket.emit('leave_room', state.currentChatId);
      console.log(`[SOCKET DEBUG] Left room: ${state.currentChatId}`);
    }
  },  async initChat({ commit, dispatch, getters }) {
    commit('SET_LOADING', true);
    try {
      // Kiểm tra xem đã có sessionId trong localStorage chưa
      const savedSessionId = getters.getSessionId;
      
      // Ensure socket connection
      if (socket && !socket.connected) {
        console.log('[SOCKET DEBUG] Initiating socket connection from initChat');
        socket.connect();
        
        // Đợi 500ms để đảm bảo kết nối socket đã được thiết lập
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      let result;
      
      // Nếu chưa có sessionId hoặc không tìm thấy cuộc trò chuyện hiện tại
      if (!savedSessionId) {
        console.log('[CHAT DEBUG] No existing session, creating new one');
        // Tạo một phiên chat mới
        result = await dispatch('initSession');
      } else {
        console.log(`[CHAT DEBUG] Found existing session: ${savedSessionId}`);
        try {
          // Nếu đã có sessionId, sử dụng lại
          result = await dispatch('fetchChatById', savedSessionId);
        } catch (fetchError) {
          console.warn('[CHAT DEBUG] Error fetching existing chat, creating new session', fetchError);
          // Nếu không thể tải tin nhắn cũ (session có thể đã hết hạn), tạo mới
          localStorage.removeItem('chat_session_id');
          result = await dispatch('initSession');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Lỗi khởi tạo chat:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Không thể khởi tạo cuộc trò chuyện');
      
      // Thử tạo phiên mới nếu có lỗi
      try {
        console.log('[CHAT DEBUG] Trying to create a new session after error');
        localStorage.removeItem('chat_session_id');
        return await dispatch('initSession');
      } catch (retryError) {
        console.error('Lỗi khi thử khởi tạo lại chat:', retryError);
        throw error; // Vẫn giữ lỗi ban đầu
      }
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateUserInfo({ commit, state }, userInfo) {
    commit('SET_LOADING', true);
    try {
      // Lấy sessionId hiện tại từ state hoặc localStorage
      const sessionId = state.currentChatId || localStorage.getItem('chat_session_id');
      
      if (!sessionId) {
        throw new Error('Không tìm thấy phiên chat');
      }
      
      const response = await axios.put(`/chat/${sessionId}/user-info`, userInfo);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể cập nhật thông tin liên hệ');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async transferToAgent({ commit, state }, reason = 'Người dùng yêu cầu') {
    commit('SET_LOADING', true);
    try {
      // Lấy sessionId hiện tại từ state hoặc localStorage
      const sessionId = state.currentChatId || localStorage.getItem('chat_session_id');
      
      if (!sessionId) {
        throw new Error('Không tìm thấy phiên chat');
      }
      
      const response = await axios.post(`/chat/${sessionId}/transfer`, { reason });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể chuyển cuộc trò chuyện tới nhân viên tư vấn');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },  disconnect({ commit, state }) {
    if (socket && socket.connected) {
      if (state.currentChatId) {
        socket.emit('leave_room', state.currentChatId);
        console.log(`[SOCKET DEBUG] Left room: ${state.currentChatId}`);
      }
      socket.disconnect();
      console.log('[SOCKET DEBUG] Socket manually disconnected');
      commit('SET_CONNECTION_STATUS', false);
    }
  },
  // HELPDESK ACTIONS
  
  // Submit customer satisfaction rating
  async submitSatisfaction({ commit, state }, satisfactionData) {
    commit('SET_LOADING', true);
    try {
      if (!state.ticketId) {
        throw new Error('Không tìm thấy mã ticket');
      }
      
      const response = await axios.post(`/ticket/${state.ticketId}/satisfaction`, satisfactionData);
      commit('SET_CUSTOMER_SATISFACTION', satisfactionData);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Không thể gửi đánh giá');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Handle ticket status update from socket event
  updateTicketStatus({ commit }, data) {
    commit('SET_STATUS', data.status);
    
    // Add system message about status change
    const message = {
      sender: 'system',
      content: `Trạng thái ticket đã được cập nhật thành: ${data.status}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
    
    // If status is resolved, show feedback dialog
    if (data.status === 'resolved') {
      // This will be picked up by the component to show the feedback dialog
      return { showFeedback: true };
    }
    
    return { success: true };
  },
  
  // Handle ticket assigned to agent from socket event
  ticketAssigned({ commit }, data) {
    commit('SET_ASSIGNED_TO', data.agentName);
    
    // Add system message about assignment
    const message = {
      sender: 'system',
      content: `Ticket đã được gán cho ${data.agentName}`,
      timestamp: data.timestamp || new Date()
    };
    commit('ADD_MESSAGE', message);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};