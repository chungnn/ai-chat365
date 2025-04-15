<template>
  <v-container fluid fill-height class="login-container">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="6" class="pa-4">
          <v-card-title class="text-h5 text-center">Đăng nhập</v-card-title>
          
          <v-card-text>
            <v-form ref="loginForm" v-model="valid" @submit.prevent="login">
              <v-alert v-if="error" type="error" class="mb-4" dense>
                {{ error }}
              </v-alert>
              
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-icon="mdi-email"
                :rules="emailRules"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Mật khẩu"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showPassword ? 'text' : 'password'"
                :rules="passwordRules"
                required
                @click:append="showPassword = !showPassword"
              ></v-text-field>
              
              <div class="d-flex justify-space-between align-center mb-4">
                <v-checkbox v-model="rememberMe" label="Lưu đăng nhập"></v-checkbox>
                <router-link to="/forgot-password" class="text-decoration-none">
                  Quên mật khẩu?
                </router-link>
              </div>
              
              <v-btn
                block
                color="primary"
                :loading="loading"
                :disabled="!valid || loading"
                height="44"
                type="submit"
              >
                Đăng nhập
              </v-btn>
              
              <div class="text-center mt-5">
                <span class="grey--text">Chưa có tài khoản? </span>
                <router-link to="/register" class="text-decoration-none">
                  Đăng ký ngay
                </router-link>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      valid: false,
      email: '',
      password: '',
      rememberMe: false,
      showPassword: false,
      loading: false,
      error: null,
      emailRules: [
        v => !!v || 'Vui lòng nhập email',
        v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
      ],
      passwordRules: [
        v => !!v || 'Vui lòng nhập mật khẩu',
        v => v.length >= 6 || 'Mật khẩu phải có ít nhất 6 ký tự'
      ]
    }
  },
  methods: {
    async login() {
      if (!this.$refs.loginForm.validate()) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        await this.$store.dispatch('auth/login', {
          email: this.email,
          password: this.password,
          remember: this.rememberMe
        });
        
        // Kiểm tra nếu có redirect từ URL
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.push(redirectPath);
      } catch (error) {
        this.error = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
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
.login-container {
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}
</style>