const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticate);

/**
 * @route GET /api/users
 * @desc Lấy danh sách tất cả người dùng
 * @access Private (Admin)
 */
router.get('/', userController.getAllUsers);

/**
 * @route GET /api/users/:id
 * @desc Lấy thông tin chi tiết của một người dùng
 * @access Private (Admin)
 */
router.get('/:id', userController.getUserById);

/**
 * @route POST /api/users
 * @desc Tạo người dùng mới
 * @access Private (Admin)
 */
router.post('/', userController.createUser);

/**
 * @route PUT /api/users/:id
 * @desc Cập nhật thông tin người dùng
 * @access Private (Admin)
 */
router.put('/:id', userController.updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Xóa người dùng
 * @access Private (Admin)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route PUT /api/users/:id/status
 * @desc Thay đổi trạng thái người dùng (kích hoạt/vô hiệu hóa)
 * @access Private (Admin)
 */
router.put('/:id/status', userController.changeUserStatus);

/**
 * @route PUT /api/users/:id/reset-password
 * @desc Đặt lại mật khẩu cho người dùng
 * @access Private (Admin)
 */
router.put('/:id/reset-password', userController.resetUserPassword);

module.exports = router;
