<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>{{ t('errors.notFoundCode') }}</h1>
      <h2>{{ t('errors.notFound') }}</h2>
      <p>{{ t('errors.notFoundMessage') }}</p>
      <router-link
        to="/"
        class="btn btn-primary"
      >
        {{ t('errors.goBack') }}
      </router-link>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  name: 'NotFoundView',
  setup() {
    const { t } = useI18n();
    return { t };
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 60px 40px;
  max-width: 500px;
}

h1 {
  font-size: 80px;
  margin: 0;
  color: #4a6cf7;
}

h2 {
  font-size: 28px;
  margin: 0 0 20px 0;
  color: #1d2537;
}

p {
  margin-bottom: 30px;
  color: #6b7a99;
}

.btn {
  display: inline-block;
  text-decoration: none;
}
</style>
