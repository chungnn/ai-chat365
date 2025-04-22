<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ $t('knowledge.extractedKnowledge') }}</h2>
        <button @click="closeModal" class="btn-close">×</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>{{ $t('knowledge.extracting') }}</p>
        </div>
        
        <div v-else-if="error" class="error-container">
          <p>{{ error }}</p>
          <button @click="closeModal" class="btn btn-secondary mt-3">{{ $t('common.close') }}</button>
        </div>
        
        <div v-else>
          <div v-if="extractedItems.length === 0" class="empty-container">
            <p>{{ $t('knowledge.noExtractedItems') }}</p>
          </div>
          
          <div v-else>
            <div v-for="(item, index) in extractedItems" :key="index" class="knowledge-item">
              <div class="knowledge-item-header">
                <h3>{{ item.title }}</h3>
                <div class="knowledge-actions">
                  <button @click="removeItem(index)" class="btn-icon">🗑️</button>
                </div>
              </div>
              <div class="knowledge-item-content">
                <textarea 
                  v-model="item.content" 
                  class="knowledge-content-textarea" 
                  rows="4"
                ></textarea>
              </div>
            </div>
            
            <div class="form-actions mt-4">
              <button @click="closeModal" class="btn btn-secondary">{{ $t('common.cancel') }}</button>
              <button @click="saveKnowledge" class="btn btn-primary" :disabled="saving || extractedItems.length === 0">
                {{ saving ? $t('knowledge.saving') : $t('knowledge.saveAll') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

export default {
  name: 'KnowledgeExtractionModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    chatId: {
      type: String,
      required: true
    },
    sessionId: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const store = useStore();
    const { t } = useI18n();
    
    // State variables
    const loading = ref(false);
    const saving = ref(false);
    const error = ref(null);
    const extractedItems = ref([]);
    
    // Computed properties
    // const chatApiClient = computed(() => store.getters['chat/chatApiClient']);
    
    // Methods
    const closeModal = () => {
      emit('close');
    };
    
    const fetchExtractedKnowledge = async () => {
      if (!props.chatId) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await store.dispatch('chat/extractKnowledge', {
          chatId: props.chatId,
          sessionId: props.sessionId
        });
        
        if (response && Array.isArray(response)) {
          extractedItems.value = response;
        } else {
          throw new Error(t('knowledge.extractionError'));
        }
      } catch (err) {
        console.error('Error extracting knowledge:', err);
        error.value = err.message || t('knowledge.extractionError');
      } finally {
        loading.value = false;
      }
    };
    
    const saveKnowledge = async () => {
      if (extractedItems.value.length === 0) return;
      
      saving.value = true;
      error.value = null;
      
      try {
        // Save all knowledge items
        const results = await Promise.all(
          extractedItems.value.map(item => 
            store.dispatch('knowledge/createKnowledge', item)
          )
        );
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: t('knowledge.savedSuccessfully', { count: results.length })
        });
        
        emit('saved', results);
        closeModal();
      } catch (err) {
        console.error('Error saving knowledge:', err);
        error.value = err.message || t('knowledge.savingError');
      } finally {
        saving.value = false;
      }
    };
    
    const removeItem = (index) => {
      extractedItems.value.splice(index, 1);
    };
      // Watch for show prop changes to fetch data when modal is opened
    watch(
      () => props.show,
      (newValue) => {
        if (newValue && props.chatId) {
          // Add a slight delay to ensure component is fully mounted
          setTimeout(() => {
            fetchExtractedKnowledge();
          }, 100);
        }
      }
    );
    
    return {
      loading,
      saving,
      error,
      extractedItems,
      closeModal,
      saveKnowledge,
      removeItem
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.loading-container, .error-container, .empty-container {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4CAF50;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.knowledge-item {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.knowledge-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.knowledge-item-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.knowledge-item-content {
  padding: 15px;
}

.knowledge-content-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.knowledge-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mt-3 {
  margin-top: 15px;
}

.mt-4 {
  margin-top: 20px;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3e8e41;
}

.btn-secondary {
  background-color: #f1f1f1;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}
</style>
