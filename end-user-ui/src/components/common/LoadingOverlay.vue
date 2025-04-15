<template>
  <div v-if="loading" class="loading-overlay">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
    ></v-progress-circular>
    <div class="loading-text mt-3">{{ text || 'Đang tải...' }}</div>
  </div>
</template>

<script>
export default {
  name: 'LoadingOverlay',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 9999;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #1976D2;
}
</style>