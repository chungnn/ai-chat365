import { inject } from 'vue';
import store from '@/store';

export function useSocket() {
  // Inject các phương thức socket từ globalProperties
  const socket = inject('$socket', null);
  const connectSocket = inject('$connectSocket', null);
  const disconnectSocket = inject('$disconnectSocket', null);
  const joinChatRoom = inject('$joinChatRoom', null);
  const leaveChatRoom = inject('$leaveChatRoom', null);
  const sendTypingStatus = inject('$sendTypingStatus', null);
  const sendMessage = inject('$sendMessage', null);
  const getSocketStatus = inject('$getSocketStatus', null);

  return {
    socket,
    connectSocket,
    disconnectSocket,
    joinChatRoom,
    leaveChatRoom,
    sendTypingStatus,
    sendMessage,
    getSocketStatus,
    
    // Hàm tiện ích để sử dụng trong component
    sendChatMessage(sessionId, message, userId) {
      if (sendMessage) {
        return sendMessage(sessionId, message, userId);
      } else {
        console.error('Socket sendMessage method not available');
        return false;
      }
    },
    
    checkConnection() {
      if (socket) {
        return socket.connected;
      }
      return false;
    }
  };
}
