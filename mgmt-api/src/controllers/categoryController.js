const Category = require('../models/Category');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: error.message });
  }
};

// Lấy thông tin một danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin danh mục', error: error.message });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    
    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Danh mục với tên này đã tồn tại' });
    }
    
    const newCategory = new Category({
      name,
      description: description || ''
    });
    
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Lỗi khi tạo danh mục', error: error.message });
  }
};

// Cập nhật danh mục theo ID
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    
    // Kiểm tra xem danh mục có tồn tại không
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Kiểm tra xem tên mới có trùng với danh mục khác không
    if (name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Danh mục với tên này đã tồn tại' });
      }
    }
    
    // Cập nhật danh mục
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description: description || category.description,
        isActive: isActive !== undefined ? isActive : category.isActive
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
  }
};

// Xóa danh mục theo ID
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
  }
};
