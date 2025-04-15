<template>
  <div class="chat-container">
    <v-card class="chat-card">      <v-card-title class="chat-header">
        <v-icon left>mdi-headset</v-icon>
        Trung tâm hỗ trợ khách hàng
        <span v-if="ticketId" class="ticket-badge ml-2">
          <v-chip color="primary" small class="ticket-id">
            <v-icon left small>mdi-ticket-outline</v-icon>
            {{ ticketId }}
          </v-chip>
          <v-chip :color="statusColor" small class="ml-1">
            {{ statusText }}
          </v-chip>
        </span>
        <v-spacer></v-spacer>
        <v-btn 
          color="error" 
          small 
          class="mr-2" 
          @click="transferToAgent" 
          :disabled="waitingForAgent || isTransferring"
          :loading="isTransferring"
          title="Kết nối với nhân viên hỗ trợ"
        >
          <v-icon left>mdi-account-tie</v-icon>
          Gặp nhân viên hỗ trợ
        </v-btn>
        <v-btn icon @click="createNewChat" title="Tạo yêu cầu hỗ trợ mới">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="chat-body">
        <div class="messages-container" ref="messagesContainer">
          <template v-if="messages.length > 0">            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message-bubble', message.sender === 'user' ? 'user-message' : 'assistant-message']"
            >
              <div class="message-content">{{ renderMessageContent(message).text }}</div>
              <url-preview 
                v-if="renderMessageContent(message).hasUrl" 
                :url="renderMessageContent(message).url"
              ></url-preview>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </template>          <div v-else class="empty-chat">
            <v-icon size="64" color="grey lighten-1">mdi-help-circle-outline</v-icon>
            <p>Chào mừng đến với hệ thống hỗ trợ khách hàng</p>
            <p class="text-body-2">Vui lòng mô tả vấn đề của bạn để chúng tôi có thể giúp đỡ</p>
          </div>

          <div v-if="isTyping" class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="chat-footer">
        <v-text-field
          v-model="newMessage"
          placeholder="Nhập câu hỏi của bạn..."
          outlined
          dense
          hide-details
          @keypress.enter="sendMessage"
          :disabled="isLoading"
        ></v-text-field>
        <v-btn
          color="primary"
          :disabled="!newMessage.trim() || isLoading"
          @click="sendMessage"
          class="ml-2"
          :loading="isLoading"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="showUserInfoDialog" max-width="500px">
      <v-card>
        <v-card-title>Thông tin liên hệ</v-card-title>
        <v-card-text>
          <p>Vui lòng để lại thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn:</p>
          <v-form ref="userInfoForm" v-model="userInfoFormValid">
            <v-text-field
              v-model="userInfo.name"
              label="Họ và tên"
              :rules="[v => !!v || 'Vui lòng nhập họ tên']"
              required
            ></v-text-field>
            <v-text-field
              v-model="userInfo.email"
              label="Email"
              :rules="[
                v => !!v || 'Vui lòng nhập email',
                v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
              ]"
              type="email"
              required
            ></v-text-field>
            <v-text-field
              v-model="userInfo.phone"
              label="Số điện thoại"
              :rules="[
                v => !!v || 'Vui lòng nhập số điện thoại',
                v => /^\d{10,11}$/.test(v) || 'Số điện thoại không hợp lệ'
              ]"
              type="tel"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitUserInfo" :loading="isUpdatingUserInfo">
            Xác nhận
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>    <v-dialog v-model="showTransferDialog" max-width="500px">
      <v-card>
        <v-card-title>Yêu cầu hỗ trợ từ nhân viên</v-card-title>
        <v-card-text>
          <p>Bạn có muốn kết nối với nhân viên hỗ trợ kỹ thuật để được giải quyết vấn đề trực tiếp không?</p>
          <v-textarea
            v-model="transferReason"
            label="Vấn đề cần hỗ trợ (tùy chọn)"
            hint="Mô tả ngắn gọn vấn đề để nhân viên hỗ trợ có thể chuẩn bị trước"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTransferDialog = false">Không, tiếp tục với AI</v-btn>
          <v-btn color="primary" @click="transferToAgent" :loading="isTransferring">
            Có, kết nối ngay
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      <v-dialog v-model="showFeedbackDialog" max-width="500px">
      <v-card>
        <v-card-title>Đánh giá chất lượng hỗ trợ</v-card-title>
        <v-card-text>
          <p>Cảm ơn bạn đã sử dụng dịch vụ hỗ trợ của chúng tôi. Vui lòng đánh giá trải nghiệm của bạn:</p>
          <div class="text-center">
            <v-rating
              v-model="satisfaction.rating"
              color="amber"
              background-color="grey lighten-1"
              half-increments
              hover
              large
            ></v-rating>
          </div>
          <v-radio-group v-model="satisfaction.issueResolved" row>
            <p class="mb-2">Vấn đề của bạn đã được giải quyết chưa?</p>
            <v-radio label="Đã giải quyết" value="resolved"></v-radio>
            <v-radio label="Chưa giải quyết" value="unresolved"></v-radio>
          </v-radio-group>
          <v-textarea
            v-model="satisfaction.feedback"
            label="Góp ý của bạn"
            hint="Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showFeedbackDialog = false">Bỏ qua</v-btn>
          <v-btn color="primary" @click="submitFeedback" :loading="isSubmittingFeedback">
            Gửi đánh giá
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          Đóng
        </v-btn>
      </template>
    </v-snackbar>

    <loading-overlay :loading="isInitialLoading" text="Đang tải cuộc trò chuyện..."></loading-overlay>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { useSocket } from '@/composables/useSocket';
import LoadingOverlay from '@/components/common/LoadingOverlay.vue';
import UrlPreview from '@/components/chat/UrlPreview.vue';
import axios from '@/plugins/axios';

export default {
  name: 'Chat',
  components: {
    LoadingOverlay,
    UrlPreview
  },    data() {
    // Sử dụng composable useSocket để truy cập các phương thức socket
    const socket = useSocket();
    
    return {
      socket,
      newMessage: '',
      isInitialLoading: false,
      isUpdatingUserInfo: false,
      isTransferring: false,
      isSubmittingFeedback: false,
      userInfo: {
        name: '',
        email: '',
        phone: ''
      },
      userInfoFormValid: false,
      showUserInfoDialog: false,
      showTransferDialog: false,
      showFeedbackDialog: false,
      suggestContactInfo: false,
      waitingForAgent: false,
      typingTimeout: null,
      transferReason: '',
      ticketId: null,
      satisfaction: {
        rating: 0,
        feedback: ''
      },
      snackbar: {
        show: false,
        text: '',
        color: 'info',
        timeout: 3000
      }
    };
  },  computed: {
    ...mapGetters({
      messages: 'chat/allMessages',
      isConnected: 'chat/isConnected',
      isTyping: 'chat/isTyping',
      isLoading: 'chat/isLoading',
      error: 'chat/error',
      currentChatId: 'chat/currentChatId',
      user: 'auth/user',
      typingUsers: 'chat/typingUsers',
      sessionId: 'chat/getSessionId',
      chatStatus: 'chat/getStatus'
    }),
    statusText() {
      const statusMap = {
        'open': 'Mới',
        'in-progress': 'Đang xử lý',
        'waiting': 'Đang chờ',
        'resolved': 'Đã giải quyết',
        'closed': 'Đã đóng'
      };
      return this.chatStatus ? statusMap[this.chatStatus] || 'Không xác định' : '';
    },
    statusColor() {
      const colorMap = {
        'open': 'blue',
        'in-progress': 'amber',
        'waiting': 'purple',
        'resolved': 'green',
        'closed': 'grey'
      };
      return this.chatStatus ? colorMap[this.chatStatus] || 'grey' : 'grey';
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    user: {
      immediate: true,
      handler(user) {
        if (user) {
          this.userInfo.name = user.firstName + ' ' + user.lastName;
          this.userInfo.email = user.email;
          this.userInfo.phone = user.phoneNumber || '';
        }
      }
    },
    newMessage(val) {
      // Send typing event when user is typing
      if (val && this.sessionId) {
        this.sendTypingStatus(true);
        
        // Clear previous timeout
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        
        // Set timeout to stop "typing" after 1 second of inactivity
        this.typingTimeout = setTimeout(() => {
          this.sendTypingStatus(false);
        }, 1000);
      }
    }
  },  methods: {     
    // Function to extract URLs from message text
    extractUrls(text) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.match(urlRegex) || [];
    },
    
    // Function to render message content with URL detection
    renderMessageContent(message) {
      const urls = this.extractUrls(message.content);
      if (urls.length > 0) {
        return {
          text: message.content,
          hasUrl: true,
          url: urls[0] // For simplicity, we'll just show preview for the first URL
        };
      }
      return {
        text: message.content,
        hasUrl: false
      };
    },

    sendTypingStatus(isTyping) {
      // Sử dụng socket composable để gửi trạng thái typing
      const userId = localStorage.getItem('user_id') || 'anonymous';
      if (this.sessionId) {
        try {
          // First try using socket from composable
          if (this.socket && this.socket.sendTypingStatus) {
            this.socket.sendTypingStatus(this.sessionId, userId, isTyping);
            console.log(`[CHAT DEBUG] Typing status sent via composable: ${isTyping}`);
          } 
          // Fallback to globally available socket instance
          else if (this.$socket) {
            this.$socket.emit('typing', {
              room: this.sessionId,
              userId: userId,
              isTyping: isTyping
            });
            console.log(`[CHAT DEBUG] Typing status sent via global socket: ${isTyping}`);
          }
          // Direct access to socket from plugins
          else if (window._vueSocketInstance) {
            window._vueSocketInstance.emit('typing', {
              room: this.sessionId,
              userId: userId,
              isTyping: isTyping
            });
            console.log(`[CHAT DEBUG] Typing status sent via window socket instance: ${isTyping}`);
          } else {
            console.warn('[CHAT DEBUG] sendTypingStatus method not available, will skip typing notification');
          }
        } catch (error) {
          console.error('[CHAT DEBUG] Error sending typing status:', error);
        }
      } else {
        console.warn('[CHAT DEBUG] Session ID not available');
      }
    },
    
    async sendMessage() {
      if (!this.newMessage.trim() || this.isLoading) return;

      const message = this.newMessage.trim();
      this.newMessage = '';
      
      // Clear typing status when sending message
      // this.sendTypingStatus(false);

      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const response = await this.$store.dispatch('chat/sendMessage', message);
        
        // Nếu AI đề xuất chuyển sang nhân viên tư vấn
        if (response && response.suggestHumanTransfer) {
          this.showTransferDialog = true;
        }

        // Nếu AI đề xuất lấy thông tin liên hệ và chưa có thông tin
        if (!this.userInfo.phone && this.messages.length > 3 && !this.suggestContactInfo) {
          this.suggestContactInfo = true;
          this.showUserInfoDialog = true;
        }

        // Nếu đang chờ nhân viên tư vấn
        if (response && response.waitingForAgent) {
          this.waitingForAgent = true;
          this.showSnackbar('Tin nhắn của bạn đã được gửi tới nhân viên tư vấn. Vui lòng đợi phản hồi.', 'info');
        }
      } catch (error) {
        this.showSnackbar('Có lỗi xảy ra khi gửi tin nhắn', 'error');
      }
    },    async createNewChat() {
      try {
        // Leave the current chat room if any
        if (this.sessionId && this.socket.leaveChatRoom) {
          this.socket.leaveChatRoom(this.sessionId);
        }
        
        await this.$store.dispatch('chat/createNewChat');
        // Khi tạo chat mới, xóa sessionId cũ khỏi localStorage
        localStorage.removeItem('chat_session_id');
        
        // Khởi tạo phiên chat mới
        this.initChat();
        
        this.waitingForAgent = false;
        this.showSnackbar('Đã tạo cuộc trò chuyện mới', 'success');
      } catch (error) {
        this.showSnackbar('Không thể tạo cuộc trò chuyện mới', 'error');
      }
    },

    async submitUserInfo() {
      if (!this.$refs.userInfoForm.validate()) return;

      this.isUpdatingUserInfo = true;
      try {
        // Sử dụng action từ store thay vì gọi axios trực tiếp
        await this.$store.dispatch('chat/updateUserInfo', this.userInfo);
        this.showUserInfoDialog = false;
        this.showSnackbar('Cảm ơn bạn đã cung cấp thông tin liên hệ!', 'success');
      } catch (error) {
        this.showSnackbar('Không thể cập nhật thông tin liên hệ', 'error');
      } finally {
        this.isUpdatingUserInfo = false;
      }
    },    async transferToAgent() {
      this.isTransferring = true;
      try {
        const reason = this.transferReason || 'Người dùng yêu cầu hỗ trợ kỹ thuật';
        // Sử dụng action từ store thay vì gọi axios trực tiếp
        await this.$store.dispatch('chat/transferToAgent', reason);
        this.waitingForAgent = true;
        this.showTransferDialog = false;
        this.showSnackbar('Yêu cầu của bạn đã được chuyển tới nhân viên hỗ trợ kỹ thuật. Vui lòng đợi trong giây lát.', 'info', 6000);
      } catch (error) {
        this.showSnackbar('Không thể chuyển cuộc trò chuyện tới nhân viên tư vấn', 'error');
      } finally {
        this.isTransferring = false;
      }
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    showSnackbar(text, color = 'info', timeout = 3000) {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout
      };
    },
    async initChat() {
      this.isInitialLoading = true;
      try {
        // Ensure socket connection is established
        if (this.socket.connectSocket) {
          this.socket.connectSocket();
        }
        
        // Gọi action initChat từ store thay vì thực hiện axios trực tiếp
        await this.$store.dispatch('chat/initChat');
        
        // Join the chat room for real-time updates
        if (this.sessionId && this.socket.joinChatRoom) {
          this.socket.joinChatRoom(this.sessionId);
        }
      } catch (error) {
        console.error('Lỗi khởi tạo chat:', error);
        this.showSnackbar('Không thể khởi tạo cuộc trò chuyện', 'error');
      } finally {
        this.isInitialLoading = false;
      }
    },
    handleSocketStatus(status) {
      if (status) {
        this.showSnackbar('Kết nối real-time đã được thiết lập', 'success');
      } else {
        this.showSnackbar('Mất kết nối real-time, đang thử kết nối lại...', 'warning');
      }
    }
  },  mounted() {
    // Khởi tạo chat không đồng bộ để tránh lỗi khi không đăng nhập
    this.initChat();

    this.$nextTick(() => {
      this.scrollToBottom();
    });
    
    // Lắng nghe sự kiện custom khi thêm tin nhắn mới vào store
    window.addEventListener('chat-message-added', () => {
      console.log('[CHAT DEBUG] chat-message-added event triggered');
      // Sử dụng setTimeout để đảm bảo DOM đã được cập nhật hoàn toàn
      setTimeout(() => {
        this.scrollToBottom();
        console.log('[CHAT DEBUG] Scroll executed after chat-message-added event');
      }, 100);
    });
    
    // Lắng nghe sự kiện socket kết nối/mất kết nối
    if (this.socket && this.socket.socket) {
      this.socket.socket.on('connect', () => this.handleSocketStatus(true));
      this.socket.socket.on('disconnect', () => this.handleSocketStatus(false));
    }
  },beforeDestroy() {
    // Đóng kết nối socket khi rời khỏi trang
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Leave the chat room
    if (this.sessionId && this.socket.leaveChatRoom) {
      this.socket.leaveChatRoom(this.sessionId);
    }
    
    // Đóng kết nối socket khi rời khỏi trang
    this.$store.dispatch('chat/disconnect');
  }
};
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background-color: #f5f5f5;
}

.chat-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  position: relative;
}

.messages-container {
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 8px;
  position: relative;
  word-wrap: break-word;
}

.user-message {
  background-color: #1976D2;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.assistant-message {
  background-color: #f1f0f0;
  color: #333;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 10px;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  background-color: #f1f0f0;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 8px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  margin-right: 4px;
  animation: typing-dot 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

@keyframes typing-dot {
  0%, 80%, 100% {
    transform: scale(0.7);
  }
  40% {
    transform: scale(1);
  }
}

.chat-footer {
  background-color: #f5f5f5;
  padding: 12px;
}
</style>