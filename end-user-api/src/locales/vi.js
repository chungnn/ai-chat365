/**
 * Vietnamese language translations
 */
module.exports = {
  common: {
    success: 'Thao tác thành công',
    error: 'Đã xảy ra lỗi',
    notFound: 'Không tìm thấy tài nguyên',
    unauthorized: 'Truy cập không được phép',
    forbidden: 'Hành động bị cấm',
    validationError: 'Lỗi xác thực',
    serverError: 'Lỗi máy chủ',
    missingFields: 'Thiếu các trường bắt buộc'
  },
  auth: {
    loginSuccess: 'Đăng nhập thành công',
    loginFailed: 'Đăng nhập thất bại',
    registerSuccess: 'Đăng ký thành công',
    registerFailed: 'Đăng ký thất bại',
    logoutSuccess: 'Đăng xuất thành công',
    invalidCredentials: 'Email hoặc mật khẩu không hợp lệ',
    passwordResetSent: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn',
    passwordResetSuccess: 'Mật khẩu đã được đặt lại thành công',
    tokenExpired: 'Mã xác thực đã hết hạn',
    tokenInvalid: 'Mã xác thực không hợp lệ',
    accountCreated: 'Tài khoản đã được tạo thành công'
  },
  chat: {
    sessionCreated: 'Phiên trò chuyện đã được tạo thành công',
    messageProcessed: 'Tin nhắn đã được xử lý thành công',
    messageFailed: 'Không thể xử lý tin nhắn',
    sessionNotFound: 'Không tìm thấy phiên trò chuyện',
    userInfoUpdated: 'Thông tin người dùng đã được cập nhật thành công',
    transferRequested: 'Đã yêu cầu chuyển đến nhân viên hỗ trợ',
    transferFailed: 'Không thể chuyển đến nhân viên hỗ trợ',
    chatEnded: 'Phiên trò chuyện đã kết thúc',
    chatHistory: 'Lịch sử trò chuyện đã được truy xuất thành công',
    aiGreeting: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
    aiTransferSuggestion: 'Tôi đề xuất chuyển đến nhân viên hỗ trợ để được hỗ trợ tốt hơn với vấn đề của bạn.',
    aiError: 'Tôi xin lỗi, nhưng tôi đã gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.'
  },
  ticket: {
    ticketCreated: 'Yêu cầu hỗ trợ đã được tạo thành công',
    ticketUpdated: 'Yêu cầu hỗ trợ đã được cập nhật thành công',
    ticketNotFound: 'Không tìm thấy yêu cầu hỗ trợ',
    ticketDeleted: 'Yêu cầu hỗ trợ đã được xóa thành công',
    ticketStatusChanged: 'Trạng thái yêu cầu đã được cập nhật thành công',
    ticketDetailsRetrieved: 'Thông tin chi tiết yêu cầu đã được truy xuất thành công'
  },
  errors: {
    processingMessage: 'Lỗi khi xử lý tin nhắn của bạn',
    internalError: 'Lỗi máy chủ nội bộ',
    databaseError: 'Lỗi cơ sở dữ liệu',
    apiError: 'Lỗi API',
    validationFailed: 'Xác thực thất bại'
  }
};
