<template>
  <div class="language-switcher">
    <select 
      v-model="currentLanguage" 
      @change="changeLanguage"
      class="language-select"
    >
      <option value="en">{{ $t('common.english') }}</option>
      <option value="vi">{{ $t('common.vietnamese') }}</option>
    </select>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLanguage } from '@/plugins/i18n';

export default {
  name: 'LanguageSwitcher',
  setup() {
    const i18n = useI18n();
    const currentLanguage = ref(i18n.locale.value);

    const changeLanguage = async () => {
      try {
        const success = await setLanguage(currentLanguage.value);
        if (!success) {
          console.error('Failed to change language on server');
          // Khôi phục lại giá trị cũ nếu lỗi
          currentLanguage.value = i18n.locale.value;
        }
      } catch (error) {
        console.error('Error changing language:', error);
        currentLanguage.value = i18n.locale.value;
      }
    };

    return {
      currentLanguage,
      changeLanguage
    };
  }
};
</script>

<style scoped>
.language-switcher {
  display: inline-block;
  margin-left: 10px;
}

.language-select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>
