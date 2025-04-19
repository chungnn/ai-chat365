// filepath: d:\ANH CHUNG\Projects\ai-chat365\mgmt-api\src\seeder\teamSeeder.js
const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const IAMPolicy = require('../models/IAMPolicy');
const Category = require('../models/Category');
const config = require('../config/config');

/**
 * Seeder cho các Team mẫu
 * Tạo các team và gán members, categories, policies
 */
async function seedTeams() {
  try {
    console.log('Bắt đầu khởi tạo Teams...');

    // Kết nối đến database nếu chưa được kết nối
    if (mongoose.connection.readyState !== 1) {
      console.log('Đang kết nối đến MongoDB...');
      await mongoose.connect(config.mongodb.uri);
      console.log('Đã kết nối đến MongoDB');
    }

    // Kiểm tra xem đã có team nào chưa
    const existingTeams = await Team.countDocuments();
    if (existingTeams > 0) {
      console.log(`Đã tìm thấy ${existingTeams} team. Bỏ qua quá trình seed.`);
      return;
    }

    // Tìm các user để gán vào teams
    const users = await User.find({});
    if (users.length === 0) {
      console.log('Không tìm thấy users để gán vào team. Vui lòng chạy user seeder trước.');
      return;
    }

    // Tìm các policies để gán cho teams
    const policies = await IAMPolicy.find({});
    
    // Tìm các categories để gán cho teams
    const categories = await Category.find({});
    
    // Xác định một số policy thông thường nếu có
    const chatViewPolicy = policies.find(p => p.name === 'ChatViewerPolicy');
    const chatManagePolicy = policies.find(p => p.name === 'ChatManagementPolicy');
    const categoryManagePolicy = policies.find(p => p.name === 'CategoryManagementPolicy');

    // Tạo danh sách teams mẫu
    const teams = [
      {
        name: 'Hỗ trợ Kỹ thuật',
        description: 'Team chuyên về hỗ trợ kỹ thuật và xử lý các vấn đề liên quan đến sản phẩm',
        members: [
          {
            userId: users[0]?._id,
            role: 'lead'
          },
          {
            userId: users[1]?._id,
            role: 'member'
          }
        ],
        categories: categories.filter(c => c.name?.toLowerCase().includes('kỹ thuật') || c.name?.toLowerCase().includes('technical')).map(c => c._id),
        iamPolicies: chatViewPolicy ? [chatViewPolicy._id] : []
      },
      {
        name: 'Chăm sóc Khách hàng',
        description: 'Team phụ trách chăm sóc khách hàng và giải quyết các vấn đề liên quan đến dịch vụ',
        members: [
          {
            userId: users[2]?._id,
            role: 'lead'
          },
          {
            userId: users[3]?._id || users[1]?._id,
            role: 'member'
          }
        ],
        categories: categories.filter(c => c.name?.toLowerCase().includes('khách hàng') || c.name?.toLowerCase().includes('customer')).map(c => c._id),
        iamPolicies: chatManagePolicy ? [chatManagePolicy._id] : []
      },
      {
        name: 'Kinh doanh',
        description: 'Team phụ trách kinh doanh và phát triển sản phẩm',
        members: [
          {
            userId: users[4]?._id || users[0]?._id,
            role: 'manager'
          },
          {
            userId: users[5]?._id || users[1]?._id,
            role: 'member'
          }
        ],
        categories: categories.filter(c => c.name?.toLowerCase().includes('kinh doanh') || c.name?.toLowerCase().includes('business')).map(c => c._id),
        iamPolicies: []
      },
      {
        name: 'Sản phẩm',
        description: 'Team phụ trách phát triển và cải tiến sản phẩm',
        members: [
          {
            userId: users[1]?._id,
            role: 'lead'
          }
        ],
        categories: categories.filter(c => c.name?.toLowerCase().includes('sản phẩm') || c.name?.toLowerCase().includes('product')).map(c => c._id),
        iamPolicies: categoryManagePolicy ? [categoryManagePolicy._id] : []
      }
    ];

    // Lưu các team vào database
    for (const teamData of teams) {
      // Lọc bỏ các userId undefined nếu có
      teamData.members = teamData.members.filter(member => member.userId);
      
      const team = new Team(teamData);
      await team.save();
      
      // Cập nhật users để thêm tham chiếu đến team
      for (const member of teamData.members) {
        if (member.userId) {
          await User.findByIdAndUpdate(
            member.userId,
            { $push: { teams: team._id } }
          );
        }
      }
      
      console.log(`Đã tạo team: ${team.name}`);
    }

    console.log('Khởi tạo Teams thành công!');
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi khởi tạo Teams:', error);
    return { success: false, error: error.message };
  }
}

// Hàm chạy độc lập nếu file được gọi trực tiếp
if (require.main === module) {
  seedTeams()
    .then(() => {
      console.log('Quá trình seeder Teams hoàn tất.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Lỗi trong quá trình seeder Teams:', error);
      process.exit(1);
    });
}

module.exports = seedTeams;
