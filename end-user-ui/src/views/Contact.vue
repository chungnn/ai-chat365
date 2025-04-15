<template>
  <div class="contact-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 mb-5">Liên hệ với chúng tôi</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <h2 class="text-h5 mb-4">Thông tin liên hệ</h2>
          <v-list class="transparent">
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-map-marker</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Địa chỉ</v-list-item-title>
                <v-list-item-subtitle>123 Đường Nguyễn Du, Quận 1, TP. Hồ Chí Minh</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-phone</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Điện thoại</v-list-item-title>
                <v-list-item-subtitle>0987 654 321</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-email</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>support@helpdesk.vn</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>            <v-list-item>
              <v-list-item-icon>
                <v-icon color="primary">mdi-clock</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Giờ hỗ trợ</v-list-item-title>
                <v-list-item-subtitle>Hỗ trợ trực tuyến: 24/7<br>Hỗ trợ qua điện thoại: Thứ 2 - Thứ 6: 8:00 - 20:00</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <h3 class="text-h6 my-4">Kết nối với chúng tôi</h3>
          <div class="social-icons d-flex">
            <v-btn icon color="indigo" class="mr-2">
              <v-icon>mdi-facebook</v-icon>
            </v-btn>
            <v-btn icon color="red" class="mr-2">
              <v-icon>mdi-youtube</v-icon>
            </v-btn>
            <v-btn icon color="blue lighten-3" class="mr-2">
              <v-icon>mdi-twitter</v-icon>
            </v-btn>
            <v-btn icon color="pink accent-2">
              <v-icon>mdi-instagram</v-icon>
            </v-btn>
          </div>

          <v-card class="mt-6" elevation="2">
            <v-card-title class="primary white--text">
              <v-icon left color="white">mdi-map</v-icon>
              Bản đồ
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="map-container">
                <!-- Placeholder for the map -->
                <v-img
                  src="https://via.placeholder.com/600x300?text=Google+Map"
                  height="300"
                  alt="Map Location"
                ></v-img>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">          <v-card elevation="3" class="pa-4">
            <v-card-title class="headline">Gửi yêu cầu hỗ trợ</v-card-title>
            <v-card-subtitle>Chúng tôi sẽ phản hồi trong vòng 2 giờ làm việc</v-card-subtitle>
            <v-card-text>
              <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submitForm">
                <v-text-field
                  v-model="formData.name"
                  :rules="nameRules"
                  label="Họ và tên"
                  required
                  outlined
                  dense
                ></v-text-field>

                <v-text-field
                  v-model="formData.email"
                  :rules="emailRules"
                  label="Email"
                  required
                  outlined
                  dense
                ></v-text-field>

                <v-text-field
                  v-model="formData.phone"
                  :rules="phoneRules"
                  label="Số điện thoại"
                  required
                  outlined
                  dense
                ></v-text-field>

                <v-select
                  v-model="formData.subject"
                  :items="subjects"
                  label="Chủ đề"
                  required
                  outlined
                  dense
                ></v-select>

                <v-textarea
                  v-model="formData.message"
                  :rules="messageRules"
                  label="Nội dung"
                  required
                  outlined
                  counter
                  auto-grow
                ></v-textarea>

                <v-checkbox
                  v-model="formData.agreement"
                  :rules="[v => !!v || 'Bạn phải đồng ý với điều khoản để tiếp tục!']"
                  label="Tôi đồng ý với các điều khoản và điều kiện"
                  required
                ></v-checkbox>

                <v-alert
                  v-if="submitStatus.show"
                  :type="submitStatus.type"
                  dismissible
                  class="mb-4"
                >
                  {{ submitStatus.message }}
                </v-alert>

                <v-btn
                  :disabled="!valid"
                  color="primary"
                  class="mr-4"
                  type="submit"
                >
                  Gửi thông tin
                </v-btn>
                <v-btn
                  color="grey lighten-1"
                  text
                  @click="resetForm"
                >
                  Xóa thông tin
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <v-card class="mt-6" outlined>
            <v-card-title>
              <v-icon left color="amber">mdi-frequently-asked-questions</v-icon>
              Câu hỏi thường gặp
            </v-card-title>
            <v-card-text>
              <p>Nếu bạn có thắc mắc, hãy tham khảo <router-link to="/faq">trang FAQ</router-link> của chúng tôi hoặc liên hệ trực tiếp với đội ngũ hỗ trợ qua hotline hoặc email.</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'ContactPage',  metaInfo: {
    title: 'Liên hệ - Trung tâm hỗ trợ khách hàng'
  },
  data() {
    return {
      valid: true,
      formData: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        agreement: false
      },
      nameRules: [
        v => !!v || 'Họ tên không được để trống',
        v => (v && v.length >= 3) || 'Họ tên phải ít nhất 3 ký tự'
      ],
      emailRules: [
        v => !!v || 'Email không được để trống',
        v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
      ],
      phoneRules: [
        v => !!v || 'Số điện thoại không được để trống',
        v => /^[0-9]{10}$/.test(v) || 'Số điện thoại phải có 10 chữ số'
      ],
      messageRules: [
        v => !!v || 'Nội dung không được để trống',
        v => (v && v.length >= 10) || 'Nội dung phải ít nhất 10 ký tự'
      ],      subjects: [
        'Vấn đề kỹ thuật',
        'Câu hỏi về tài khoản',
        'Góp ý cải thiện',
        'Báo cáo sự cố',
        'Vấn đề khác'
      ],
      submitStatus: {
        show: false,
        type: '',
        message: ''
      }
    }
  },
  methods: {
    submitForm() {
      if (this.$refs.form.validate()) {
        // Gửi form đi (có thể thêm API call ở đây)        // Giả lập submission
        this.submitStatus = {
          show: true,
          type: 'success',
          message: 'Cảm ơn bạn đã gửi yêu cầu hỗ trợ! Đội ngũ kỹ thuật của chúng tôi sẽ phản hồi trong vòng 2 giờ làm việc.'
        }
        
        // Trong môi trường thực tế, bạn sẽ gọi API ở đây
        /*
        this.$store.dispatch('sendContactForm', this.formData)
          .then(() => {
            this.submitStatus = {
              show: true,
              type: 'success',
              message: 'Cảm ơn bạn đã gửi thông tin! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.'
            }
            this.resetForm()
          })
          .catch(error => {
            this.submitStatus = {
              show: true,
              type: 'error',
              message: 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.'
            }
            console.error('Error submitting form:', error)
          })
        */
      }
    },
    resetForm() {
      this.$refs.form.reset()
      this.submitStatus.show = false
    }
  }
}
</script>

<style scoped>
.contact-page {
  padding: 20px 0;
}
.map-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
}
</style>