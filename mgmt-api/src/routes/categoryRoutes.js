const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

// All chat routes require authentication
router.use(authenticate);


// Route: GET /api/categories
// Mô tả: Lấy danh sách tất cả các danh mục
// Quyền: Đã đăng nhập
router.get('/', categoryController.getAllCategories);

// Route: GET /api/categories/:id
// Mô tả: Lấy thông tin chi tiết của một danh mục theo ID
// Quyền: Đã đăng nhập
router.get('/:id', categoryController.getCategoryById);

// Route: POST /api/categories
// Mô tả: Tạo danh mục mới
// Quyền: Đã đăng nhập
router.post('/', categoryController.createCategory);

// Route: PUT /api/categories/:id
// Mô tả: Cập nhật thông tin danh mục
// Quyền: Đã đăng nhập
router.put('/:id', categoryController.updateCategory);

// Route: DELETE /api/categories/:id
// Mô tả: Xóa danh mục
// Quyền: Đã đăng nhập
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
