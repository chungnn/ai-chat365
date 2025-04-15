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
      </template>
      <v-list>
        <v-list-item
          v-for="(lang, i) in availableLanguages"
          :key="i"
          :value="lang.code"
          @click="changeLanguage(lang.code)"
        >
          <v-list-item-title>{{ lang.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'LanguageSwitcher',  data() {
    return {
      availableLanguages: [
        { code: 'en', name: this.$t('common.english') },
        { code: 'vi', name: this.$t('common.vietnamese') }
      ]
    };
  },
  methods: {
    changeLanguage(langCode) {
      this.$i18n.locale = langCode;
      localStorage.setItem('userLanguage', langCode);
      
      // Refresh available languages with new translations
      this.availableLanguages = [
        { code: 'en', name: this.$t('common.english') },
        { code: 'vi', name: this.$t('common.vietnamese') }
      ];
    }
  }
};
</script>

<style scoped>
.language-switcher {
  margin-left: 10px;
}
</style>
