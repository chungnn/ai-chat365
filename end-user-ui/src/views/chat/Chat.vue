<template>  <div class="chat-container">
    <v-card class="chat-card">      <v-card-title class="chat-header d-flex align-center">
        <div class="d-flex align-center">
          <v-icon left>mdi-headset</v-icon>
          {{ $t('common.appName') }}
          <span v-if="ticketId" class="ticket-badge ml-2">
            <v-chip color="primary" small class="ticket-id">
              <v-icon left small>mdi-ticket-outline</v-icon>
              {{ ticketId }}
            </v-chip>
            <v-chip :color="statusColor" small class="ml-1">
              {{ statusText }}
            </v-chip>
          </span>
        </div>
        <v-spacer></v-spacer>
        <div class="d-flex ml-auto">
          <v-btn 
            color="error" 
            small 
            class="mr-2" 
            @click="transferToAgent" 
            :disabled="waitingForAgent || isTransferring"
            :loading="isTransferring"
            :title="$t('chat.connectToAgent')"
          >
            <v-icon left>mdi-account-tie</v-icon>
            {{ $t('chat.humanAgent') }}
          </v-btn>
          <v-btn icon @click="createNewChat" :title="$t('chat.createNewChat')">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="chat-body">
        <div class="messages-container" ref="messagesContainer">
          <template v-if="messages.length > 0">            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message-bubble', message.sender === 'user' ? 'user-message' : 'assistant-message']"
            >
              <div class="message-content" v-if="message.sender === 'user'">{{ renderMessageContent(message).text }}</div>
              <div class="message-content markdown-body" v-else v-html="renderMessageContent(message).html"></div>
              <url-preview 
                v-if="renderMessageContent(message).hasUrl" 
                :url="renderMessageContent(message).url"
              ></url-preview>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </template>          <div v-else class="empty-chat">
            <v-icon size="64" color="grey lighten-1">mdi-help-circle-outline</v-icon>
            <p>{{ $t('chat.welcome') }}</p>
            <p class="text-body-2">{{ $t('chat.describeProblem') }}</p>
          </div>

          <div v-if="isTyping" class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>      <v-card-actions class="chat-footer">
        <v-text-field
          v-model="newMessage"
          :placeholder="$t('chat.enterQuestion')"
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
    </v-card>    <v-dialog v-model="showUserInfoDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('chat.contactInfo') }}</v-card-title>
        <v-card-text>
          <p>{{ $t('chat.pleaseProvideInfo') }}</p>
          <v-form ref="userInfoForm" v-model="userInfoFormValid">
            <v-text-field
              v-model="userInfo.name"
              :label="$t('chat.name')"
              :rules="[v => !!v || $t('chat.pleaseEnterName')]"
              required
            ></v-text-field>
            <v-text-field
              v-model="userInfo.email"
              :label="$t('chat.email')"
              :rules="[
                v => !!v || $t('chat.pleaseEnterEmail'),
                v => /.+@.+\..+/.test(v) || $t('chat.invalidEmail')
              ]"
              type="email"
              required
            ></v-text-field>
            <v-text-field
              v-model="userInfo.phone"
              :label="$t('chat.phoneNumber')"
              :rules="[
                v => !!v || $t('chat.pleaseEnterPhone'),
                v => /^\d{10,11}$/.test(v) || $t('chat.invalidPhone')
              ]"
              type="tel"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitUserInfo" :loading="isUpdatingUserInfo">
            {{ $t('chat.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>    <v-dialog v-model="showTransferDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('chat.transferRequest') }}</v-card-title>
        <v-card-text>
          <p>{{ $t('chat.transferQuestion') }}</p>
          <v-textarea
            v-model="transferReason"
            :label="$t('chat.transferDescription')"
            :hint="$t('chat.transferHint')"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTransferDialog = false">{{ $t('chat.stayWithAI') }}</v-btn>
          <v-btn color="primary" @click="transferToAgent" :loading="isTransferring">
            {{ $t('chat.connectNow') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>      <v-dialog v-model="showFeedbackDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('chat.feedbackTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ $t('chat.feedbackThankYou') }}</p>
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
            <p class="mb-2">{{ $t('chat.issueResolved') }}</p>
            <v-radio :label="$t('chat.resolved')" value="resolved"></v-radio>
            <v-radio :label="$t('chat.unresolved')" value="unresolved"></v-radio>
          </v-radio-group>
          <v-textarea
            v-model="satisfaction.feedback"
            :label="$t('chat.feedback')"
            :hint="$t('chat.feedbackHint')"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showFeedbackDialog = false">{{ $t('chat.skip') }}</v-btn>
          <v-btn color="primary" @click="submitFeedback" :loading="isSubmittingFeedback">
            {{ $t('chat.sendFeedback') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      top
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          {{ $t('chat.close') }}
        </v-btn>
      </template>
    </v-snackbar>

    <loading-overlay :loading="isInitialLoading" :text="$t('chat.loading')"></loading-overlay>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { useSocket } from '@/composables/useSocket';
import LoadingOverlay from '@/components/common/LoadingOverlay.vue';
import UrlPreview from '@/components/chat/UrlPreview.vue';
// Import marked pour le support Markdown
import { marked } from 'marked';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js';

// Configuration de marked pour utiliser highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (e) {
        console.error(e);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

export default {
  name: 'Chat',
  components: {
    LoadingOverlay,
    UrlPreview
  },data() {
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
    }),    statusText() {
      const statusMap = {
        'open': this.$t('chat.status.new'),
        'in-progress': this.$t('chat.status.inProgress'),
        'waiting': this.$t('chat.status.waiting'),
        'resolved': this.$t('chat.status.resolved'),
        'closed': this.$t('chat.status.closed')
      };
      return this.chatStatus ? statusMap[this.chatStatus] || this.$t('chat.status.unknown') : '';
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
      // Function to render message content with URL detection and Markdown support
    renderMessageContent(message) {
      const urls = this.extractUrls(message.content);
      
      // Parse content with Markdown
      const htmlContent = marked.parse(message.content);
      
      if (urls.length > 0) {
        return {
          text: message.content,
          html: htmlContent,
          hasUrl: true,
          url: urls[0] // For simplicity, we'll just show preview for the first URL
        };
      }
      return {
        text: message.content,
        html: htmlContent,
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
        }        // Nếu đang chờ nhân viên tư vấn
        if (response && response.waitingForAgent) {
          this.waitingForAgent = true;
          this.showSnackbar(this.$t('chat.messageSentToAgent'), 'info');
        }
      } catch (error) {
        this.showSnackbar(this.$t('chat.errorSendingMessage'), 'error');
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
        this.showSnackbar(this.$t('chat.newChatCreated'), 'success');
      } catch (error) {
        this.showSnackbar(this.$t('chat.errorCreatingNewChat'), 'error');
      }
    },

    async submitUserInfo() {
      if (!this.$refs.userInfoForm.validate()) return;

      this.isUpdatingUserInfo = true;
      try {
        // Sử dụng action từ store thay vì gọi axios trực tiếp        await this.$store.dispatch('chat/updateUserInfo', this.userInfo);
        this.showUserInfoDialog = false;
        this.showSnackbar(this.$t('chat.thankYouForInfo'), 'success');
      } catch (error) {
        this.showSnackbar(this.$t('chat.errorUpdatingContactInfo'), 'error');
      } finally {
        this.isUpdatingUserInfo = false;
      }
    },    async transferToAgent() {
      this.isTransferring = true;
      try {        const reason = this.transferReason || this.$t('chat.defaultTransferReason');
        // Sử dụng action từ store thay vì gọi axios trực tiếp
        await this.$store.dispatch('chat/transferToAgent', reason);
        this.waitingForAgent = true;
        this.showTransferDialog = false;
        this.showSnackbar(this.$t('chat.transferredToAgent'), 'info', 6000);      } catch (error) {
        this.showSnackbar(this.$t('chat.errorTransferringToAgent'), 'error');
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
        }      } catch (error) {
        console.error('Lỗi khởi tạo chat:', error);
        this.showSnackbar(this.$t('chat.errorInitializingChat'), 'error');
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