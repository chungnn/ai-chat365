<template>
  <div class="home">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">            <v-img
              src="https://via.placeholder.com/1200x400"
              height="400"
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            >
              <v-card-title>Chào mừng đến với Trung tâm hỗ trợ khách hàng</v-card-title>
            </v-img>
            <v-card-text>
              <p class="text-h6 text--primary">
                Giải pháp hỗ trợ thông minh với công nghệ AI tiên tiến
              </p>
              <p>Nhận hỗ trợ nhanh chóng và hiệu quả từ đội ngũ chuyên viên và trợ lý AI của chúng tôi</p>
            </v-card-text>            <v-card-actions>
              <v-btn
                color="primary"
                to="/"
                text
              >
                Bắt đầu hội thoại
              </v-btn>
              <v-btn
                color="primary"
                to="/contact"
                outlined
              >
                Liên hệ bộ phận hỗ trợ
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 mb-4">Dịch vụ hỗ trợ của chúng tôi</h2>
        </v-col>
      </v-row>
      
      <v-row>        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-tools</v-icon>
              Hỗ trợ kỹ thuật
            </v-card-title>
            <v-card-text>
              Giải quyết các vấn đề kỹ thuật, xử lý sự cố và hướng dẫn sử dụng các tính năng của sản phẩm.
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                Yêu cầu hỗ trợ
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-lightbulb</v-icon>
              Tư vấn giải pháp
            </v-card-title>
            <v-card-text>
              Tư vấn và đề xuất giải pháp phù hợp với nhu cầu cụ thể của khách hàng.
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                Tư vấn ngay
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-update</v-icon>
              Hỗ trợ nâng cấp
            </v-card-title>
            <v-card-text>
              Hướng dẫn quy trình nâng cấp sản phẩm và giải đáp thắc mắc liên quan đến tính năng mới.
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                Tìm hiểu thêm
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>      <v-row class="mt-10">
        <v-col cols="12">
          <h2 class="text-h4 mb-4">Tại sao chọn trung tâm hỗ trợ của chúng tôi?</h2>
        </v-col>
      </v-row>

      <v-row>        <v-col cols="12" md="4">
          <v-card height="100%" class="d-flex flex-column">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" class="white--text mr-3" size="36">
                <v-icon>mdi-clock-outline</v-icon>
              </v-avatar>
              Hỗ trợ 24/7
            </v-card-title>
            <v-card-text class="flex-grow-1">
              Đội ngũ hỗ trợ luôn sẵn sàng phục vụ 24/7, giúp bạn giải quyết vấn đề mọi lúc, mọi nơi thông qua trợ lý AI thông minh.
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card height="100%" class="d-flex flex-column">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" class="white--text mr-3" size="36">
                <v-icon>mdi-account-group</v-icon>
              </v-avatar>
              Chuyên viên giàu kinh nghiệm
            </v-card-title>
            <v-card-text class="flex-grow-1">
              Đội ngũ chuyên viên kỹ thuật giàu kinh nghiệm, được đào tạo chuyên sâu và luôn cập nhật các kỹ năng hỗ trợ mới nhất.
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card height="100%" class="d-flex flex-column">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" class="white--text mr-3" size="36">
                <v-icon>mdi-flash</v-icon>
              </v-avatar>
              Phản hồi nhanh chóng
            </v-card-title>
            <v-card-text class="flex-grow-1">
              Cam kết phản hồi nhanh chóng với thời gian đáp ứng chỉ trong vài phút, giúp giải quyết vấn đề của bạn không phải chờ đợi.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      loading: true
    }
  },  mounted() {
    // Có thể tải dữ liệu thống kê hỗ trợ hoặc các câu hỏi thường gặp ở đây
  }
}
</script>