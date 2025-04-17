<template>
  <div class="tag-management">
    <div class="header">
      <h2 class="page-title">{{ $t('tags.tagManagement') }}</h2>
      <button class="btn btn-primary" @click="openTagForm()">
        <i class="fas fa-plus"></i> {{ $t('tags.addNewTag') }}
      </button>
    </div>

    <div class="content-section">
      <div v-if="loading" class="loading-state">
        <p>{{ $t('tags.loadingTags') }}</p>
      </div>
      
      <div v-else-if="tags.length === 0" class="empty-state">
        <p>{{ $t('tags.noTagsYet') }}</p>
      </div>      
      <div v-else class="tags-list">
        <div v-for="tag in tags" :key="tag._id" class="tag-item">
          <div class="tag-color" :style="{ backgroundColor: tag.color || '#e2e8f0' }"></div>
          <div class="tag-name">{{ tag.name }}</div>
          <div class="tag-actions">
            <button class="btn-icon" @click="openTagForm(tag)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" @click="confirmDeleteTag(tag)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>    <!-- Tag Form Modal -->
    <div v-if="showTagForm" class="modal-overlay" @click="closeTagForm">
      <div class="modal-content" @click.stop>
        <h3>{{ isEditing ? $t('tags.editTag') : $t('tags.newTag') }}</h3>
        
        <form @submit.prevent="saveTag">
          <div class="form-group">
            <label for="tagName">{{ $t('tags.tagName') }}</label>
            <input
              type="text"
              id="tagName"
              v-model="tagForm.name"
              :placeholder="$t('tags.enterTagName')"
              required
              class="form-control"
              :class="{ 'is-invalid': tagNameError }"
            />
            <div v-if="tagNameError" class="invalid-feedback">
              {{ tagNameError }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="tagColor">{{ $t('tags.tagColor') }}</label>
            <div class="color-picker-wrapper">
              <input
                type="color"
                id="tagColor"
                v-model="tagForm.color"
                class="color-picker"
              />
              <span class="color-value">{{ tagForm.color }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeTagForm">
              {{ $t('tags.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? $t('tags.saving') : $t('tags.saveTag') }}
            </button>
          </div>
        </form>
      </div>
    </div>    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h3>{{ $t('tags.deleteTag') }}</h3>
        <p>
          {{ $t('tags.confirmDeleteTag', { name: tagToDelete?.name }) }}
        </p>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="cancelDelete">
            {{ $t('tags.cancel') }}
          </button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="deleting"
            @click="deleteTag"
          >
            {{ deleting ? $t('tags.deleting') : $t('tags.deleteTag') }}
          </button>
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
  name: 'TagManagement',
  
  setup() {
    const store = useStore();
    useI18n(); 
    
    const tags = computed(() => store.getters['tags/allTags']);
    const loading = computed(() => store.state.tags.loading);
    
    const showTagForm = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    const tagNameError = ref('');
    
    const tagForm = reactive({
      _id: null,
      name: '',
      color: '#4a6cf7'
    });
    
    const showDeleteConfirm = ref(false);
    const tagToDelete = ref(null);
    const deleting = ref(false);
    
    // Fetch tags when component mounts
    onMounted(async () => {
      await store.dispatch('tags/fetchTags');
    });
    
    // Open tag form for creating or editing
    const openTagForm = (tag = null) => {
      if (tag) {
        // Edit mode
        isEditing.value = true;
        tagForm._id = tag._id;
        tagForm.name = tag.name;
        tagForm.color = tag.color || '#4a6cf7';
      } else {
        // Create mode
        isEditing.value = false;
        tagForm._id = null;
        tagForm.name = '';
        tagForm.color = '#4a6cf7';
      }
      
      showTagForm.value = true;
      tagNameError.value = '';
    };
    
    // Close tag form
    const closeTagForm = () => {
      showTagForm.value = false;
    };
    
    // Save tag (create or update)
    const saveTag = async () => {
      try {
        tagNameError.value = '';
        saving.value = true;
        
        if (isEditing.value) {
          // Update existing tag
          await store.dispatch('tags/updateTag', {
            id: tagForm._id,
            name: tagForm.name,
            color: tagForm.color
          });
          
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Tag updated successfully'
          });
        } else {
          // Create new tag
          await store.dispatch('tags/createTag', {
            name: tagForm.name,
            color: tagForm.color
          });
          
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Tag created successfully'
          });
        }
        
        closeTagForm();
      } catch (error) {
        console.error('Failed to save tag:', error);
        
        if (error.response && error.response.data) {
          if (error.response.data.errors && error.response.data.errors.name) {
            tagNameError.value = error.response.data.errors.name;
          } else if (error.response.data.message) {
            tagNameError.value = error.response.data.message;
          }
        } else {
          store.dispatch('notification/showNotification', {
            type: 'error',
            message: 'Failed to save tag'
          });
        }
      } finally {
        saving.value = false;
      }
    };
    
    // Show delete confirmation
    const confirmDeleteTag = (tag) => {
      tagToDelete.value = tag;
      showDeleteConfirm.value = true;
    };
    
    // Cancel delete
    const cancelDelete = () => {
      tagToDelete.value = null;
      showDeleteConfirm.value = false;
    };
    
    // Delete tag
    const deleteTag = async () => {
      if (!tagToDelete.value) return;
      
      try {
        deleting.value = true;
        
        await store.dispatch('tags/deleteTag', tagToDelete.value._id);
        
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: `Tag "${tagToDelete.value.name}" deleted successfully`
        });
        
        cancelDelete();
      } catch (error) {
        console.error('Failed to delete tag:', error);
        
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Failed to delete tag'
        });
      } finally {
        deleting.value = false;
      }
    };
    
    return {
      tags,
      loading,
      showTagForm,
      isEditing,
      saving,
      tagForm,
      tagNameError,
      showDeleteConfirm,
      tagToDelete,
      deleting,
      openTagForm,
      closeTagForm,
      saveTag,
      confirmDeleteTag,
      cancelDelete,
      deleteTag
    };
  }
};
</script>

<style scoped>
.tag-management {
  padding: 20px;
  margin-top: 60px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.content-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: #6b7a99;
}

.tags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  transition: all 0.2s ease;
}

.tag-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.tag-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag-name {
  flex: 1;
  font-weight: 500;
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.btn-delete:hover {
  color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
}

.form-control.is-invalid {
  border-color: #ef4444;
}

.invalid-feedback {
  color: #ef4444;
  font-size: 14px;
  margin-top: 4px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 40px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  margin-left: 12px;
  font-size: 14px;
  color: #64748b;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: #4a6cf7;
  color: white;
}

.btn-primary:hover {
  background-color: #3c58d9;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #334155;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .tag-management {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .tags-list {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 0 16px;
    max-width: 100%;
  }
}
</style>
