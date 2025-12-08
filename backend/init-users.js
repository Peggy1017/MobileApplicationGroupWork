// 初始化测试用户脚本
const mongoose = require('mongoose');
require('dotenv').config();

// 定义 User 模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// 连接 MongoDB 数据库（确保连接到 test 数据库）
const mongoUri = process.env.MONGODB_URI;
const dbName = 'test';
// 如果 URI 中没有指定数据库，添加数据库名称
const finalUri = mongoUri.includes('/?') 
  ? mongoUri.replace('/?', `/${dbName}?`)
  : mongoUri.includes('?') 
    ? mongoUri.replace('?', `/${dbName}?`)
    : `${mongoUri}/${dbName}`;

async function initializeTestUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(finalUri);
    console.log(`Successfully connected to database: ${dbName}!`);

    const testUsers = [
      { username: 'UserA', email: 'usera@test.com', password: 'password123' },
      { username: 'UserB', email: 'userb@test.com', password: 'password123' },
      { username: 'UserC', email: 'userc@test.com', password: 'password123' }
    ];

    console.log('Initializing test users...');
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const newUser = new User(userData);
        await newUser.save();
        console.log(`✓ Test user created: ${userData.username} (password: ${userData.password})`);
      } else {
        console.log(`- Test user already exists: ${userData.username}`);
      }
    }
    
    // 显示所有用户
    const allUsers = await User.find().select('username email');
    console.log(`\nTotal users in database: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });
    
    console.log('\nTest users initialization completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing test users:', err);
    process.exit(1);
  }
}

initializeTestUsers();

