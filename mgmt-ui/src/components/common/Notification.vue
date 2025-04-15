<template>
  <div class="notifications-container">
    <div 
      v-for="notification in notifications" 
      :key="notification.id" 
      :class="['notification', `notification-${notification.type}`]"
    >
      <div class="notification-content">
        <span>{{ notification.message }}</span>
        <button
          class="notification-close"
          @click="removeNotification(notification.id)"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'NotificationComponent',
  setup() {
    const store = useStore();
    
    const notifications = computed(() => store.getters['notification/notifications']);
    
    const removeNotification = (id) => {
      store.dispatch('notification/removeNotification', id);
    };
    
    return {
      notifications,
      removeNotification
    };
  }
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 300px;
}

.notification {
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease-out;
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-success {
  background-color: #def7ec;
  color: #0e9f6e;
  border-left: 4px solid #0e9f6e;
}

.notification-error {
  background-color: #fde8e8;
  color: #e02424;
  border-left: 4px solid #e02424;
}

.notification-info {
  background-color: #e1effe;
  color: #3f83f8;
  border-left: 4px solid #3f83f8;
}

.notification-warning {
  background-color: #fef3c7;
  color: #d97706;
  border-left: 4px solid #d97706;
}

.notification-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: inherit;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
