<template>
  <div class="language-selector">
    <select v-model="selectedLocale" @change="changeLanguage" class="lang-select">
      <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLanguage } from '@/plugins/i18n';

export default {
  name: 'LanguageSelector',
  setup() {
    const { t, locale } = useI18n();
    const selectedLocale = ref(locale.value);    const availableLanguages = ref([
      { code: 'en', name: t('common.english') },
      { code: 'vi', name: t('common.vietnamese') }
    ]);    const changeLanguage = async () => {
      try {
        const success = await setLanguage(selectedLocale.value);
        if (success) {
          // Có thể thêm thông báo thành công nếu cần
          console.log(t('common.languageChanged'));
        } else {
          // Xử lý trường hợp đổi ngôn ngữ thất bại
          console.error(t('common.languageChangeFailed'));
        }
      } catch (error) {
        console.error('Error changing language:', error);
      }
    };

    // Đảm bảo selectedLocale luôn đồng bộ với locale hiện tại
    onMounted(() => {
      selectedLocale.value = locale.value;
    });

    return {
      selectedLocale,
      availableLanguages,
      changeLanguage,
      t
    };
  }
}
</script>

<style scoped>
.language-selector {
  display: inline-block;
  margin: 0 10px;
}

.lang-select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}
</style>
