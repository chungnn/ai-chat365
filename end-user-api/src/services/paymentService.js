const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/config');

class PaymentService {
  /**
   * Create payment link/information based on payment method
   * @param {Object} order - Order object
   * @param {String} paymentMethod - Payment method ('vnpay', 'momo', etc.)
   * @returns {Object} Payment information including redirect URL if applicable
   */
  static async createPaymentLink(order, paymentMethod) {
    switch (paymentMethod) {
      case 'vnpay':
        return this.createVnPayLink(order);
      case 'momo':
        return this.createMomoLink(order);
      case 'bank_transfer':
        return this.getBankTransferInfo(order);
      default:
        return { message: 'Thanh toán khi nhận hàng (COD)' };
    }
  }

  /**
   * Create payment link for VNPay
   */
  static async createVnPayLink(order) {
    try {
      const date = new Date();
      
      // VNPay required parameters
      const vnp_TxnRef = order.orderNumber;
      const vnp_Amount = Math.round(order.total * 100); // Amount in VND, multiplied by 100 according to VNPay requirements
      const vnp_Command = 'pay';
      const vnp_CreateDate = date.getFullYear() +
                           ('0' + (date.getMonth() + 1)).slice(-2) +
                           ('0' + date.getDate()).slice(-2) +
                           ('0' + date.getHours()).slice(-2) +
                           ('0' + date.getMinutes()).slice(-2) +
                           ('0' + date.getSeconds()).slice(-2);
      const vnp_CurrCode = 'VND';
      const vnp_IpAddr = '127.0.0.1'; // Should be replaced with actual IP in production
      const vnp_Locale = 'vn';
      const vnp_OrderInfo = `Thanh toan cho don hang ${order.orderNumber}`;
      const vnp_OrderType = '190000'; // Default order type for education
      const vnp_ReturnUrl = config.vnpay.returnUrl;
      const vnp_TmnCode = config.vnpay.tmnCode;
      const vnp_Version = '2.1.0';
      const vnp_ExpireDate = ''; // Optional

      // Build the data string
      const dataString = `vnp_Amount=${vnp_Amount}&vnp_Command=${vnp_Command}&vnp_CreateDate=${vnp_CreateDate}&vnp_CurrCode=${vnp_CurrCode}&vnp_IpAddr=${vnp_IpAddr}&vnp_Locale=${vnp_Locale}&vnp_OrderInfo=${vnp_OrderInfo}&vnp_OrderType=${vnp_OrderType}&vnp_ReturnUrl=${encodeURIComponent(vnp_ReturnUrl)}&vnp_TmnCode=${vnp_TmnCode}&vnp_TxnRef=${vnp_TxnRef}&vnp_Version=${vnp_Version}`;

      // Create signature
      const hmac = crypto.createHmac('sha512', config.vnpay.secretKey);
      const signed = hmac.update(Buffer.from(dataString, 'utf-8')).digest('hex');
      
      // Build the full URL
      const redirectUrl = `${config.vnpay.paymentUrl}?${dataString}&vnp_SecureHash=${signed}`;
      
      return {
        paymentMethod: 'vnpay',
        redirectUrl,
        orderId: order._id,
        orderNumber: order.orderNumber
      };
    } catch (error) {
      console.error('VNPay payment link creation error:', error);
      throw new Error('Không thể tạo liên kết thanh toán VNPay');
    }
  }

  /**
   * Create payment link for Momo
   */
  static async createMomoLink(order) {
    try {
      const partnerCode = config.momo.partnerCode;
      const accessKey = config.momo.accessKey;
      const secretKey = config.momo.secretKey;
      const requestId = `REQ-${Date.now()}`;
      const amount = Math.round(order.total);
      const orderId = order.orderNumber;
      const orderInfo = `Thanh toan don hang ${order.orderNumber}`;
      const redirectUrl = config.momo.redirectUrl;
      const ipnUrl = config.momo.ipnUrl;
      const extraData = '';

      // Create signature
      const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&redirectUrl=${redirectUrl}&ipnUrl=${ipnUrl}&extraData=${extraData}`;
      
      const hmac = crypto.createHmac('sha256', secretKey);
      const signature = hmac.update(rawSignature).digest('hex');
      
      // Create request body
      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType: 'captureWallet',
        signature
      };
      
      // Send request to MoMo
      const response = await axios.post(config.momo.paymentUrl, requestBody);
      
      if (response.data.resultCode === 0) {
        return {
          paymentMethod: 'momo',
          redirectUrl: response.data.payUrl,
          orderId: order._id,
          orderNumber: order.orderNumber
        };
      } else {
        throw new Error(`Lỗi MoMo: ${response.data.message}`);
      }
    } catch (error) {
      console.error('MoMo payment link creation error:', error);
      throw new Error('Không thể tạo liên kết thanh toán MoMo');
    }
  }

  /**
   * Get bank transfer information
   */
  static getBankTransferInfo(order) {
    return {
      paymentMethod: 'bank_transfer',
      bankInfo: {
        bankName: config.bankTransfer.bankName,
        accountNumber: config.bankTransfer.accountNumber,
        accountName: config.bankTransfer.accountName,
        branch: config.bankTransfer.branch,
        content: `Thanh toan don hang ${order.orderNumber}`
      },
      orderId: order._id,
      orderNumber: order.orderNumber
    };
  }

  /**
   * Verify payment based on payment method
   */
  static async verifyPayment(order, paymentMethod, paymentData) {
    switch (paymentMethod) {
      case 'vnpay':
        return this.verifyVnPayPayment(paymentData);
      case 'momo':
        return this.verifyMomoPayment(paymentData);
      case 'bank_transfer':
        // Bank transfer typically requires manual verification
        return { success: false, message: 'Thanh toán chuyển khoản cần được xác nhận thủ công' };
      case 'cod':
        // COD doesn't require verification, just return success
        return { success: true, message: 'Đã xác nhận phương thức thanh toán COD' };
      default:
        return { success: false, message: 'Phương thức thanh toán không hợp lệ' };
    }
  }

  /**
   * Verify VNPay payment
   */
  static async verifyVnPayPayment(paymentData) {
    try {
      // Extract the query parameters from paymentData
      const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_SecureHash, ...otherParams } = paymentData;
      
      // First check if the payment was successful according to VNPay
      if (vnp_ResponseCode !== '00') {
        return { 
          success: false, 
          message: 'Thanh toán VNPay không thành công', 
          responseCode: vnp_ResponseCode 
        };
      }
      
      // Verify signature
      const dataString = Object.entries(otherParams)
        .filter(([key]) => key.startsWith('vnp_'))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha512', config.vnpay.secretKey);
      const calculatedHash = hmac.update(Buffer.from(dataString, 'utf-8')).digest('hex');
      
      if (calculatedHash !== vnp_SecureHash) {
        return { success: false, message: 'Chữ ký không hợp lệ' };
      }
      
      return {
        success: true,
        message: 'Thanh toán VNPay thành công',
        transactionId: vnp_TransactionNo,
        orderNumber: vnp_TxnRef
      };
    } catch (error) {
      console.error('VNPay verification error:', error);
      return { success: false, message: 'Lỗi xác minh thanh toán VNPay' };
    }
  }

  /**
   * Verify MoMo payment
   */
  static async verifyMomoPayment(paymentData) {
    try {
      // Extract data from paymentData
      const { resultCode, amount, orderId, transId, message, signature, ...otherParams } = paymentData;
      
      // Check if payment was successful
      if (resultCode !== '0') {
        return { success: false, message: `Thanh toán MoMo không thành công: ${message}` };
      }
      
      // Verify signature
      const rawSignature = Object.entries(otherParams)
        .filter(([key]) => !['signature'].includes(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha256', config.momo.secretKey);
      const calculatedSignature = hmac.update(rawSignature).digest('hex');
      
      if (calculatedSignature !== signature) {
        return { success: false, message: 'Chữ ký MoMo không hợp lệ' };
      }
      
      return {
        success: true,
        message: 'Thanh toán MoMo thành công',
        transactionId: transId,
        orderNumber: orderId
      };
    } catch (error) {
      console.error('MoMo verification error:', error);
      return { success: false, message: 'Lỗi xác minh thanh toán MoMo' };
    }
  }
}

module.exports = PaymentService;