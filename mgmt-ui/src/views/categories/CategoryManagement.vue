<template>
  <div class="category-management">
    <div class="page-header">
      <h1>Quản Lý Danh Mục</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <span>+ Thêm Danh Mục</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loader"></div>
    </div>

    <div v-else-if="hasError" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else-if="categories.length === 0" class="empty-state">
      <p>Chưa có danh mục nào. Hãy thêm danh mục mới!</p>
    </div>

    <div v-else class="category-list">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên Danh Mục</th>
            <th>Mô tả</th>
            <th>Ngày Tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(category, index) in categories" :key="category._id">
            <td>{{ index + 1 }}</td>
            <td>{{ category.name }}</td>
            <td>{{ category.description }}</td>
            <td>{{ formatDate(category.createdAt) }}</td>
            <td>
              <button class="btn btn-sm btn-info" @click="openEditModal(category)">
                Sửa
              </button>
              <button class="btn btn-sm btn-danger ml-2" @click="confirmDelete(category)">
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Category Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục' }}</h2>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <div class="form-group">
              <label for="name">Tên Danh Mục:</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="description">Mô tả:</label>
              <textarea
                id="description"
                v-model="form.description"
                class="form-control"
                rows="4"
              ></textarea>
            </div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Hủy
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Đang xử lý...' : 'Lưu' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Xác nhận xóa</h2>
          <button class="close-button" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Bạn có chắc chắn muốn xóa danh mục "{{ selectedCategory?.name }}" không?</p>
          <div class="form-buttons">
            <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
              Hủy
            </button>
            <button type="button" class="btn btn-danger" :disabled="isDeleting" @click="deleteCategory">
              {{ isDeleting ? 'Đang xóa...' : 'Xóa' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'CategoryManagement',
  
  setup() {
    const store = useStore();
    
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const isSubmitting = ref(false);
    const isDeleting = ref(false);
    const selectedCategory = ref(null);
    
    const form = ref({
      name: '',
      description: ''
    });
    
    // Computed properties
    const categories = computed(() => store.getters['categories/allCategories']);
    const isLoading = computed(() => store.getters['categories/isLoading']);
    const hasError = computed(() => store.getters['categories/hasError']);
    const errorMessage = computed(() => store.getters['categories/errorMessage']);
    
    // Load categories on component mount
    onMounted(() => {
      fetchCategories();
    });
    
    // Methods
    const fetchCategories = async () => {
      await store.dispatch('categories/fetchCategories');
    };
    
    const openAddModal = () => {
      isEditing.value = false;
      form.value = {
        name: '',
        description: ''
      };
      showModal.value = true;
    };
    
    const openEditModal = (category) => {
      isEditing.value = true;
      selectedCategory.value = category;
      form.value = {
        name: category.name,
        description: category.description
      };
      showModal.value = true;
    };
    
    const closeModal = () => {
      showModal.value = false;
    };
    
    const submitForm = async () => {
      isSubmitting.value = true;
      
      try {
        if (isEditing.value) {
          await store.dispatch('categories/updateCategory', {
            categoryId: selectedCategory.value._id,
            categoryData: form.value
          });
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Cập nhật danh mục thành công!'
          });
        } else {
          await store.dispatch('categories/createCategory', form.value);
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Thêm danh mục thành công!'
          });
        }
        closeModal();
      } catch (error) {
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Có lỗi xảy ra. Vui lòng thử lại!'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const confirmDelete = (category) => {
      selectedCategory.value = category;
      showDeleteModal.value = true;
    };
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      selectedCategory.value = null;
    };
    
    const deleteCategory = async () => {
      if (!selectedCategory.value) return;
      
      isDeleting.value = true;
      
      try {
        await store.dispatch('categories/deleteCategory', selectedCategory.value._id);
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Xóa danh mục thành công!'
        });
        closeDeleteModal();
      } catch (error) {
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Có lỗi xảy ra khi xóa danh mục. Vui lòng thử lại!'
        });
      } finally {
        isDeleting.value = false;
      }
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    return {
      categories,
      isLoading,
      hasError,
      errorMessage,
      showModal,
      showDeleteModal,
      isEditing,
      isSubmitting,
      isDeleting,
      selectedCategory,
      form,
      openAddModal,
      openEditModal,
      closeModal,
      submitForm,
      confirmDelete,
      closeDeleteModal,
      deleteCategory,
      formatDate
    };
  }
}
</script>

<style scoped>
.category-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 30px;
  padding-top: 15px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 50px 0;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 5px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #7f8c8d;
}

.category-list {
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

tr {
  border-bottom: 1px solid #e9ecef;
}

tr:last-child {
  border-bottom: none;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-info {
  background-color: #2ecc71;
  color: white;
}

.btn-info:hover {
  background-color: #27ae60;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.875rem;
}

.ml-2 {
  margin-left: 8px;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background-color: #fff;
  border-radius: 5px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-control:focus {
  border-color: #3498db;
  outline: none;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
