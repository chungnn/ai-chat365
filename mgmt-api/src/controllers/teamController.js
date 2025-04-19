const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Lấy danh sách team
 */
exports.getTeams = async (req, res) => {
  try {
    // Áp dụng policyQuery nếu có
    const query = req.policyQuery || {};
    
    const teams = await Team.find(query)
      .populate('categories', 'name description')
      .populate('iamPolicies', 'name description');
    
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to get teams' });
  }
};

/**
 * Lấy chi tiết một team
 */
exports.getTeamById = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    
    // Kết hợp ID với policy conditions
    const finalQuery = {
      _id: teamId,
      ...(req.policyQuery || {})
    };
    
    const team = await Team.findOne(finalQuery)
      .populate('categories', 'name description')
      .populate('iamPolicies', 'name description')
      .populate('members.userId', 'firstName lastName email');
    
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found or you do not have permission to view it' 
      });
    }
    
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, message: 'Failed to get team' });
  }
};

/**
 * Tạo team mới
 */
exports.createTeam = async (req, res) => {
  try {
    const { name, description, categories } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }
    
    const team = new Team({
      name,
      description: description || '',
      categories: categories || []
    });
    
    await team.save();
    
    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
};

/**
 * Cập nhật team
 */
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, categories } = req.body;
    
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (categories) team.categories = categories;
    
    team.updatedAt = Date.now();
    
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ success: false, message: 'Failed to update team' });
  }
};

/**
 * Xóa team
 */
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Xóa team khỏi các user
    await User.updateMany(
      { 'teams.teamId': team._id },
      { $pull: { teams: { teamId: team._id } } }
    );
    
    await Team.findByIdAndDelete(req.params.teamId);
    
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team' });
  }
};

/**
 * Thêm member vào team
 */
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Kiểm tra xem user đã trong team chưa
    const existingMember = team.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }
    
    // Thêm user vào team
    team.members.push({
      userId,
      role: role || 'member'
    });
    
    await team.save();
    
    // Thêm team vào user
    const userTeamEntry = user.teams ? user.teams.find(t => t.teamId.toString() === team._id.toString()) : null;
    if (!userTeamEntry) {
      if (!user.teams) user.teams = [];
      
      user.teams.push({
        teamId: team._id,
        role: role || 'member'
      });
      
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: team
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

/**
 * Xóa member khỏi team
 */
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Tìm và xóa member
    const memberIndex = team.members.findIndex(m => m.userId.toString() === memberId);
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this team'
      });
    }
    
    team.members.splice(memberIndex, 1);
    await team.save();
    
    // Xóa team khỏi user
    await User.updateOne(
      { _id: memberId },
      { $pull: { teams: { teamId: team._id } } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

/**
 * Gán IAM policy cho team
 */
exports.assignPolicy = async (req, res) => {
  try {
    const { policyId } = req.body;
    
    if (!policyId) {
      return res.status(400).json({
        success: false,
        message: 'Policy ID is required'
      });
    }
    
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Kiểm tra xem policy đã được gán chưa
    if (team.iamPolicies && team.iamPolicies.includes(policyId)) {
      return res.status(400).json({
        success: false,
        message: 'Policy is already assigned to this team'
      });
    }
    
    // Khởi tạo mảng iamPolicies nếu chưa có
    if (!team.iamPolicies) {
      team.iamPolicies = [];
    }
    
    team.iamPolicies.push(policyId);
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Policy assigned successfully',
      data: team
    });
  } catch (error) {
    console.error('Assign policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign policy' });
  }
};

/**
 * Gỡ bỏ IAM policy khỏi team
 */
exports.removePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Tìm và xóa policy
    const policyIndex = team.iamPolicies ? team.iamPolicies.findIndex(p => p.toString() === policyId) : -1;
    
    if (policyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found in this team'
      });
    }
    
    team.iamPolicies.splice(policyIndex, 1);
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Policy removed successfully'
    });
  } catch (error) {
    console.error('Remove policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove policy' });
  }
};
