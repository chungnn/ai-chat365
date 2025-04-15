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
              <v-card-title>{{ $t('home.welcome') }}</v-card-title>
            </v-img>
            <v-card-text>
              <p class="text-h6 text--primary">
                {{ $t('home.tagline') }}
              </p>
              <p>{{ $t('home.description') }}</p>
            </v-card-text>            <v-card-actions>
              <v-btn
                color="primary"
                to="/"
                text
              >
                {{ $t('home.startChat') }}
              </v-btn>
              <v-btn
                color="primary"
                to="/contact"
                outlined
              >
                {{ $t('home.contactSupport') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 mb-4">{{ $t('home.ourServices') }}</h2>
        </v-col>
      </v-row>
      
      <v-row>        <v-col cols="12" sm="6" md="4">          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-tools</v-icon>
              {{ $t('home.services.technical.title') }}
            </v-card-title>
            <v-card-text>
              {{ $t('home.services.technical.description') }}
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                {{ $t('home.services.technical.button') }}
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-lightbulb</v-icon>
              {{ $t('home.services.consulting.title') }}
            </v-card-title>
            <v-card-text>
              {{ $t('home.services.consulting.description') }}
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                {{ $t('home.services.consulting.button') }}
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">          <v-card class="mx-auto" outlined>
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-update</v-icon>
              {{ $t('home.services.upgrade.title') }}
            </v-card-title>
            <v-card-text>
              {{ $t('home.services.upgrade.description') }}
            </v-card-text>
            <v-card-actions>
              <v-btn text color="primary" to="/">
                {{ $t('home.services.upgrade.button') }}
                <v-icon small class="ml-1">mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>      <v-row class="mt-10">
        <v-col cols="12">
          <h2 class="text-h4 mb-4">{{ $t('home.whyChooseUs') }}</h2>
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