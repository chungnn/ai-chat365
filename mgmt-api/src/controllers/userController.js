const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Lấy danh sách tất cả người dùng
 * @route GET /api/users
 * @access Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    // Xây dựng query
    const query = {};
    
    // Lọc theo trạng thái active nếu được chỉ định
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;
    
    // Tìm kiếm theo từ khóa
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Phân trang
    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password' // Không trả về password
    };
    
    const users = await User.find(query, null, options);
    const totalUsers = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Lấy thông tin chi tiết của một người dùng
 * @route GET /api/users/:id
 * @access Private (Admin)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Tạo người dùng mới
 * @route POST /api/users
 * @access Private (Admin)
 */
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role, isActive } = req.body;
    
    // Kiểm tra các trường bắt buộc
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin cần thiết',
        errors: {
          firstName: firstName ? null : 'Họ là bắt buộc',
          lastName: lastName ? null : 'Tên là bắt buộc',
          email: email ? null : 'Email là bắt buộc',
          password: password ? null : 'Mật khẩu là bắt buộc'
        }
      });
    }
    
    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
        errors: { email: 'Email đã được sử dụng bởi tài khoản khác' }
      });
    }
    
    // Tạo người dùng mới (mô hình User sẽ tự động hash password)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber: phoneNumber || '',
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo người dùng mới',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Cập nhật thông tin người dùng
 * @route PUT /api/users/:id
 * @access Private (Admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, role, isActive, password } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra xem email mới có trùng với người dùng khác không
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng',
          errors: { email: 'Email đã được sử dụng bởi tài khoản khác' }
        });
      }
    }
    
    // Cập nhật thông tin người dùng
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Cập nhật mật khẩu nếu được cung cấp
    if (password) {
      user.password = password; // Sẽ được hash tự động trong middleware pre-save
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Xóa người dùng
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính bạn'
      });
    }
    
    await User.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Thay đổi trạng thái người dùng (kích hoạt/vô hiệu hóa)
 * @route PUT /api/users/:id/status
 * @access Private (Admin)
 */
exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái isActive là bắt buộc'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép vô hiệu hóa chính mình
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản của chính bạn'
      });
    }
    
    user.isActive = isActive;
    await user.save();
    
    const statusText = isActive ? 'kích hoạt' : 'vô hiệu hóa';
    
    res.status(200).json({
      success: true,
      message: `Đã ${statusText} người dùng thành công`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error changing user status:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể thay đổi trạng thái người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * Đặt lại mật khẩu cho người dùng
 * @route PUT /api/users/:id/reset-password
 * @access Private (Admin)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới là bắt buộc'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword; // Sẽ được hash tự động trong middleware pre-save
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đặt lại mật khẩu người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};
