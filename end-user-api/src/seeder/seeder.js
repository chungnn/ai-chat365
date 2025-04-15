const mongoose = require('mongoose');
const connectDB = require('../config/database');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env variables
dotenv.config();

// Import models
const Course = require('../models/Course');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Chat = require('../models/Chat');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { randomUUID } = require('crypto');

// Define Category model locally if it doesn't exist
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: '/images/default-category.jpg'
  }
});

// Pre-save hook for slug creation
CategorySchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// Define Subject model locally if it doesn't exist
const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  }
});

// Pre-save hook for slug creation
SubjectSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

// Define User model locally if it doesn't exist
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Sample data
const categoriesData = [
  {
    name: 'Khóa luyện thi đại học',
    description: 'Các khóa học luyện thi đại học với phương pháp hiệu quả',
    slug: 'khoa-luyen-thi-dai-hoc'
  },
  {
    name: 'Khóa bổ trợ kiến thức',
    description: 'Các khóa học bổ trợ kiến thức, giải đáp các bài tập khó',
    slug: 'khoa-bo-tro-kien-thuc'
  },
  {
    name: 'Khóa ôn thi học kỳ',
    description: 'Các khóa học ôn thi học kỳ, nâng cao điểm số',
    slug: 'khoa-on-thi-hoc-ky'
  }
];

const subjectsData = [
  {
    name: 'Toán',
    description: 'Môn Toán học',
    slug: 'toan'
  },
  {
    name: 'Lý',
    description: 'Môn Vật Lý',
    slug: 'ly'
  },
  {
    name: 'Hóa',
    description: 'Môn Hóa học',
    slug: 'hoa'
  },
  {
    name: 'Sinh',
    description: 'Môn Sinh học',
    slug: 'sinh'
  },
  {
    name: 'Văn',
    description: 'Môn Ngữ Văn',
    slug: 'van'
  },
  {
    name: 'Anh',
    description: 'Môn Tiếng Anh',
    slug: 'anh'
  }
];

const usersData = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    phoneNumber: '0987654321',
    role: 'admin'
  },
  {
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@example.com',
    password: 'password123',
    phoneNumber: '0123456789',
    role: 'user'
  },
  {
    firstName: 'Trần',
    lastName: 'Thị B',
    email: 'tranthib@example.com',
    password: 'password123',
    phoneNumber: '0123456788',
    role: 'user'
  }
];

// Function to generate sample courses
const generateCoursesData = (categories, subjects) => {
  const courses = [];
  
  // Generate courses for each category
  categories.forEach(category => {
    // Generate courses for different subjects in this category
    subjects.forEach((subject, index) => {
      if (index % 2 === 0) { // Only create courses for some subjects to avoid too many
        const courseName = `Khóa học ${subject.name} ${category.name.includes('đại học') ? 'chuyên sâu' : 'cơ bản'}`;
        const price = category.name.includes('đại học') ? 999000 : 499000;
        // Generate slug from course name
        const slug = courseName.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        slug = slug + randomUUID().slice(0, 8); // Append random UUID to ensure uniqueness
        
        courses.push({
          name: courseName,
          slug: slug,
          description: `${courseName} giúp học sinh nắm vững kiến thức ${subject.name}`,
          longDescription: `${courseName} với phương pháp giảng dạy hiệu quả, bài tập đa dạng, giúp học sinh nắm vững kiến thức ${subject.name} và đạt điểm cao trong các kỳ thi.`,
          price: price,
          discountPrice: price * 0.8,
          duration: '3 tháng',
          level: category.name.includes('đại học') ? 'Nâng cao' : 'Cơ bản',
          category: category._id,
          subjects: [subject._id],
          features: [
            'Video bài giảng chất lượng cao',
            'Bài tập kèm lời giải chi tiết',
            'Giáo trình đầy đủ, dễ hiểu',
            'Hỗ trợ giải đáp 24/7'
          ],
          isActive: true,
          isPopular: index === 0
        });
      }
    });
  });
  
  return courses;
};

// Function to import data
const importData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected!');
    
    // Clear existing data
    await Category.deleteMany();
    await Subject.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    console.log('Database cleared');
    
    // Import categories
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`${createdCategories.length} categories created`);
    
    // Import subjects
    const createdSubjects = await Subject.insertMany(subjectsData);
    console.log(`${createdSubjects.length} subjects created`);
    
    // Import users
    const createdUsers = await User.insertMany(usersData);
    console.log(`${createdUsers.length} users created`);
    
    // Generate and import courses
    const coursesData = generateCoursesData(createdCategories, createdSubjects);
    const createdCourses = await Course.insertMany(coursesData);
    console.log(`${createdCourses.length} courses created`);
    
    console.log('Data import completed successfully');
    process.exit();
  } catch (error) {
    console.error(`Error during import: ${error.message}`);
    process.exit(1);
  }
};

// Function to destroy data
const destroyData = async () => {
  try {
    await connectDB();
    
    await Category.deleteMany();
    await Subject.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    
    console.log('All data destroyed');
    process.exit();
  } catch (error) {
    console.error(`Error during destruction: ${error.message}`);
    process.exit(1);
  }
};

// Execute based on command line argument
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}