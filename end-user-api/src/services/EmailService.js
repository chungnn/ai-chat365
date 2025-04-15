const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

/**
 * Send order confirmation email to customer
 * @param {string} email - Customer email
 * @param {Object} order - Order object
 * @returns {Promise} - Email sending result
 */
const sendOrderConfirmation = async (email, order) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration not found. Skipping email sending.');
      return;
    }

    // Format order items for email
    const itemsList = order.items.map(item => 
      `- ${item.name}: ${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.subtotal)}`
    ).join('\n');

    // Email content
    const mailOptions = {
      from: `"AI Chat365" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${order._id}`,
      text: `
        Cảm ơn bạn đã đặt hàng!
        
        Thông tin đơn hàng #${order._id}:
        
        Khách hàng: ${order.customerInfo.firstName} ${order.customerInfo.lastName}
        Email: ${order.customerInfo.email}
        Điện thoại: ${order.customerInfo.phoneNumber}
        
        
        Tổng thanh toán: ${formatCurrency(order.total)}
        Phương thức thanh toán: ${getPaymentMethodText(order.paymentMethod)}
        Trạng thái thanh toán: ${getPaymentStatusText(order.paymentStatus)}
        
        Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!
        
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Cảm ơn bạn đã đặt hàng!</h2>
          
          <div style="padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3>Thông tin đơn hàng #${order._id}</h3>
            
            <p><strong>Khách hàng:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName}</p>
            <p><strong>Email:</strong> ${order.customerInfo.email}</p>
            <p><strong>Điện thoại:</strong> ${order.customerInfo.phoneNumber}</p>
            
            <h4>Các sản phẩm:</h4>
            <ul>
              ${order.items.map(item => 
                `<li>${item.name}: ${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.subtotal)}</li>`
              ).join('')}
            </ul>
            
            <p><strong>Tổng thanh toán:</strong> ${formatCurrency(order.total)}</p>
            <p><strong>Phương thức thanh toán:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${getPaymentStatusText(order.paymentStatus)}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; text-align: center;">
            <p>Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!</p>
            <p style="color: #3498db;"><strong>AI Chat365</strong></p>
          </div>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Don't throw the error to prevent breaking the order process
    // Just log it instead
  }
};

/**
 * Format currency in VND
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount);
};

/**
 * Get human-readable payment method
 * @param {string} method - Payment method code
 * @returns {string} - Human-readable payment method
 */
const getPaymentMethodText = (method) => {
  const methods = {
    'cod': 'Thanh toán khi nhận hàng',
    'vnpay': 'VNPay',
    'momo': 'MoMo',
    'bank': 'Chuyển khoản ngân hàng'
  };
  return methods[method] || method;
};

/**
 * Get human-readable payment status
 * @param {string} status - Payment status code
 * @returns {string} - Human-readable payment status
 */
const getPaymentStatusText = (status) => {
  const statuses = {
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'failed': 'Thanh toán thất bại',
    'refunded': 'Đã hoàn tiền'
  };
  return statuses[status] || status;
};

module.exports = {
  sendOrderConfirmation
};