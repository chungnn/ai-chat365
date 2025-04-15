<template>
  <div class="about-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 mb-5">Về chúng tôi</h1>
        </v-col>
      </v-row>

      <v-row class="mb-10">
        <v-col cols="12" md="6">          <v-img
            src="https://via.placeholder.com/600x400?text=Customer+Support+Center"
            max-height="400"
            class="rounded-lg"
          ></v-img>
        </v-col>
        <v-col cols="12" md="6">          <h2 class="text-h5 mb-4">Trung tâm hỗ trợ khách hàng - Giải pháp tức thì</h2>
          <p class="text-body-1 mb-4">
            Trung tâm hỗ trợ khách hàng của chúng tôi kết hợp công nghệ trí tuệ nhân tạo (AI) tiên tiến với đội ngũ chuyên viên hỗ trợ giàu kinh nghiệm, 
            nhằm cung cấp dịch vụ chăm sóc khách hàng chất lượng cao và hiệu quả.
          </p>
          <p class="text-body-1 mb-4">
            Được thành lập để đáp ứng nhu cầu hỗ trợ ngày càng tăng của khách hàng, chúng tôi không ngừng cải tiến hệ thống để đảm bảo mọi vấn đề của khách hàng 
            được giải quyết nhanh chóng và thỏa đáng.
          </p>
          <p class="text-body-1">
            Với đội ngũ hỗ trợ chuyên nghiệp và hệ thống AI thông minh, chúng tôi cam kết mang đến trải nghiệm hỗ trợ tốt nhất cho khách hàng 24/7.
          </p>
        </v-col>
      </v-row>

      <v-divider class="my-8"></v-divider>

      <v-row class="mb-10">
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-5">Tầm nhìn và sứ mệnh</h2>
        </v-col>
        <v-col cols="12" md="6">
          <v-card outlined height="100%" class="pa-5">
            <v-icon color="primary" size="36" class="mb-3">mdi-eye</v-icon>            <h3 class="text-h6 mb-3">Tầm nhìn</h3>
            <p>
              Trở thành hệ thống hỗ trợ khách hàng hàng đầu, tận dụng công nghệ trí tuệ nhân tạo kết hợp với chuyên viên hỗ trợ chuyên nghiệp, 
              mang đến giải pháp tức thì cho mọi vấn đề của khách hàng bất kể thời gian và địa điểm.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card outlined height="100%" class="pa-5">
            <v-icon color="primary" size="36" class="mb-3">mdi-flag</v-icon>            <h3 class="text-h6 mb-3">Sứ mệnh</h3>
            <p>
              Cung cấp dịch vụ hỗ trợ khách hàng nhanh chóng, hiệu quả và thân thiện thông qua kết hợp giữa trí tuệ nhân tạo và đội ngũ chuyên viên hỗ trợ, 
              đảm bảo mọi khách hàng đều nhận được sự hỗ trợ tối ưu và các giải pháp phù hợp cho vấn đề của họ.
            </p>
          </v-card>
        </v-col>
      </v-row>      <v-row class="mb-10">
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-5">Giá trị cốt lõi</h2>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card outlined height="100%" class="pa-4 text-center">
            <v-icon color="primary" size="48" class="mb-3">mdi-check-decagram</v-icon>
            <h3 class="text-h6 mb-2">Chất lượng dịch vụ</h3>
            <p class="text-body-2">
              Cam kết cung cấp dịch vụ hỗ trợ chuyên nghiệp, giải quyết vấn đề hiệu quả và đáp ứng nhu cầu của khách hàng.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card outlined height="100%" class="pa-4 text-center">
            <v-icon color="primary" size="48" class="mb-3">mdi-clock-fast</v-icon>
            <h3 class="text-h6 mb-2">Phản hồi nhanh chóng</h3>
            <p class="text-body-2">
              Ứng dụng AI để đảm bảo phản hồi tức thì cho mọi yêu cầu hỗ trợ, giảm thiểu thời gian chờ đợi của khách hàng.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card outlined height="100%" class="pa-4 text-center">
            <v-icon color="primary" size="48" class="mb-3">mdi-chart-bell-curve</v-icon>
            <h3 class="text-h6 mb-2">Đổi mới sáng tạo</h3>
            <p class="text-body-2">
              Không ngừng cải tiến và áp dụng công nghệ mới để nâng cao trải nghiệm hỗ trợ khách hàng.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card outlined height="100%" class="pa-4 text-center">
            <v-icon color="primary" size="48" class="mb-3">mdi-hand-heart</v-icon>
            <h3 class="text-h6 mb-2">Hỗ trợ 24/7</h3>
            <p class="text-body-2">
              Sẵn sàng hỗ trợ khách hàng mọi lúc mọi nơi, bất kể thời gian và địa điểm.
            </p>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-8"></v-divider>

      <v-row class="mb-10">
        <v-col cols="12">
          <h2 class="text-h4 text-center mb-5">Đội ngũ của chúng tôi</h2>
        </v-col>        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" max-width="400">
            <v-img
              height="250"
              src="https://via.placeholder.com/400x250?text=Founder"
            ></v-img>
            <v-card-title>Nguyễn Văn A</v-card-title>
            <v-card-subtitle>Nhà sáng lập & Giám đốc điều hành</v-card-subtitle>
            <v-card-text>
              <p>Thạc sĩ Quản trị kinh doanh, 15 năm kinh nghiệm trong lĩnh vực phát triển dịch vụ khách hàng và giải pháp hỗ trợ.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" max-width="400">
            <v-img
              height="250"
              src="https://via.placeholder.com/400x250?text=Support+Director"
            ></v-img>
            <v-card-title>Trần Thị B</v-card-title>
            <v-card-subtitle>Giám đốc hỗ trợ khách hàng</v-card-subtitle>
            <v-card-text>
              <p>Thạc sĩ Quản trị dịch vụ, 20 năm kinh nghiệm trong lĩnh vực xây dựng hệ thống hỗ trợ khách hàng chuyên nghiệp.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="mx-auto" max-width="400">
            <v-img
              height="250"
              src="https://via.placeholder.com/400x250?text=CTO"
            ></v-img>
            <v-card-title>Lê Văn C</v-card-title>
            <v-card-subtitle>Giám đốc công nghệ</v-card-subtitle>
            <v-card-text>
              <p>Thạc sĩ Khoa học Máy tính, chuyên gia về ứng dụng AI trong hệ thống hỗ trợ khách hàng với 10 năm kinh nghiệm.</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-8"></v-divider>      <v-row>
        <v-col cols="12" class="text-center">
          <h2 class="text-h4 mb-5">Bắt đầu trải nghiệm hỗ trợ cùng chúng tôi</h2>
          <v-btn color="primary" x-large class="mr-4" to="/">
            <v-icon left>mdi-headset</v-icon>
            Nhận hỗ trợ ngay
          </v-btn>
          <v-btn outlined color="primary" x-large to="/contact">
            <v-icon left>mdi-email</v-icon>
            Liên hệ với chúng tôi
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',  metaInfo: {
    title: 'Về chúng tôi - Trung tâm hỗ trợ khách hàng'
  }
}
</script>

<style scoped>
.about-page {
  padding: 20px 0;
}
</style>