<template>
  <div class="not-found-container">
    <v-container class="text-center">
      <v-row justify="center" align="center">
        <v-col cols="12">
          <v-img
            src="https://via.placeholder.com/600x300?text=404+Not+Found"
            alt="404 Not Found"
            max-width="500"
            class="mx-auto mb-6"
          ></v-img>
            <h1 class="text-h2 font-weight-bold mb-4">404</h1>
          <h2 class="text-h4 mb-6">{{ $t('notFound.title') }}</h2>
          
          <p class="text-body-1 mb-8">
            {{ $t('notFound.description') }}
          </p>
            <v-btn
            color="primary"
            x-large
            class="mb-4 mx-2"
            to="/"
          >
            <v-icon left>mdi-home</v-icon>
            {{ $t('notFound.backToHome') }}
          </v-btn>
            <v-btn
            outlined
            color="primary"
            x-large
            class="mb-4 mx-2"
            to="/contact"
          >
            <v-icon left>mdi-headset</v-icon>
            {{ $t('notFound.contactSupport') }}
          </v-btn>
        </v-col>
      </v-row>

      <v-row justify="center" class="mt-10">
        <v-col cols="12" md="8">
          <v-card outlined class="mb-6">            <v-card-title>
              <v-icon left color="primary">mdi-help-circle</v-icon>
              {{ $t('notFound.suggestions.title') }}
            </v-card-title>
            <v-card-text>
              <v-list dense>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="green">mdi-check-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t('notFound.suggestions.checkUrl') }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="green">mdi-check-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t('notFound.suggestions.useSearch') }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="green">mdi-check-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ $t('notFound.suggestions.goBack') }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>          <div class="text-center">
            <p class="text-body-2">
              {{ $t('notFound.contactMessage') }}
              <router-link to="/contact" class="font-weight-medium">{{ $t('notFound.contactUs') }}</router-link> 
              {{ $t('notFound.forHelp') }}
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {  name: 'NotFoundPage',
  metaInfo() {
    return {
      title: this.$t('notFound.metaTitle')
    }
  }
}
</script>

<style scoped>
.not-found-container {
  padding: 40px 0;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
}
</style>