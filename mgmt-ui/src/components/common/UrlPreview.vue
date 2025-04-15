<template>
  <div class="url-preview" v-if="url">
    <div v-if="loading" class="url-preview-loading">
      <div class="loading-spinner"></div>
    </div>
    <div v-else-if="isVideoUrl" class="video-embed-container">
      <div class="video-player">
        <iframe 
          :src="embedUrl" 
          frameborder="0" 
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
      <div class="video-info">
        <div class="url-preview-title">{{ (previewData && previewData.title) || truncateUrl(url) }}</div>
        <div v-if="previewData && previewData.description" class="url-preview-description">
          {{ truncateDescription(previewData.description) }}
        </div>
        <div class="video-metadata">
          <span class="url-preview-domain">{{ extractDomain(url) }}</span>
          <span v-if="previewData && previewData.author" class="video-author">
            · {{ previewData.author }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="url-preview-card" @click="openUrl">
      <div class="url-preview-content">
        <div v-if="previewData && previewData.image" class="url-preview-image">
          <img 
            :src="previewData.image" 
            :alt="previewData.title || url" 
            width="100%" 
            height="100%"
          />
        </div>
        <div class="url-preview-info">
          <div class="url-preview-title">{{ (previewData && previewData.title) || truncateUrl(url) }}</div>
          <div v-if="previewData && previewData.description" class="url-preview-description">
            {{ truncateDescription(previewData.description) }}
          </div>
          <div class="url-preview-domain">{{ extractDomain(url) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'UrlPreview',
  props: {
    url: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      previewData: null,
      error: false,
      videoType: null
    };
  },  computed: {
    ...mapGetters({
      getMetadataByUrl: 'urlMetadata/getMetadataByUrl',
      isLoadingMetadata: 'urlMetadata/isLoading'
    }),
    
    loading() {
      return this.isLoadingMetadata;
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
  },
  mounted() {
    this.detectVideoType();
    this.fetchPreviewData();
  },
  
  watch: {
    previewData: {
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
    ...mapActions({
      fetchUrlMetadata: 'urlMetadata/fetchUrlMetadata'
    }),
    
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
    async fetchPreviewData() {
      this.error = false;
      
      try {
        // Use Vuex action to fetch URL metadata
        const metadata = await this.fetchUrlMetadata(this.url);
        this.previewData = metadata;
      } catch (error) {
        console.error('Error fetching URL preview:', error);
        this.error = true;
      }
    },
    
    extractTitle(url) {
      try {
        // Try to extract a title-like part from the URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          // Use the last path segment as a potential title
          const lastSegment = pathParts[pathParts.length - 1];
          // Replace hyphens and underscores with spaces and capitalize
          return lastSegment
            .replace(/[-_]/g, ' ')
            .replace(/\.[^/.]+$/, '') // Remove file extension if present
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return urlObj.hostname;
      } catch (e) {
        return this.url;
      }
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
      // This method can be extended to fetch additional metadata for videos if needed
      // For example, you could make specific API calls to YouTube/Vimeo APIs
      // For now, we'll just make sure we use what we have effectively
      if (!this.previewData.title) {
        // If title is missing, use a more descriptive one based on video type
        
        const videoId = this.videoType === 'youtube' ? this.getYoutubeVideoId(this.url) :
                       this.videoType === 'vimeo' ? this.getVimeoVideoId(this.url) :
                       this.getDailymotionVideoId(this.url);
        
        this.previewData.title = `${this.videoType.charAt(0).toUpperCase() + this.videoType.slice(1)} Video: ${videoId}`;
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
  border-radius: 8px;
  overflow: hidden;
}

.url-preview-loading {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4a6cf7;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.url-preview-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
}

.url-preview-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.url-preview-content {
  display: flex;
  padding: 12px;
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
  background-color: white;
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
  padding: 12px;
  background-color: #f8f8f8;
}

.url-preview-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #334155;
}

.url-preview-description {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.url-preview-domain {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.video-metadata {
  display: flex;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.video-author {
  margin-left: 4px;
}
</style>
