<template>
  <div class="my-orders-page">
    <v-container>      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 mb-5">Yêu cầu hỗ trợ của tôi</h1>
        </v-col>
      </v-row>

      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <loading-overlay />
        </v-col>
      </v-row>

      <template v-else>        <v-row v-if="orders.length === 0">
          <v-col cols="12" class="text-center">
            <v-alert type="info" outlined>
              Bạn chưa có yêu cầu hỗ trợ nào. Hãy liên hệ với chúng tôi nếu cần giúp đỡ!
            </v-alert>
            <v-btn color="primary" class="mt-5" to="/">
              <v-icon left>mdi-headset</v-icon>
              Tạo yêu cầu hỗ trợ
            </v-btn>
          </v-col>
        </v-row>

        <template v-else>
          <v-row>
            <v-col cols="12">
              <v-card outlined>
                <v-data-table
                  :headers="headers"
                  :items="orders"
                  :items-per-page="10"
                  :footer-props="{
                    'items-per-page-options': [5, 10, 15, 20],
                  }"
                  class="elevation-0"
                >
                  <template v-slot:item.orderDate="{ item }">
                    {{ formatDate(item.createdAt) }}
                  </template>
                  
                  <template v-slot:item.totalAmount="{ item }">
                    {{ formatPrice(item.totalAmount) }} đ
                  </template>
                  
                  <template v-slot:item.status="{ item }">
                    <v-chip
                      :color="getStatusColor(item.status)"
                      small
                      class="text-capitalize"
                    >
                      {{ translateStatus(item.status) }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      small
                      text
                      color="primary"
                      @click="viewOrderDetails(item._id)"
                    >
                      <v-icon small left>mdi-eye</v-icon>
                      Chi tiết
                    </v-btn>
                    
                    <v-btn
                      small
                      text
                      color="error"
                      v-if="item.status === 'pending'"
                      @click="confirmCancelOrder(item._id)"
                      :loading="cancellingOrderId === item._id"
                    >
                      <v-icon small left>mdi-cancel</v-icon>
                      Hủy
                    </v-btn>
                  </template>
                </v-data-table>
              </v-card>
            </v-col>
          </v-row>

          <!-- Order Details Dialog -->
          <v-dialog v-model="showOrderDetails" max-width="700px">
            <v-card v-if="selectedOrder">
              <v-card-title class="headline primary--text">
                Chi tiết đơn hàng #{{ selectedOrder._id }}
              </v-card-title>
              
              <v-card-text class="pt-4">
                <v-row>
                  <v-col cols="6">
                    <p><strong>Ngày đặt hàng:</strong> {{ formatDate(selectedOrder.createdAt) }}</p>
                    <p><strong>Trạng thái:</strong> 
                      <v-chip
                        :color="getStatusColor(selectedOrder.status)"
                        x-small
                        class="text-capitalize"
                      >
                        {{ translateStatus(selectedOrder.status) }}
                      </v-chip>
                    </p>
                  </v-col>
                  
                  <v-col cols="6">
                    <p><strong>Phương thức thanh toán:</strong> {{ translatePaymentMethod(selectedOrder.paymentMethod) }}</p>
                    <p v-if="selectedOrder.paymentDate"><strong>Ngày thanh toán:</strong> {{ formatDate(selectedOrder.paymentDate) }}</p>
                  </v-col>
                </v-row>
                
                <v-divider class="my-4"></v-divider>
                  <h3 class="subtitle-1 font-weight-bold mb-2">Chi tiết dịch vụ hỗ trợ</h3>
                
                <v-list dense>
                  <v-list-item
                    v-for="(item, index) in selectedOrder.items"
                    :key="index"
                    class="px-0"
                  >
                    <v-list-item-content>
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle v-if="item.category">{{ item.category }}</v-list-item-subtitle>
                    </v-list-item-content>
                    
                    <v-list-item-action>
                      <v-chip small :color="getServiceStatusColor(item.status)">{{ translateServiceStatus(item.status) }}</v-chip>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
                  <v-divider class="my-4"></v-divider>
                
                <div class="d-flex justify-space-between subtitle-1">
                  <span>Độ ưu tiên:</span>
                  <span class="font-weight-bold">{{ translatePriority(selectedOrder.totalAmount) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mt-2">
                  <span>Thời gian phản hồi dự kiến:</span>
                  <span>{{ getEstimatedResponseTime(selectedOrder.totalAmount) }}</span>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  text
                  v-if="selectedOrder.status === 'pending'"
                  @click="confirmCancelOrder(selectedOrder._id)"
                  :loading="cancellingOrderId === selectedOrder._id"
                >
                  Hủy yêu cầu
                </v-btn>
                <v-btn
                  color="primary"
                  text
                  @click="showOrderDetails = false"
                >
                  Đóng
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>
      </template>
    </v-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

export default {
  name: 'MyOrders',
  components: {
    LoadingOverlay
  },  metaInfo: {
    title: 'Yêu cầu hỗ trợ của tôi - Trung tâm hỗ trợ khách hàng'
  },
  data() {
    return {
      headers: [
        { text: 'Mã yêu cầu', value: '_id' },
        { text: 'Ngày tạo', value: 'orderDate' },
        { text: 'Mức độ ưu tiên', value: 'totalAmount' },
        { text: 'Trạng thái', value: 'status' },
        { text: 'Thao tác', value: 'actions', sortable: false }
      ],
      showOrderDetails: false,
      selectedOrder: null,
      cancellingOrderId: null
    }
  },
  computed: {
    ...mapGetters('order', ['allOrders', 'isLoading']),
    loading() {
      return this.isLoading
    },
    orders() {
      return this.allOrders.slice().sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    }
  },
  mounted() {
    this.fetchOrders()
  },
  methods: {
    fetchOrders() {
      this.$store.dispatch('order/fetchOrders')
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      return new Date(dateString).toLocaleDateString('vi-VN', options)
    },
    
    formatPrice(price) {
      if (!price && price !== 0) return ''
      return new Intl.NumberFormat('vi-VN').format(price)
    },
    
    getStatusColor(status) {
      const statusColors = {
        'pending': 'warning',
        'processing': 'info',
        'completed': 'success',
        'cancelled': 'error',
        'refunded': 'grey'
      }
      return statusColors[status] || 'primary'
    },
    
    translateStatus(status) {
      const statusTranslations = {
        'pending': 'Chờ xác nhận',
        'processing': 'Đang xử lý',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy',
        'refunded': 'Hoàn tiền'
      }
      return statusTranslations[status] || status
    },
    
    translatePaymentMethod(method) {
      const methodTranslations = {
        'card': 'Thẻ tín dụng/ghi nợ',
        'bank': 'Chuyển khoản ngân hàng',
        'momo': 'Ví MoMo'
      }
      return methodTranslations[method] || method
    },
    
    async viewOrderDetails(orderId) {
      try {
        const order = await this.$store.dispatch('order/fetchOrderById', orderId)
        this.selectedOrder = order
        this.showOrderDetails = true
      } catch (error) {
        console.error('Error fetching order details:', error)
      }
    },
    
    async confirmCancelOrder(orderId) {
      const confirmed = confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')
      if (!confirmed) return
      
      this.cancellingOrderId = orderId
      try {
        await this.$store.dispatch('order/cancelOrder', orderId)
        
        // Nếu đang xem chi tiết đơn hàng được hủy, cập nhật thông tin
        if (this.selectedOrder && this.selectedOrder._id === orderId) {
          await this.viewOrderDetails(orderId)
        }
        
        // Cập nhật lại danh sách đơn hàng
        this.fetchOrders()
      } catch (error) {
        console.error('Error cancelling order:', error)
      } finally {
        this.cancellingOrderId = null
      }
    }
  }
}
</script>

<style scoped>
.my-orders-page {
  padding: 20px 0;
}
</style>