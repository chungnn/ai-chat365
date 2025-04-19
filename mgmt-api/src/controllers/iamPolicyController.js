const IAMPolicy = require('../models/IAMPolicy');

/**
 * Lấy danh sách policies
 */
exports.getPolicies = async (req, res) => {
  try {
    const policies = await IAMPolicy.find({});
    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to get policies' });
  }
};

/**
 * Lấy chi tiết một policy
 */
exports.getPolicyById = async (req, res) => {
  try {
    const policy = await IAMPolicy.findById(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to get policy' });
  }
};

/**
 * Tạo policy mới
 */
exports.createPolicy = async (req, res) => {
  try {
    const { name, description, version, statement } = req.body;
    
    // Validation cơ bản
    if (!name || !statement || !Array.isArray(statement) || statement.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy format'
      });
    }
    
    // Kiểm tra xem mỗi statement có đầy đủ các trường cần thiết
    for (const stmt of statement) {
      if (!stmt.effect || !stmt.action || !stmt.resource) {
        return res.status(400).json({
          success: false,
          message: 'Each statement must have effect, action and resource'
        });
      }
    }
    
    const policy = new IAMPolicy({
      name,
      description,
      version: version || '2023-01-01',
      statement
    });
    
    await policy.save();
    
    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to create policy' });
  }
};

/**
 * Cập nhật policy
 */
exports.updatePolicy = async (req, res) => {
  try {
    const { name, description, version, statement } = req.body;
    
    const policy = await IAMPolicy.findById(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    
    // Chặn cập nhật đối với system policy
    if (policy.isSystemPolicy) {
      return res.status(403).json({ 
        success: false, 
        message: 'System policies cannot be modified' 
      });
    }
    
    if (name) policy.name = name;
    if (description !== undefined) policy.description = description;
    if (version) policy.version = version;
    if (statement) policy.statement = statement;
    
    policy.updatedAt = Date.now();
    
    await policy.save();
    
    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: policy
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update policy' });
  }
};

/**
 * Xóa policy
 */
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await IAMPolicy.findById(req.params.policyId);
    
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    
    // Chặn xóa đối với system policy
    if (policy.isSystemPolicy) {
      return res.status(403).json({ 
        success: false, 
        message: 'System policies cannot be deleted' 
      });
    }
    
    await IAMPolicy.findByIdAndDelete(req.params.policyId);
    
    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete policy' });
  }
};
