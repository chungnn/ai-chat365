<template>
  <div class="notifications-container">
    <v-snackbar
      v-for="notification in notifications"
      :key="notification.id"
      :value="notification.show"
      :color="notification.type"
      :timeout="notification.timeout || 5000"
      :style="{ 'margin-top': `${index * 60}px` }"
      top
      right
      multi-line
      @input="onClose(notification.id)"
    >
      {{ notification.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          icon
          v-bind="attrs"
          @click="onClose(notification.id)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Notification',
  computed: {
    ...mapGetters({
      notifications: 'notification/notifications'
    })
  },
  methods: {
    onClose(id) {
      this.$store.commit('notification/HIDE_NOTIFICATION', id);
      
      setTimeout(() => {
        this.$store.commit('notification/REMOVE_NOTIFICATION', id);
      }, 300);
    }
  }
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  width: 300px;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}
</style>