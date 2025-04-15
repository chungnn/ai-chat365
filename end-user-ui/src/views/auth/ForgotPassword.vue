<template>
  <v-container fluid fill-height class="forgot-password-container">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="6" class="pa-4">
          <v-card-title class="text-h5 text-center">Quên mật khẩu</v-card-title>
          
          <v-card-text>
            <v-alert v-if="successMessage" type="success" class="mb-4" dense>
              {{ successMessage }}
            </v-alert>
            
            <v-alert v-if="error" type="error" class="mb-4" dense>
              {{ error }}
            </v-alert>
            
            <p class="text-subtitle-2 mb-4">
              Vui lòng nhập địa chỉ email của bạn. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
            </p>
            
            <v-form ref="forgotPasswordForm" v-model="valid" @submit.prevent="submitForm" v-if="!successMessage">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-icon="mdi-email"
                :rules="emailRules"
                required
              ></v-text-field>
              
              <v-btn
                block
                color="primary"
                :loading="loading"
                :disabled="!valid || loading"
                height="44"
                type="submit"
                class="mt-4"
              >
                Gửi liên kết đặt lại mật khẩu
              </v-btn>
            </v-form>
              
            <div class="text-center mt-5">
              <router-link to="/login" class="text-decoration-none">
                <v-icon small class="mr-1">mdi-arrow-left</v-icon>
                Quay lại trang đăng nhập
              </router-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from '@/plugins/axios';

export default {
  name: 'ForgotPassword',
  data() {
    return {
      valid: false,
      email: '',
      loading: false,
      error: null,
      successMessage: null,
      emailRules: [
        v => !!v || 'Vui lòng nhập email',
        v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
      ]
    }
  },
  methods: {
    async submitForm() {
      if (!this.$refs.forgotPasswordForm.validate()) return;
      
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        await axios.post('/api/auth/forgot-password', {
          email: this.email
        });
        
        this.successMessage = 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.';
      } catch (error) {
        this.error = error.response?.data?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại sau.';
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    // Nếu đã login thì redirect về trang chủ
    if (this.$store.getters['auth/isAuthenticated']) {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.forgot-password-container {
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}
</style>