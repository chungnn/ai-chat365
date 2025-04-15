<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Hồ sơ cá nhân</h1>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-3">Đang tải thông tin...</p>
      </v-col>
    </v-row>

    <template v-else>
      <v-row>
        <v-col cols="12" md="3">
          <v-card outlined class="mb-4">
            <v-card-text class="text-center">
              <v-avatar size="120" class="mb-4">
                <v-img v-if="userProfile.avatar" :src="userProfile.avatar" alt="Avatar"></v-img>
                <v-icon v-else size="120" color="grey lighten-1">mdi-account-circle</v-icon>
              </v-avatar>
              
              <h2 class="text-h5 mb-1">{{ fullName }}</h2>
              <p class="text-body-2 grey--text mb-3">Thành viên từ {{ formattedJoinDate }}</p>

              <v-btn small outlined color="primary" @click="openAvatarDialog">
                <v-icon left small>mdi-camera</v-icon>
                Cập nhật ảnh đại diện
              </v-btn>
            </v-card-text>
          </v-card>

          <v-list nav dense rounded>
            <v-list-item-group v-model="selectedTab" mandatory color="primary">
              <v-list-item value="profile">
                <v-list-item-icon>
                  <v-icon>mdi-account-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Thông tin cá nhân</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              
              <v-list-item value="security">
                <v-list-item-icon>
                  <v-icon>mdi-shield-account-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Bảo mật</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              
              <v-list-item value="notifications">
                <v-list-item-icon>
                  <v-icon>mdi-bell-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Thông báo</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              
              <v-divider class="my-2"></v-divider>
                <v-list-item to="/">
                <v-list-item-icon>
                  <v-icon>mdi-headset</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Yêu cầu hỗ trợ</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              
              <v-list-item to="/contact">
                <v-list-item-icon>
                  <v-icon>mdi-email-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Liên hệ hỗ trợ</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>

          <v-card outlined class="mt-4">
            <v-list>
              <v-list-item @click="logout" class="red--text">
                <v-list-item-icon>
                  <v-icon color="red">mdi-logout</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Đăng xuất</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="9">
          <!-- Thông tin cá nhân -->
          <v-card v-if="selectedTab === 'profile'" outlined>
            <v-card-title>
              <span>Thông tin cá nhân</span>
              <v-spacer></v-spacer>
              <v-btn 
                v-if="!isEditing" 
                small 
                color="primary" 
                @click="startEditing"
              >
                <v-icon left small>mdi-pencil</v-icon>
                Chỉnh sửa
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-form ref="profileForm" v-model="formValid">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.firstName"
                      label="Họ"
                      :disabled="!isEditing"
                      :rules="requiredRules"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.lastName"
                      label="Tên"
                      :disabled="!isEditing"
                      :rules="requiredRules"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.email"
                      label="Email"
                      type="email"
                      disabled
                      hint="Email không thể thay đổi"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.phoneNumber"
                      label="Số điện thoại"
                      type="tel"
                      :disabled="!isEditing"
                      :rules="phoneRules"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="formData.address"
                      label="Địa chỉ"
                      :disabled="!isEditing"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.city"
                      label="Thành phố"
                      :disabled="!isEditing"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-alert v-if="error" type="error" class="mt-4">
                  {{ error }}
                </v-alert>
                <v-card-actions v-if="isEditing">
                  <v-spacer></v-spacer>
                  <v-btn text @click="cancelEditing">Hủy</v-btn>
                  <v-btn color="primary" :loading="saving" @click="saveProfile" :disabled="!formValid">
                    Lưu thay đổi
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Cài đặt bảo mật -->
          <v-card v-else-if="selectedTab === 'security'" outlined>
            <v-card-title>Bảo mật tài khoản</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <h3 class="text-subtitle-1 mb-3">Đổi mật khẩu</h3>
              <v-form ref="passwordForm" v-model="passwordFormValid">
                <v-text-field
                  v-model="passwordData.currentPassword"
                  label="Mật khẩu hiện tại"
                  :append-icon="showPassword.current ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword.current ? 'text' : 'password'"
                  :rules="requiredRules"
                  @click:append="showPassword.current = !showPassword.current"
                ></v-text-field>
                
                <v-text-field
                  v-model="passwordData.newPassword"
                  label="Mật khẩu mới"
                  :append-icon="showPassword.new ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword.new ? 'text' : 'password'"
                  :rules="passwordRules"
                  @click:append="showPassword.new = !showPassword.new"
                ></v-text-field>
                
                <v-text-field
                  v-model="passwordData.confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  :append-icon="showPassword.confirm ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword.confirm ? 'text' : 'password'"
                  :rules="confirmPasswordRules"
                  @click:append="showPassword.confirm = !showPassword.confirm"
                ></v-text-field>
                
                <v-alert v-if="passwordError" type="error" class="mt-4">
                  {{ passwordError }}
                </v-alert>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    :loading="savingPassword"
                    @click="changePassword"
                    :disabled="!passwordFormValid"
                  >
                    Cập nhật mật khẩu
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Cài đặt thông báo -->
          <v-card v-else-if="selectedTab === 'notifications'" outlined>
            <v-card-title>Cài đặt thông báo</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-form ref="notificationForm">
                <v-switch
                  v-model="notificationSettings.email"
                  label="Nhận thông báo qua email"
                  color="primary"
                  hide-details
                  class="mb-4"
                ></v-switch>
                
                <v-switch
                  v-model="notificationSettings.sms"
                  label="Nhận thông báo qua SMS"
                  color="primary"
                  hide-details
                  class="mb-4"
                ></v-switch>
                
                <v-switch
                  v-model="notificationSettings.promotions"
                  label="Nhận thông tin khuyến mãi và ưu đãi"
                  color="primary"
                  hide-details
                  class="mb-4"
                ></v-switch>
                  <v-switch
                  v-model="notificationSettings.supportUpdates"
                  label="Nhận thông báo cập nhật dịch vụ hỗ trợ"
                  color="primary"
                  hide-details
                  class="mb-4"
                ></v-switch>

                <v-alert v-if="notificationError" type="error" class="mt-4">
                  {{ notificationError }}
                </v-alert>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    :loading="savingNotificationSettings"
                    @click="saveNotificationSettings"
                  >
                    Lưu cài đặt
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog cập nhật ảnh đại diện -->
    <v-dialog v-model="avatarDialog" max-width="500px">
      <v-card>
        <v-card-title>Cập nhật ảnh đại diện</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="avatarFile"
            accept="image/*"
            prepend-icon="mdi-camera"
            label="Chọn ảnh"
            :rules="avatarRules"
            show-size
            truncate-length="25"
          ></v-file-input>
          
          <div class="text-center" v-if="avatarPreview">
            <v-avatar size="150" class="mt-2 mb-3">
              <v-img :src="avatarPreview"></v-img>
            </v-avatar>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="avatarDialog = false">Hủy</v-btn>
          <v-btn 
            color="primary" 
            :disabled="!avatarFile" 
            :loading="uploadingAvatar"
            @click="uploadAvatar"
          >
            Cập nhật
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar thông báo -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from '@/plugins/axios';

export default {
  name: 'UserProfile',
  data() {
    return {
      selectedTab: 'profile',
      loading: false,
      saving: false,
      isEditing: false,
      error: null,
      formValid: true,
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        city: ''
      },
      requiredRules: [v => !!v || 'Trường này không được để trống'],
      phoneRules: [
        v => !v || /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/.test(v) || 'Số điện thoại không hợp lệ'
      ],
      showPassword: {
        current: false,
        new: false,
        confirm: false
      },
      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordError: null,
      passwordFormValid: false,
      savingPassword: false,
      passwordRules: [
        v => !!v || 'Vui lòng nhập mật khẩu mới',
        v => v.length >= 6 || 'Mật khẩu phải có ít nhất 6 ký tự'
      ],
      notificationSettings: {
        email: true,
        sms: false,
        promotions: true,
        courseUpdates: true
      },
      notificationError: null,
      savingNotificationSettings: false,
      avatarDialog: false,
      avatarFile: null,
      avatarPreview: null,
      avatarRules: [
        v => !v || v.size < 2000000 || 'Kích thước ảnh không được vượt quá 2MB'
      ],
      uploadingAvatar: false,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 3000
      }
    };
  },
  computed: {
    ...mapGetters({
      userProfile: 'auth/user'
    }),
    fullName() {
      return `${this.userProfile?.firstName || ''} ${this.userProfile?.lastName || ''}`.trim() || 'Người dùng';
    },
    formattedJoinDate() {
      if (!this.userProfile?.createdAt) return '';
      const date = new Date(this.userProfile.createdAt);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    confirmPasswordRules() {
      return [
        v => !!v || 'Vui lòng xác nhận mật khẩu mới',
        v => v === this.passwordData.newPassword || 'Mật khẩu xác nhận không khớp'
      ];
    }
  },
  watch: {
    userProfile: {
      immediate: true,
      handler(profile) {
        if (profile) {
          this.formData = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
            address: profile.address || '',
            city: profile.city || ''
          };
        }
      }
    },
    avatarFile(file) {
      if (!file) {
        this.avatarPreview = null;
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.avatarPreview = reader.result;
      };
    }
  },
  methods: {
    startEditing() {
      this.isEditing = true;
    },
    cancelEditing() {
      this.isEditing = false;
      // Reset form data to original values
      if (this.userProfile) {
        this.formData = {
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: this.userProfile.phoneNumber || '',
          address: this.userProfile.address || '',
          city: this.userProfile.city || ''
        };
      }
    },
    async saveProfile() {
      if (!this.$refs.profileForm.validate()) return;
      
      this.saving = true;
      this.error = null;
      
      try {
        await this.$store.dispatch('auth/updateProfile', this.formData);
        this.isEditing = false;
        this.showSnackbar('Thông tin cá nhân đã được cập nhật thành công', 'success');
      } catch (error) {
        this.error = error.response?.data?.message || 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.';
      } finally {
        this.saving = false;
      }
    },
    async changePassword() {
      if (!this.$refs.passwordForm.validate()) return;
      
      this.savingPassword = true;
      this.passwordError = null;
      
      try {
        await axios.post(`/api/auth/change-password`, {
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword
        });
        
        // Reset form
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        this.showSnackbar('Mật khẩu đã được thay đổi thành công', 'success');
      } catch (error) {
        this.passwordError = error.response?.data?.message || 'Không thể thay đổi mật khẩu. Vui lòng thử lại sau.';
      } finally {
        this.savingPassword = false;
      }
    },
    async saveNotificationSettings() {
      this.savingNotificationSettings = true;
      this.notificationError = null;
      
      try {
        await axios.post(`/api/auth/notification-settings`, this.notificationSettings);
        
        this.showSnackbar('Cài đặt thông báo đã được lưu', 'success');
      } catch (error) {
        this.notificationError = error.response?.data?.message || 'Không thể lưu cài đặt thông báo. Vui lòng thử lại sau.';
      } finally {
        this.savingNotificationSettings = false;
      }
    },
    openAvatarDialog() {
      this.avatarDialog = true;
      this.avatarFile = null;
      this.avatarPreview = null;
    },
    async uploadAvatar() {
      if (!this.avatarFile) return;
      
      this.uploadingAvatar = true;
      
      try {
        const formData = new FormData();
        formData.append('avatar', this.avatarFile);
        
        const response = await axios.post(`/api/auth/upload-avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Cập nhật thông tin người dùng trong store
        await this.$store.dispatch('auth/setUser', response.data.user);
        
        this.avatarDialog = false;
        this.showSnackbar('Ảnh đại diện đã được cập nhật', 'success');
      } catch (error) {
        this.showSnackbar('Không thể tải lên ảnh đại diện', 'error');
      } finally {
        this.uploadingAvatar = false;
      }
    },
    showSnackbar(text, color = 'success', timeout = 3000) {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout
      };
    },
    logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/login');
    }
  },
  async mounted() {
    this.loading = true;
    
    try {
      // Tải thông tin người dùng chi tiết nếu cần
      await this.$store.dispatch('auth/fetchUser');
      
      // Tải cài đặt thông báo (fake data cho đến khi có API thực)
      // Trong thực tế, bạn sẽ fetch từ API
      this.notificationSettings = {
        email: true,
        sms: false,
        promotions: true,
        courseUpdates: true
      };
    } catch (error) {
      this.error = 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.';
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
/* Thêm CSS tùy chỉnh nếu cần */
</style>