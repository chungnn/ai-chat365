<template>
  <div class="language-switcher">
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
        >
          <v-icon>mdi-translate</v-icon>
          {{ $t('common.language') }}
        </v-btn>
      </template>      <v-list>
        <v-list-item
          v-for="(lang, i) in availableLanguages"
          :key="i"
          :value="lang.code"
          @click="handleLanguageChange(lang.code)"
        >
          <v-list-item-title>{{ lang.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'LanguageSwitcher',
  
  data() {
    return {
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Tiếng Việt' }
      ]
    };
  },
  
  mounted() {
    // Cập nhật danh sách ngôn ngữ với bản dịch hiện tại khi component được tải
    this.updateLanguageNames();
  },  methods: {
    ...mapActions('language', ['changeLanguage', 'saveLanguagePreference']),
    
    updateLanguageNames() {
      try {
        // Cập nhật tên ngôn ngữ dựa trên bản dịch hiện tại
        if (this.$i18n && this.$i18n.global && typeof this.$i18n.global.t === 'function') {
          this.availableLanguages = [
            { code: 'en', name: this.$i18n.global.t('common.english') || 'English' },
            { code: 'vi', name: this.$i18n.global.t('common.vietnamese') || 'Tiếng Việt' }
          ];
        }
      } catch (error) {
        console.error('Error updating language names:', error);
      }
    },
    
    async handleLanguageChange(langCode) {
      // Gọi action changeLanguage từ store
      await this.changeLanguage({ 
        langCode, 
        i18n: this.$i18n 
      });
      
      // Cập nhật lại tên ngôn ngữ sau khi thay đổi ngôn ngữ
      this.updateLanguageNames();
      
      // Nếu người dùng đã đăng nhập, lưu tùy chọn ngôn ngữ vào hồ sơ
      if (this.$store.getters['auth/isAuthenticated']) {
        await this.saveLanguagePreference();
      }
    }
  }
};
</script>

<style scoped>
.language-switcher {
  margin-left: 10px;
}
</style>
