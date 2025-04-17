<template>  <div class="login-container">
    <div class="login-card">
      <h1>{{ t('auth.adminLogin') }}</h1>
      <div
        v-if="error"
        class="alert alert-error"
      >
        {{ error }}
      </div>      <form
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <div class="form-group">
          <label
            for="email"
            class="form-label"
          >{{ t('auth.email') }}</label>
          <input
            id="email"
            v-model="credentials.email"
            type="email"
            class="form-control"
            required
            :placeholder="t('auth.enterEmail')"
          >
        </div>        <div class="form-group">
          <label
            for="password"
            class="form-label"
          >{{ t('auth.password') }}</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-control"
            required
            :placeholder="t('auth.enterPassword')"
          >
        </div>        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          {{ loading ? t('common.loading') : t('common.login') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    
    const credentials = ref({
      email: '',
      password: ''
    });
    
    const loading = computed(() => store.getters['auth/authLoading']);
    const error = computed(() => store.getters['auth/authError']);
      const handleLogin = async () => {
      const success = await store.dispatch('auth/login', credentials.value);
      
      if (success) {
        try {
          // Init socket after login
          //await store.dispatch('chat/initSocket');
          // Điều hướng đến dashboard sau khi khởi tạo socket thành công
          router.push('/dashboard');
        } catch (error) {
          console.error('Error after login:', error);
          // Ngay cả khi có lỗi khởi tạo socket, vẫn điều hướng đến dashboard
          router.push('/dashboard');
        }
      }
    };
      return {
      credentials,
      loading,
      error,
      handleLogin,
      t
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-card h1 {
  margin-bottom: 24px;
  color: #1d2537;
  text-align: center;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  margin-top: 10px;
}
</style>
