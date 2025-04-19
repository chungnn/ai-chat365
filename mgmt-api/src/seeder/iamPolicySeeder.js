const mongoose = require('mongoose');
const IAMPolicy = require('../models/IAMPolicy');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Seeder cho các IAM Policy cơ bản
 * Tạo và gán các policy cho admin với các quyền khác nhau
 */
async function seedPolicies() {
  try {
    console.log('Bắt đầu khởi tạo IAM Policies...');

    // Kết nối đến database nếu chưa được kết nối
    if (mongoose.connection.readyState !== 1) {
      console.log('Đang kết nối đến MongoDB...');
      await mongoose.connect(config.mongodb.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Đã kết nối đến MongoDB');
    }
    
    // Các policy mẫu
    const policies = [
      // 1. Full Admin Policy - Quyền toàn bộ hệ thống
      {
        name: 'FullAdminPolicy',
        description: 'Quyền đầy đủ cho admin trên toàn bộ hệ thống',
        isSystemPolicy: true,
        version: '2023-01-01',
        statement: [
          {
            effect: 'Allow',
            action: ['*'],
            resource: ['*']
          }
        ]
      },
        // 2. Chat Admin Policy - Quyền quản lý chỉ phần chat
      {
        name: 'ChatAdminPolicy',
        description: 'Quyền quản lý chỉ dành cho phần chat',
        isSystemPolicy: true,
        version: '2023-01-01',
        statement: [
          {
            effect: 'Allow',
            action: ['chat:*'],
            resource: ['urn:chat:*:*:*']
          },
          {
            effect: 'Allow',
            action: ['tag:*'],
            resource: ['urn:tag:*:*:*']
          },
          {
            effect: 'Allow',
            action: ['user:View'],
            resource: ['urn:user:*:*:*']
          },
          {
            effect: 'Allow',
            action: ['team:View', 'team:List'],
            resource: ['urn:team:*:*:*']
          },
          {
            effect: 'Allow',
            action: ['category:View', 'category:List'],
            resource: ['urn:category:*:*:*']
          },          {
            effect: 'Deny',
            action: [
              'user:Create', 'user:Update', 'user:Delete',
              'team:Create', 'team:Update', 'team:Delete',
              'category:Create', 'category:Update', 'category:Delete',
              'iam:*', 'kb:*'
            ],
            resource: ['*']
          }
        ]
      },
        // 3. Team Manager Policy - Quyền quản lý team
      {
        name: 'TeamManagerPolicy',
        description: 'Quyền quản lý chỉ trong phạm vi team',
        isSystemPolicy: true,
        version: '2023-01-01',
        statement: [          {
            effect: 'Allow',
            action: ['chat:*'],
            resource: ['urn:chat:team:${context:user.teamIds}:*']
          },          {
            effect: 'Allow',
            action: ['team:View', 'team:List', 'team:Update'],
            resource: ['urn:team:${context:user.teamIds}:*:*']
          },
          {            effect: 'Allow',
            action: ['user:View', 'user:List'],
            resource: ['urn:user:*:*:*']
          },
          {
            effect: 'Allow',
            action: ['kb:View', 'kb:List'],            resource: ['urn:kb:*:*:*']
          }
        ]
      },
      
      // 4. Agent Policy - Quyền cho nhân viên hỗ trợ
      {
        name: 'AgentPolicy',
        description: 'Quyền cơ bản cho nhân viên hỗ trợ',
        isSystemPolicy: true,
        version: '2023-01-01',
        statement: [          {
            effect: 'Allow',
            action: ['chat:View', 'chat:List', 'chat:Reply'],
            resource: ['urn:chat:agent:${context:user.id}:*', 'urn:chat:team:${context:user.teamIds}:*']
          },{
            effect: 'Allow',
            action: ['kb:View', 'kb:List'],
            resource: ['urn:kb:*:*:*']
          },
          {
            effect: 'Deny',
            action: ['chat:Delete'],
            resource: ['urn:chat:*:*:*']
          }
        ]
      }
    ];

    // Tìm và xóa các system policy nếu đã tồn tại
    await IAMPolicy.deleteMany({ isSystemPolicy: true });
    
    // Thêm các policy mới
    const createdPolicies = await IAMPolicy.insertMany(policies);
    console.log(`Đã tạo ${createdPolicies.length} IAM Policies.`);
    
    // Map để lưu các policy theo tên
    const policyMap = {};
    createdPolicies.forEach(policy => {
      policyMap[policy.name] = policy._id;
    });
    
    // Tạo hoặc cập nhật Admin với Full quyền
    let fullAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!fullAdmin) {
      console.log('Tạo user Full Admin...');
      fullAdmin = new User({
        firstName: 'Full',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin'
      });
      
      await fullAdmin.save();
      console.log('Đã tạo user Full Admin');
    }
    
    // Gán policy Full Admin
    if (policyMap.FullAdminPolicy) {
      fullAdmin.iamPolicies = [policyMap.FullAdminPolicy];
      await fullAdmin.save();
      console.log('Đã gán FullAdminPolicy cho admin@example.com');
    }
    
    // Tạo hoặc cập nhật Chat Admin
    let chatAdmin = await User.findOne({ email: 'chatadmin@example.com' });
    if (!chatAdmin) {
      console.log('Tạo user Chat Admin...');
      chatAdmin = new User({
        firstName: 'Chat',
        lastName: 'Admin',
        email: 'chatadmin@example.com',
        password: 'Admin@123',
        role: 'admin'
      });
      
      await chatAdmin.save();
      console.log('Đã tạo user Chat Admin');
    }
    
    // Gán policy Chat Admin
    if (policyMap.ChatAdminPolicy) {
      chatAdmin.iamPolicies = [policyMap.ChatAdminPolicy];
      await chatAdmin.save();
      console.log('Đã gán ChatAdminPolicy cho chatadmin@example.com');
    }
      console.log('Khởi tạo IAM Policies và gán quyền cho admin hoàn tất!');
    
    // Luôn đóng kết nối khi script hoàn thành
    await mongoose.disconnect();
    console.log('Đã đóng kết nối MongoDB');
    
  } catch (error) {
    console.error('Lỗi trong quá trình seed IAM Policies:', error);
    process.exit(1);
  }
}

// Chỉ chạy script nếu được gọi trực tiếp từ dòng lệnh
if (require.main === module) {
  seedPolicies()
    .then(() => {
      console.log('Seeding hoàn tất!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Lỗi trong quá trình seeding:', err);
      process.exit(1);
    });
} else {
  // Nếu được import từ file khác, không tự động chạy
  console.log('iamPolicySeeder chỉ được thiết kế để chạy trực tiếp từ dòng lệnh.');
}
