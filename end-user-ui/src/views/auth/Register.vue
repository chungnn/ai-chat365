<template>
  <v-container fluid fill-height class="register-container">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card elevation="6" class="pa-4">
          <v-card-title class="text-h5 text-center">Đăng ký tài khoản</v-card-title>
          
          <v-card-text>
            <v-form ref="registerForm" v-model="valid" @submit.prevent="register">
              <v-alert v-if="error" type="error" class="mb-4" dense>
                {{ error }}
              </v-alert>
              
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="firstName"
                    label="Họ"
                    prepend-icon="mdi-account"
                    :rules="nameRules"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="lastName"
                    label="Tên"
                    :rules="nameRules"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-icon="mdi-email"
                :rules="emailRules"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="phoneNumber"
                label="Số điện thoại"
                prepend-icon="mdi-phone"
                :rules="phoneRules"
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
              
              <v-text-field
                v-model="confirmPassword"
                label="Xác nhận mật khẩu"
                prepend-icon="mdi-lock-check"
                :type="showPassword ? 'text' : 'password'"
                :rules="confirmPasswordRules"
                required
              ></v-text-field>
              
              <v-checkbox
                v-model="agreeTerms"
                label="Tôi đồng ý với điều khoản sử dụng"
                :rules="[v => !!v || 'Bạn phải đồng ý với điều khoản để tiếp tục']"
                required
              ></v-checkbox>
              
              <v-btn
                block
                color="primary"
                :loading="loading"
                :disabled="!valid || loading"
                height="44"
                type="submit"
                class="mt-4"
              >
                Đăng ký
              </v-btn>
              
              <div class="text-center mt-5">
                <span class="grey--text">Đã có tài khoản? </span>
                <router-link to="/login" class="text-decoration-none">
                  Đăng nhập ngay
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
  name: 'Register',
  data() {
    return {
      valid: false,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      showPassword: false,
      loading: false,
      error: null,
      nameRules: [
        v => !!v || 'Vui lòng nhập tên'
      ],
      emailRules: [
        v => !!v || 'Vui lòng nhập email',
        v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
      ],
      phoneRules: [
        v => !v || /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/.test(v) || 'Số điện thoại không hợp lệ'
      ],
      passwordRules: [
        v => !!v || 'Vui lòng nhập mật khẩu',
        v => v.length >= 6 || 'Mật khẩu phải có ít nhất 6 ký tự'
      ]
    }
  },
  computed: {
    confirmPasswordRules() {
      return [
        v => !!v || 'Vui lòng xác nhận mật khẩu',
        v => v === this.password || 'Mật khẩu xác nhận không khớp'
      ]
    }
  },
  methods: {
    async register() {
      if (!this.$refs.registerForm.validate()) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        await this.$store.dispatch('auth/register', {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          phoneNumber: this.phoneNumber,
          password: this.password
        });
        
        this.$router.push('/');
        
        // Thông báo thành công
        this.$store.dispatch('notification/addNotification', {
          type: 'success',
          message: 'Đăng ký tài khoản thành công'
        });
      } catch (error) {
        this.error = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.';
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
.register-container {
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}
</style>