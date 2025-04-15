<template>
  <v-card
    :to="{ name: 'Chat' }"
    class="service-card"
    elevation="2"
    hover
  >
    <v-img
      :src="service.thumbnail || '/assets/default-service.jpg'"
      height="200"
      class="service-thumbnail"
      gradient="to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7)"
    >
      <v-card-title class="white--text service-title">
        {{ service.title }}
      </v-card-title>
    </v-img>

    <v-card-text class="pb-0">
      <p class="service-description">{{ truncateDescription(service.description) }}</p>
      <div class="d-flex align-center mt-2">
        <v-chip
          :color="getPriorityColor(service.priority)"
          x-small
          class="mr-2"
        >
          {{ service.priority }}
        </v-chip>
        <span class="caption">{{ getResponseTime(service.priority) }}</span>
      </div>
    </v-card-text>

    <v-divider class="mt-2"></v-divider>
    
    <v-card-actions>
      <v-rating
        :value="service.satisfaction || 5"
        color="amber"
        dense
        half-increments
        readonly
        size="14"
      ></v-rating>
      <span class="caption ml-1">{{ (service.satisfaction || 5).toFixed(1) }}</span>
      <v-spacer></v-spacer>
      <v-chip
        :color="getStatusColor(service.status)"
        x-small
      >
        {{ service.status }}
      </v-chip>
    </v-card-actions>

    <v-btn
      color="primary"
      class="request-support-btn"
      fab
      small
      absolute
      right
      bottom
      @click.stop="requestSupport"
    >
      <v-icon>mdi-headset</v-icon>
    </v-btn>
  </v-card>
</template>

<script>
export default {
  name: 'SupportServiceCard',
  props: {
    service: {
      type: Object,
      required: true
    }
  },
  methods: {    truncateDescription(text) {
      return text && text.length > 100 ? text.substring(0, 100) + this.$t('common.ellipsis') : text;
    },    getPriorityColor(priority) {
      const colors = {
        [this.$t('service.priority.high')]: 'red',
        [this.$t('service.priority.medium')]: 'orange',
        [this.$t('service.priority.low')]: 'green'
      };
      return colors[priority] || 'blue';
    },    getStatusColor(status) {
      const colors = {
        [this.$t('service.status.processing')]: 'warning',
        [this.$t('service.status.completed')]: 'success',
        [this.$t('service.status.pending')]: 'error',
        [this.$t('service.status.waiting')]: 'info'
      };
      return colors[status] || 'grey';
    },    getResponseTime(priority) {
      const times = {
        [this.$t('service.priority.high')]: this.$t('service.responseTime.high'),
        [this.$t('service.priority.medium')]: this.$t('service.responseTime.medium'),
        [this.$t('service.priority.low')]: this.$t('service.responseTime.low')
      };
      return times[priority] || this.$t('service.responseTime.default');
    },
    requestSupport() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.service-card {
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.service-card:hover {
  transform: translateY(-5px);
}

.service-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0));
  padding: 16px;
}

.service-description {
  height: 60px;
  overflow: hidden;
}

.request-support-btn {
  position: absolute;
  right: 16px;
  bottom: -20px;
  z-index: 1;
}
</style>
