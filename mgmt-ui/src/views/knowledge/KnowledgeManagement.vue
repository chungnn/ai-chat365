<template>
  <div class="knowledge-management">
    <div class="header-area">
      <h1>{{ $t('knowledge.management') }}</h1>
      <button @click="openAddModal" class="btn btn-primary">
        <span class="icon">➕</span> {{ $t('knowledge.addNew') }}
      </button>
    </div>

    <div class="search-area">
      <input 
        type="text" 
        v-model="searchTerm" 
        placeholder="{{ $t('knowledge.search') }}" 
        class="search-input"
        @input="handleSearch"
      />
    </div>

    <div v-if="isLoading" class="loading-container">      <div class="spinner"></div>
      <p>{{ $t('knowledge.loading') }}</p>
    </div>

    <div v-else-if="hasError" class="error-container">
      <p>{{ hasError }}</p>
      <button @click="fetchKnowledge" class="btn btn-secondary">{{ $t('common.submit') }}</button>
    </div>

    <div v-else-if="knowledgeItems.length === 0" class="empty-container">
      <p>{{ $t('knowledge.empty') }}</p>
    </div>    <div v-else class="knowledge-list">      <div v-for="item in knowledgeItems" :key="item.id" class="knowledge-card">
        <div class="knowledge-header">
          <h3>{{ item.title || truncateText(item.content, 50) }}</h3>
          <div class="knowledge-actions">
            <button @click="editKnowledge(item)" class="btn-icon">✏️</button>
            <button @click="confirmDelete(item)" class="btn-icon">🗑️</button>
          </div>
        </div>
        <div class="knowledge-content">
          <p class="knowledge-text">{{ truncateText(item.content, 150) }}</p>
        </div>
        <div class="knowledge-footer">
          <span class="timestamp">{{ $t('knowledge.updated') }}: {{ formatDate(item.updatedAt) }}</span>
        </div>
      </div>
    </div>    <!-- Modal for adding/editing knowledge -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isEditing ? $t('knowledge.edit') : $t('knowledge.addNew') }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </div>        <div class="modal-body">          
          <form @submit.prevent="submitKnowledge">
            <!-- Chỉ hiển thị trường tiêu đề khi đang chỉnh sửa -->
            <div class="form-group" v-if="isEditing">
              <label for="title">{{ $t('knowledge.title') }}</label>
              <input 
                id="title" 
                v-model="knowledgeForm.title" 
                required 
                :placeholder="$t('knowledge.titlePlaceholder')"
                type="text"
              />
            </div>
            
            <div class="form-group">
              <label for="content">{{ isEditing ? $t('knowledge.contentEditDescription') : $t('knowledge.contentDescription') }}</label>
              <textarea 
                id="content" 
                v-model="knowledgeForm.content" 
                required 
                :placeholder="$t('knowledge.contentPlaceholder')"
                rows="8"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">{{ $t('knowledge.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                {{ isEditing ? $t('knowledge.update') : $t('knowledge.add') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>    <!-- Confirmation dialog -->
    <div v-if="showDeleteConfirmation" class="modal-overlay">
      <div class="modal-container confirmation-dialog">
        <div class="modal-header">
          <h2>{{ $t('common.confirmDelete') }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ $t('knowledge.confirmDelete') }}</p>
          <div class="form-actions">
            <button @click="cancelDelete" class="btn btn-secondary">{{ $t('knowledge.cancel') }}</button>
            <button @click="deleteKnowledge" class="btn btn-danger" :disabled="isLoading">{{ $t('knowledge.delete') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

export default {
  name: 'KnowledgeManagement',  setup() {
    const store = useStore();
    const { t } = useI18n();
    const searchTerm = ref('');
    const showModal = ref(false);
    const isEditing = ref(false);
    const showDeleteConfirmation = ref(false);
    const selectedItem = ref(null);
      const knowledgeForm = reactive({
      id: null,
      title: '',
      content: ''
    });
    
    // Computed properties from Vuex store
    const knowledgeItems = computed(() => store.getters['knowledge/allKnowledgeItems']);
    const isLoading = computed(() => store.getters['knowledge/isLoading']);
    const hasError = computed(() => store.getters['knowledge/hasError']);
    
    const fetchKnowledge = () => {
      store.dispatch('knowledge/fetchKnowledge');
    };
    
    const handleSearch = () => {
      store.dispatch('knowledge/searchKnowledge', searchTerm.value);
    };
    
    const openAddModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };
    const editKnowledge = (item) => {
      isEditing.value = true;
      knowledgeForm.id = item.id;
      knowledgeForm.title = item.title || '';
      knowledgeForm.content = item.content;
      showModal.value = true;
    };
    
    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };
      const resetForm = () => {
      knowledgeForm.id = null;
      knowledgeForm.title = '';
      knowledgeForm.content = '';
    };
      const submitKnowledge = async () => {
      let knowledgeData = { ...knowledgeForm };
      
      // Nếu là thêm mới, tự động trích xuất tiêu đề từ dòng đầu tiên của nội dung
      if (!isEditing.value) {
        // Trích xuất dòng đầu tiên làm tiêu đề (tối đa 100 ký tự)
        const firstLine = knowledgeForm.content.split('\n')[0].trim();
        knowledgeData.title = firstLine.length > 100 ? firstLine.substring(0, 100) : firstLine;
      }
      
      const success = await (isEditing.value 
        ? store.dispatch('knowledge/updateKnowledge', knowledgeData)
        : store.dispatch('knowledge/createKnowledge', knowledgeData)
      );
      
      if (success) {
        closeModal();
      }
    };
    
    const confirmDelete = (item) => {
      selectedItem.value = item;
      showDeleteConfirmation.value = true;
    };
    
    const cancelDelete = () => {
      selectedItem.value = null;
      showDeleteConfirmation.value = false;
    };
    
    const deleteKnowledge = async () => {
      if (!selectedItem.value) return;
      
      const success = await store.dispatch('knowledge/deleteKnowledge', selectedItem.value.id);
      
      if (success) {
        cancelDelete();
      }
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    onMounted(() => {
      fetchKnowledge();
    });
      return {
      knowledgeItems,
      isLoading,
      hasError,
      searchTerm,
      showModal,
      isEditing,
      knowledgeForm,
      showDeleteConfirmation,
      fetchKnowledge,
      handleSearch,
      openAddModal,
      editKnowledge,
      closeModal,
      submitKnowledge,
      confirmDelete,
      cancelDelete,
      deleteKnowledge,
      truncateText,
      formatDate,
      t
    };
  }
};
</script>

<style scoped>
.knowledge-management {
  padding: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.header-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  margin-top: 40px;
}

.search-area {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
}

.knowledge-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.knowledge-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.knowledge-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
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
}

.knowledge-content {
  margin-bottom: 15px;
}

.knowledge-category {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.knowledge-text {
  color: #333;
  line-height: 1.5;
}

.knowledge-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: #888;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #3e8e41;
}

.btn-secondary {
  background-color: #f1f1f1;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
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

/* Modal styles */
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

.confirmation-dialog {
  max-width: 400px;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 16px;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
