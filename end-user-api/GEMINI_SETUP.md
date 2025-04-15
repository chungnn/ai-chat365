// Hướng dẫn cài đặt và cấu hình Gemini API cho end-user-api

# Cài đặt và Cấu hình Google Gemini cho AI Service

## 1. Cài đặt thư viện

Thực hiện lệnh sau để cài đặt thư viện Google Generative AI:

```bash
npm install @google/generative-ai
```

## 2. Cấu hình biến môi trường

Thêm GEMINI_API_KEY vào file .env trong thư mục end-user-api:

```
GEMINI_API_KEY=your_api_key_here
```

Để lấy API key từ Google AI Studio:
1. Truy cập https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google của bạn
3. Tạo API key mới nếu chưa có
4. Sao chép API key và dán vào file .env

## 3. Khởi động lại server

Sau khi cài đặt và cấu hình, khởi động lại server:

```bash
npm run dev
```

## 4. Kiểm tra

Sau khi cài đặt, hệ thống sẽ tự động sử dụng Gemini thay vì hệ thống mô phỏng AI trước đó.
