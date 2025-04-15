import io from 'socket.io-client';
import store from '@/store';

// Tạo một instance socket.io
const socket = io(process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
});

// Socket event listeners
socket.on('connect', () => {
  console.log('[SOCKET DEBUG] Connected to server with ID:', socket.id);
  
  // Join user's own room if there's an active session
  const sessionId = store.getters['chat/getSessionId'];
  if (sessionId) {
    socket.emit('join_room', sessionId);
    console.log(`[SOCKET DEBUG] Joined room: ${sessionId}`);
  }
});

socket.on('disconnect', () => {
  console.log('[SOCKET DEBUG] Socket disconnected - connection lost with server');
});

socket.on('connect_error', (error) => {
  console.error('[SOCKET DEBUG] Socket connection error:', error);
});

socket.on('receive_message', (data) => {
  console.log('[SOCKET DEBUG] Received message from server:', JSON.stringify(data, null, 2));
  
  // Add message to chat store
  store.dispatch('chat/addMessageFromSocket', data);
});

socket.on('agent_message', (data) => {
  console.log('[SOCKET DEBUG] Received agent message:', JSON.stringify(data, null, 2));
  
  // Add agent message to chat store
  store.dispatch('chat/addMessageFromSocket', {
    ...data,
    role: 'agent'
  });
});

socket.on('agent_joined', (data) => {
  console.log('[SOCKET DEBUG] Agent joined the chat:', JSON.stringify(data, null, 2));
  store.dispatch('chat/agentJoinedChat', data);
});

socket.on('agent_left', (data) => {
  console.log('[SOCKET DEBUG] Agent left the chat:', JSON.stringify(data, null, 2));
  store.dispatch('chat/agentLeftChat', data);
});

socket.on('agent_typing', (data) => {
  console.log('[SOCKET DEBUG] Agent typing status:', JSON.stringify(data, null, 2));
  store.dispatch('chat/setAgentTyping', data);
});

socket.on('system_message', (data) => {
  console.log('[SOCKET DEBUG] Received system message:', JSON.stringify(data, null, 2));
  store.dispatch('chat/addSystemMessage', data);
});

socket.on('user_typing', (data) => {
  console.log('[SOCKET DEBUG] User typing status received:', JSON.stringify(data, null, 2));
  store.dispatch('chat/setUserTyping', data);
});

socket.on('chat_resolved', (data) => {
  console.log('[SOCKET DEBUG] Chat resolved notification:', JSON.stringify(data, null, 2));
  store.dispatch('chat/setChatResolved', data);
});

socket.on('suggest_human_transfer', (data) => {
  console.log('[SOCKET DEBUG] Human transfer suggestion received:', data);
  store.dispatch('chat/setSuggestHumanTransfer', data);
});

socket.on('error', (error) => {
  console.error('[SOCKET DEBUG] Error received from socket server:', error);
  store.dispatch('notification/showError', {
    title: 'Lỗi kết nối',
    message: error.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.'
  });
});

// Plugin object
const SocketPlugin = {
  install(app) {
    // Tạo các phương thức socket và gắn vào globalProperties
    app.config.globalProperties.$socket = socket;
    
    // Helper methods
    app.config.globalProperties.$joinChatRoom = (roomId) => {
      if (socket.connected && roomId) {
        console.log(`[SOCKET DEBUG] Attempting to join room: ${roomId}`);
        socket.emit('join_room', roomId);
        return true;
      }
      console.log(`[SOCKET DEBUG] Could not join room ${roomId}, socket connected: ${socket.connected}`);
      return false;
    };
    
    app.config.globalProperties.$leaveChatRoom = (roomId) => {
      if (socket.connected && roomId) {
        console.log(`[SOCKET DEBUG] Leaving room: ${roomId}`);
        socket.emit('leave_room', roomId);
        return true;
      }
      return false;
    };
    
    app.config.globalProperties.$sendTypingStatus = (roomId, userId, isTyping) => {
      if (socket.connected && roomId) {
        const typingData = {
          room: roomId,
          userId,
          isTyping
        };
        console.log(`[SOCKET DEBUG] Emitting typing status:`, JSON.stringify(typingData, null, 2));
        socket.emit('typing', typingData);
        return true;
      }
      return false;
    };
    
    app.config.globalProperties.$sendMessage = (sessionId, message, userId) => {
      console.log(`[SOCKET DEBUG] Sending message via socket:`, sessionId, message, userId);
      if (socket.connected && sessionId) {
        const messageData = {
          sessionId,
          message,
          userId: userId || 'anonymous',
          timestamp: new Date()
        };
        console.log(`[SOCKET DEBUG] Sending message via socket:`, JSON.stringify(messageData, null, 2));
        socket.emit('send_message', messageData);
        return true;
      } else {
        console.log(`[SOCKET DEBUG] Could not send message, socket connected: ${socket.connected}`);
        return false;
      }
    };
    
    // Connection control
    app.config.globalProperties.$connectSocket = () => {
      if (!socket.connected) {
        console.log('[SOCKET DEBUG] Initiating socket connection...');
        socket.connect();
      } else {
        console.log('[SOCKET DEBUG] Socket already connected');
      }
    };
    
    app.config.globalProperties.$disconnectSocket = () => {
      if (socket.connected) {
        console.log('[SOCKET DEBUG] Manually disconnecting socket');
        socket.disconnect();
      } else {
        console.log('[SOCKET DEBUG] Socket already disconnected');
      }
    };
    
    // Debug method
    app.config.globalProperties.$getSocketStatus = () => {
      return {
        connected: socket.connected,
        id: socket.id,
        disconnected: socket.disconnected
      };
    };
  }
};

// Export socket instance để có thể sử dụng trực tiếp
export { socket };

// Export plugin mặc định
export default SocketPlugin;