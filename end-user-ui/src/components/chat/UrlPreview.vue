<template>
  <div class="url-preview" v-if="url">
    <v-skeleton-loader v-if="loading" type="card" height="120px" />    <div v-else-if="isVideoUrl" class="video-embed-container">
      <div class="video-player">
        <iframe 
          :src="embedUrl" 
          frameborder="0" 
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
      <div class="video-info">
        <div class="url-preview-title">{{ (metadata && metadata.title) || truncateUrl(url) }}</div>
        <div v-if="metadata && metadata.description" class="url-preview-description">
          {{ truncateDescription(metadata.description) }}
        </div>
        <div class="video-metadata">
          <span class="url-preview-domain">{{ extractDomain(url) }}</span>
          <span v-if="metadata && metadata.author" class="video-author">
            · {{ metadata.author }}
          </span>
        </div>
      </div>
    </div>
    <v-card v-else class="url-preview-card" @click="openUrl">
      <div class="url-preview-content">
        <div v-if="metadata && metadata.image" class="url-preview-image">
          <v-img 
            :src="metadata.image" 
            :alt="metadata.title || url" 
            width="100%" 
            height="100%"
            cover
          ></v-img>
        </div>
        <div class="url-preview-info">
          <div class="url-preview-title">{{ (metadata && metadata.title) || truncateUrl(url) }}</div>
          <div v-if="metadata && metadata.description" class="url-preview-description">
            {{ truncateDescription(metadata.description) }}
          </div>
          <div class="url-preview-domain">{{ extractDomain(url) }}</div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'UrlPreview',
  props: {
    url: {
      type: String,
      required: true
    }
  },  data() {
    return {
      error: false,
      videoType: null
    };
  },
  computed: {
    ...mapGetters('urlMetadata', {
      getMetadataByUrl: 'getMetadataByUrl',
      isMetadataLoading: 'isLoading'
    }),
    
    metadata() {
      return this.getMetadataByUrl(this.url);
    },
    
    loading() {
      return this.isMetadataLoading;
    },
    
    isVideoUrl() {
      return this.videoType !== null;
    },
    
    embedUrl() {
      if (!this.url || !this.videoType) return '';
      
      switch(this.videoType) {
        case 'youtube':
          return `https://www.youtube.com/embed/${this.getYoutubeVideoId(this.url)}`;
        case 'vimeo':
          return `https://player.vimeo.com/video/${this.getVimeoVideoId(this.url)}`;
        case 'dailymotion':
          return `https://www.dailymotion.com/embed/video/${this.getDailymotionVideoId(this.url)}`;
        default:
          return '';
      }
    }
  },  mounted() {
    this.detectVideoType();
    this.fetchMetadata();
  },
  
  watch: {
    metadata: {
      handler(newValue) {
        // Update video metadata if available and it's a video URL
        if (newValue && this.isVideoUrl && (!newValue.title || !newValue.description)) {
          // If metadata is missing important fields, we might want to enhance it
          this.enhanceVideoMetadata();
        }
      },
      immediate: false
    }
  },  methods: {
    ...mapActions('urlMetadata', ['fetchUrlMetadata']),
    
    fetchMetadata() {
      this.fetchUrlMetadata(this.url);
    },
    
    detectVideoType() {
      if (!this.url) return;
      
      // Detect YouTube
      if (this.isYoutubeUrl(this.url)) {
        this.videoType = 'youtube';
        return;
      }
      
      // Detect Vimeo
      if (this.isVimeoUrl(this.url)) {
        this.videoType = 'vimeo';
        return;
      }
      
      // Detect Dailymotion
      if (this.isDailymotionUrl(this.url)) {
        this.videoType = 'dailymotion';
        return;
      }
      
      // Not a recognized video URL
      this.videoType = null;
    },
    
    isYoutubeUrl(url) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
      return youtubeRegex.test(url);
    },
    
    isVimeoUrl(url) {
      const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+/;
      return vimeoRegex.test(url);
    },
    
    isDailymotionUrl(url) {
      const dailymotionRegex = /^(https?:\/\/)?(www\.)?(dailymotion\.com|dai\.ly)\/.+/;
      return dailymotionRegex.test(url);
    },
    
    getYoutubeVideoId(url) {
      let videoId = '';
      
      // Handle youtube.com/watch?v=VIDEO_ID format
      const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (watchMatch) return watchMatch[1];
      
      // Handle youtu.be/VIDEO_ID format
      const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
      if (shortMatch) return shortMatch[1];
      
      // Handle youtube.com/embed/VIDEO_ID format
      const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/);
      if (embedMatch) return embedMatch[1];
      
      // Handle YouTube Shorts format (youtube.com/shorts/VIDEO_ID)
      const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
      if (shortsMatch) return shortsMatch[1];
      
      return videoId;
    },
    
    getVimeoVideoId(url) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? match[1] : '';
    },
    
    getDailymotionVideoId(url) {
      let match = url.match(/dailymotion\.com\/(?:video\/)([\w]+)/);
      if (match) return match[1];
      
      match = url.match(/dai\.ly\/([\w]+)/);
      return match ? match[1] : '';
    },
    
    truncateUrl(url) {
      if (url.length > 50) {
        return url.substring(0, 50) + '...';
      }
      return url;
    },
    
    truncateDescription(desc) {
      if (desc && desc.length > 100) {
        return desc.substring(0, 100) + '...';
      }
      return desc;
    },
    
    extractDomain(url) {
      try {
        const domain = new URL(url).hostname;
        return domain;
      } catch (e) {
        return url;
      }
    },
    
    enhanceVideoMetadata() {
      if (!this.metadata || !this.metadata.title) {
        // Nếu không có tiêu đề, chúng ta có thể dispatch một action để cập nhật metadata trong store
        // Hoặc cũng có thể sử dụng thông tin từ video ID để hiển thị
        const domain = this.extractDomain(this.url);
        const videoId = this.videoType === 'youtube' ? this.getYoutubeVideoId(this.url) :
                        this.videoType === 'vimeo' ? this.getVimeoVideoId(this.url) :
                        this.getDailymotionVideoId(this.url);
          // Đối với từng video platform, có thể tạo thông tin phù hợp
        const title = `${this.videoType.charAt(0).toUpperCase() + this.videoType.slice(1)} ${this.$t('common.video')}: ${videoId}`;
        
        // Không cập nhật trực tiếp metadata ở đây vì nó đã được quản lý bởi Vuex
        // Tuy nhiên, có thể dispatch một action để cập nhật nếu cần
      }
    },
    
    openUrl() {
      window.open(this.url, '_blank');
    }
  }
};
</script>

<style scoped>
.url-preview {
  margin-top: 8px;
  max-width: 100%;
}

.url-preview-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.url-preview-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.url-preview-content {
  display: flex;
  padding: 8px;
}

.url-preview-image {
  width: 80px;
  height: 80px;
  min-width: 80px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f0f0f0;
}

.url-preview-info {
  padding: 0 12px;
  overflow: hidden;
  flex: 1;
}

.video-embed-container {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.video-player {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.video-player iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-info {
  padding: 8px 12px;
  background-color: #f8f8f8;
  flex: 1;
}

.url-preview-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-preview-description {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.url-preview-domain {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}
</style>
