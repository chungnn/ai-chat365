const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Tạo thư mục keys nếu chưa tồn tại
const keysDir = path.join(__dirname, 'src', 'config', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

console.log('Đang tạo cặp khóa RSA 2048-bit mới...');

// Tạo cặp khóa RSA mới
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, // 2048 bits - đủ mạnh cho RS256
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Ghi khóa riêng tư vào file
const privateKeyPath = path.join(keysDir, 'private.key');
fs.writeFileSync(privateKeyPath, privateKey);
console.log(`Khóa riêng tư đã được lưu vào: ${privateKeyPath}`);

// Ghi khóa công khai vào file
const publicKeyPath = path.join(keysDir, 'public.key');
fs.writeFileSync(publicKeyPath, publicKey);
console.log(`Khóa công khai đã được lưu vào: ${publicKeyPath}`);

// Kiểm tra cặp khóa
try {
  // Tạo dữ liệu mẫu để kiểm tra
  const testData = 'test-data-for-signature-verification';
  
  // Ký dữ liệu bằng khóa riêng tư
  const sign = crypto.createSign('SHA256');
  sign.update(testData);
  sign.end();
  const signature = sign.sign(privateKey);
  
  // Xác minh chữ ký bằng khóa công khai
  const verify = crypto.createVerify('SHA256');
  verify.update(testData);
  verify.end();
  const isValid = verify.verify(publicKey, signature);
  
  console.log(`Kiểm tra cặp khóa: ${isValid ? 'Thành công' : 'Thất bại'}`);
} catch (error) {
  console.error('Lỗi khi kiểm tra cặp khóa:', error.message);
}

console.log('Quá trình tạo khóa hoàn tất.');
