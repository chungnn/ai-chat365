<template>
  <div class="user-management">
    <div class="page-header">
      <h1>{{ $t('users.userManagement') }}</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <span>+ {{ $t('users.addUser') }}</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loader"></div>
    </div>

    <div v-else-if="hasError" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else-if="users.length === 0" class="empty-state">
      <p>{{ $t('users.noUsersYet') }}</p>
    </div>    <div v-else class="user-list">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ $t('users.name') }}</th>
            <th>{{ $t('users.userEmail') }}</th>
            <th>{{ $t('users.phoneNumber') }}</th>
            <th>{{ $t('users.role') }}</th>
            <th>{{ $t('users.status') }}</th>
            <th>{{ $t('users.createDate') }}</th>
            <th>{{ $t('users.actions') }}</th>
          </tr>
        </thead>
        <tbody>          <tr v-for="(user, index) in users" :key="user._id">
            <td>{{ index + 1 }}</td>
            <td>{{ `${user.firstName || ''} ${user.lastName || ''}`.trim() }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.phoneNumber || $t('users.notAvailable') }}</td>
            <td>{{ user.role || 'User' }}</td>
            <td>
              <span 
                :class="[
                  'status-badge', 
                  user.isActive ? 'status-active' : 'status-inactive'
                ]"
              >
                {{ user.isActive ? $t('users.active') : $t('users.inactive') }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <button class="btn btn-sm btn-info" @click="openEditModal(user)">
                {{ $t('users.edit') }}
              </button>
              <button 
                class="btn btn-sm ml-2" 
                :class="user.isActive ? 'btn-warning' : 'btn-success'"
                @click="toggleUserStatus(user)"
              >
                {{ user.isActive ? $t('users.deactivate') : $t('users.activate') }}
              </button>
              <button class="btn btn-sm btn-danger ml-2" @click="confirmDelete(user)">
                {{ $t('users.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>    <!-- Add/Edit User Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? $t('users.editUserInfo') : $t('users.addUser') }}</h2>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitForm">            
            <div class="form-group">
              <label for="firstName">{{ $t('users.firstName') }}:</label>
              <input
                type="text"
                id="firstName"
                v-model="form.firstName"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="lastName">{{ $t('users.lastName') }}:</label>
              <input
                type="text"
                id="lastName"
                v-model="form.lastName"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="email">{{ $t('users.userEmail') }}:</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                class="form-control"
                required
              />
            </div>            <div class="form-group">
              <label for="phoneNumber">{{ $t('users.phoneNumber') }}:</label>
              <input
                type="text"
                id="phoneNumber"
                v-model="form.phoneNumber"
                class="form-control"
              />
            </div>
            <div class="form-group" v-if="!isEditing">
              <label for="password">{{ $t('auth.password') }}:</label>
              <input
                type="password"
                id="password"
                v-model="form.password"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="isActive">{{ $t('users.status') }}:</label>
              <select
                id="isActive"
                v-model="form.isActive"
                class="form-control"
              >
                <option :value="true">{{ $t('users.active') }}</option>
                <option :value="false">{{ $t('users.inactive') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="role">{{ $t('users.role') }}:</label>
              <select
                id="role"
                v-model="form.role"
                class="form-control"
              >
                <option value="user">{{ $t('users.user') }}</option>
                <option value="admin">{{ $t('users.admin') }}</option>
                <option value="manager">{{ $t('users.manager') }}</option>
              </select>
            </div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                {{ $t('users.cancel') }}
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? $t('users.processing') : $t('users.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>    <!-- Delete Confirmation Modal -->
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ $t('users.deleteUser') }}</h2>
          <button class="close-button" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ $t('users.confirmDeleteUser', { name: selectedUser ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() : '' }) }}</p>
          <div class="form-buttons">
            <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
              {{ $t('users.cancel') }}
            </button>
            <button type="button" class="btn btn-danger" :disabled="isDeleting" @click="deleteUser">
              {{ isDeleting ? $t('users.deleting') : $t('users.delete') }}
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
import { useI18n } from 'vue-i18n';

export default {
  name: 'UserManagement',
  
  setup() {
    const store = useStore();
    useI18n(); 
    
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const isSubmitting = ref(false);
    const isDeleting = ref(false);
    const selectedUser = ref(null);
      const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      isActive: true,
      role: 'user'
    });
    
    // Computed properties
    const users = computed(() => store.getters['users/allUsers']);
    const isLoading = computed(() => store.getters['users/isLoading']);
    const hasError = computed(() => store.getters['users/hasError']);
    const errorMessage = computed(() => store.getters['users/errorMessage']);
    
    // Load users on component mount
    onMounted(() => {
      fetchUsers();
    });
    
    // Methods
    const fetchUsers = async () => {
      await store.dispatch('users/fetchUsers');
    };
      const openAddModal = () => {
      isEditing.value = false;
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        isActive: true,
        role: 'user'
      };
      showModal.value = true;
    };
    
    const openEditModal = (user) => {
      isEditing.value = true;
      selectedUser.value = user;
      form.value = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        isActive: user.isActive,
        role: user.role || 'user'
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
          await store.dispatch('users/updateUser', {
            userId: selectedUser.value._id,
            userData: form.value
          });
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Cập nhật người dùng thành công!'
          });
        } else {
          await store.dispatch('users/createUser', form.value);
          store.dispatch('notification/showNotification', {
            type: 'success',
            message: 'Thêm người dùng thành công!'
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
    
    const toggleUserStatus = async (user) => {
      try {
        await store.dispatch('users/updateUser', {
          userId: user._id,
          userData: { 
            ...user,
            isActive: !user.isActive 
          }
        });
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: `Người dùng đã được ${user.isActive ? 'vô hiệu hóa' : 'kích hoạt'} thành công!`
        });
      } catch (error) {
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Có lỗi xảy ra. Vui lòng thử lại!'
        });
      }
    };
    
    const confirmDelete = (user) => {
      selectedUser.value = user;
      showDeleteModal.value = true;
    };
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      selectedUser.value = null;
    };
    
    const deleteUser = async () => {
      if (!selectedUser.value) return;
      
      isDeleting.value = true;
      
      try {
        await store.dispatch('users/deleteUser', selectedUser.value._id);
        store.dispatch('notification/showNotification', {
          type: 'success',
          message: 'Xóa người dùng thành công!'
        });
        closeDeleteModal();
      } catch (error) {
        store.dispatch('notification/showNotification', {
          type: 'error',
          message: 'Có lỗi xảy ra khi xóa người dùng. Vui lòng thử lại!'
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
      users,
      isLoading,
      hasError,
      errorMessage,
      showModal,
      showDeleteModal,
      isEditing,
      isSubmitting,
      isDeleting,
      selectedUser,
      form,
      openAddModal,
      openEditModal,
      closeModal,
      submitForm,
      toggleUserStatus,
      confirmDelete,
      closeDeleteModal,
      deleteUser,
      formatDate
    };
  }
}
</script>

<style scoped>
.user-management {
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

.user-list {
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

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover {
  background-color: #d35400;
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-success:hover {
  background-color: #27ae60;
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

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #d5f5e3;
  color: #27ae60;
}

.status-inactive {
  background-color: #fadbd8;
  color: #c0392b;
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
