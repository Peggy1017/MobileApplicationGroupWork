// 1. 引入我们安装的包
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // 读取 .env 文件中的环境变量

// 2. 创建一个 Express 应用
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const port = process.env.PORT || 3000; // 服务器端口，默认为3000

// 存储在线用户的 socket 映射
const onlineUsers = new Map(); // username -> socket.id

// 3. 连接 MongoDB 数据库
// 确保连接到 test 数据库
const mongoUri = process.env.MONGODB_URI;
const dbName = 'test';
// 如果 URI 中没有指定数据库，添加数据库名称
const finalUri = mongoUri.includes('/?')
  ? mongoUri.replace('/?', `/${dbName}?`)
  : mongoUri.includes('?')
    ? mongoUri.replace('?', `/${dbName}?`)
    : `${mongoUri}/${dbName}`;

mongoose.connect(finalUri)
  .then(() => {
    console.log(`Successfully connected to MongoDB database: ${dbName}!`);
    // 初始化测试用户
    initializeTestUsers();
  })
  .catch(err => console.error('Connection failed:', err));

// 初始化测试用户函数
async function initializeTestUsers() {
  try {
    const testUsers = [
      { username: 'UserA', email: 'usera@test.com', password: 'password123' },
      { username: 'UserB', email: 'userb@test.com', password: 'password123' },
      { username: 'UserC', email: 'userc@test.com', password: 'password123' }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const newUser = new User(userData);
        await newUser.save();
        console.log(`Test user created: ${userData.username}`);
      } else {
        console.log(`Test user already exists: ${userData.username}`);
      }
    }
    console.log('Test users initialization completed!');
  } catch (err) {
    console.error('Error initializing test users:', err);
  }
}

// 4. 启用 CORS 以允许移动应用访问
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 5. 让我们的服务器可以解析 JSON 格式的请求体（比如POST请求发来的数据）
app.use(express.json());
// 6. 定义 User 模型（用户数据格式）
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
  },
  // 虚拟货币系统字段
  coins: {
    type: Number,
    default: 20 // 初始赠送20金币
  },
  totalEarned: {
    type: Number,
    default: 20
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  ownedThemes: {
    type: [String],
    default: ['default_light', 'default_dark'] // 默认拥有两个免费主题
  },
  currentTheme: {
    type: String,
    default: 'default_light'
  },
  lastLoginDate: {
    type: String,
    default: null
  },
  loginStreak: {
    type: Number,
    default: 0
  }
});

// 创建 User 模型
const User = mongoose.model('User', userSchema);

// 7. 定义 Message 模型（数据格式）
const messageSchema = new mongoose.Schema({
  fromUser: {
    type: String,
    required: true
  },
  toUser: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 创建一个名为 'Message' 的模型，它对应数据库中的 'messages' 集合
const Message = mongoose.model('Message', messageSchema);

// 定义 Todo 模型（任务数据格式）
const todoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  tag: {
    id: String,
    name: String,
    color: String
  },
  duration: Number, // 实际时长（分钟）- 从计时器记录
  priority: Number, // 紧急性（数字越小越紧急）
  notes: String // 备注
});

const Todo = mongoose.model('Todo', todoSchema);

// 8. 实现 API 端点

// 测试端点：GET / - 检查服务器是否运行
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!', status: 'ok' });
});

// 初始化端点：POST /init-users - 手动初始化测试用户
app.post('/init-users', async (req, res) => {
  try {
    await initializeTestUsers();
    res.json({ message: 'Test users initialization completed!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize users: ' + err.message });
  }
});

// 认证端点：POST /auth/register - 用户注册
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // 创建新用户（实际应用中应该对密码进行哈希处理）
    const newUser = new User({
      username,
      email,
      password // 注意：实际应用中应该使用 bcrypt 等库对密码进行哈希
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', username: newUser.username });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed: ' + err.message });
  }
});

// 认证端点：POST /auth/login - 用户登录
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 验证密码（实际应用中应该使用 bcrypt 比较哈希后的密码）
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// 端点：GET /users - 获取所有用户
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username email'); // 不返回密码
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

// 端点1：GET /messages - 获取消息（支持查询参数过滤）
app.get('/messages', async (req, res) => {
  try {
    const { fromUser, toUser } = req.query;

    let query = {};
    // 如果提供了 fromUser 和 toUser，返回他们之间的所有消息
    if (fromUser && toUser) {
      query = {
        $or: [
          { fromUser: fromUser, toUser: toUser },
          { fromUser: toUser, toUser: fromUser }
        ]
      };
    }

    const messages = await Message.find(query).sort({ timestamp: 1 }); // 按时间升序排列
    res.json(messages); // 将消息列表以JSON格式返回
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages: ' + err.message });
  }
});

// 端点2：POST /messages - 保存一条新消息
app.post('/messages', async (req, res) => {
  try {
    // 从请求体中获取数据
    const { fromUser, toUser, text } = req.body;

    // 验证必需字段
    if (!fromUser || !toUser || !text) {
      return res.status(400).json({ error: 'fromUser, toUser, and text are required' });
    }

    // 在数据库中创建一条新消息
    const newMessage = new Message({
      fromUser,
      toUser,
      text
      // timestamp 会自动生成
    });
    const savedMessage = await newMessage.save();

    // 返回保存成功的消息
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ error: 'Failed to save message: ' + err.message });
  }
});

// Todo API 端点

// GET /api/todos - 获取用户的所有任务
app.get('/api/todos', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos: ' + err.message });
  }
});

// POST /api/todos - 创建新任务
app.post('/api/todos', async (req, res) => {
  try {
    const { userId, text, tag, duration, priority, notes } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }
    const newTodo = new Todo({
      userId,
      text,
      tag,
      duration,
      priority,
      notes,
      completed: false,
      createdAt: new Date()
    });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create todo: ' + err.message });
  }
});

// PUT /api/todos/:id - 更新任务（完成/取消完成或更新时长）
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, userId, duration, startedAt, completedAt, text, tag, priority, notes } = req.body;

    // 验证用户ID
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 查找任务并验证所有权
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // 验证任务是否属于该用户
    if (todo.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this todo' });
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) {
        updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (startedAt !== undefined) {
      updateData.startedAt = startedAt ? new Date(startedAt) : null;
    }
    if (completedAt !== undefined && completedAt !== null) {
      updateData.completedAt = new Date(completedAt);
    }
    if (duration !== undefined) updateData.duration = duration;
    if (tag !== undefined) updateData.tag = tag;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;

    const updatedTodo = await Todo.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update todo: ' + err.message });
  }
});

// DELETE /api/todos/:id - 删除任务
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    // 验证用户ID
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 查找任务并验证所有权
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // 验证任务是否属于该用户
    if (todo.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this todo' });
    }

    await Todo.findByIdAndDelete(id);
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete todo: ' + err.message });
  }
});

// GET /api/todos/stats - 获取统计数据
app.get('/api/todos/stats', async (req, res) => {
  try {
    const { userId, period } = req.query; // period: 'day', 'week', 'month'
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const now = new Date();
    let startDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const todos = await Todo.find({
      userId,
      createdAt: { $gte: startDate }
    });

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 按标签统计（包含时长）
    const tagStats = {};
    todos.forEach(todo => {
      const tagId = todo.tag?.id || 'no-tag';
      if (!tagStats[tagId]) {
        tagStats[tagId] = {
          tag: todo.tag || { id: 'no-tag', name: '无标签', color: '#999' },
          total: 0,
          completed: 0,
          totalDuration: 0, // 总时长（分钟）
        };
      }
      tagStats[tagId].total++;

      // Calculate duration from start and end time if available
      let taskDuration = todo.duration;
      if (!taskDuration && todo.startedAt && todo.completedAt) {
        const durationMs = new Date(todo.completedAt).getTime() - new Date(todo.startedAt).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        taskDuration = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
      }

      if (todo.completed) {
        tagStats[tagId].completed++;
      }

      // 累加所有任务的时长（包括已完成和未完成的，从计时器记录）
      if (taskDuration) {
        tagStats[tagId].totalDuration += taskDuration;
      }
    });

    // 按日期分组
    const dailyData = {};
    todos.forEach(todo => {
      const dateKey = new Date(todo.createdAt).toDateString();
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, completed: 0 };
      }
      dailyData[dateKey].total++;
      if (todo.completed) {
        dailyData[dateKey].completed++;
      }
    });

    res.json({
      total,
      completed,
      pending,
      rate,
      tagStats: Object.values(tagStats),
      dailyData
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats: ' + err.message });
  }
});

// ==================== 虚拟货币系统 API ====================

// 主题列表（与前端保持一致）
const AVAILABLE_THEMES = [
  { id: 'default_light', name: 'Classic Light', nameZh: '经典浅色', price: 0, type: 'solid', colors: ['#F5F5F5'], isDefault: true },
  { id: 'default_dark', name: 'Classic Dark', nameZh: '经典深色', price: 0, type: 'solid', colors: ['#303030'], isDefault: true },
  { id: 'sunset_glow', name: 'Sunset Glow', nameZh: '日落余晖', price: 50, type: 'gradient', colors: ['#FF6B6B', '#FFA07A', '#FFD700'] },
  { id: 'ocean_breeze', name: 'Ocean Breeze', nameZh: '海洋微风', price: 50, type: 'gradient', colors: ['#667eea', '#764ba2'] },
  { id: 'aurora_night', name: 'Aurora Night', nameZh: '极光之夜', price: 80, type: 'gradient', colors: ['#0F2027', '#203A43', '#2C5364'] },
  { id: 'cherry_blossom', name: 'Cherry Blossom', nameZh: '樱花粉', price: 60, type: 'gradient', colors: ['#ffecd2', '#fcb69f'] },
  { id: 'mint_fresh', name: 'Mint Fresh', nameZh: '薄荷清新', price: 50, type: 'gradient', colors: ['#a8edea', '#fed6e3'] },
  { id: 'cosmic_purple', name: 'Cosmic Purple', nameZh: '宇宙紫', price: 100, type: 'gradient', colors: ['#4a00e0', '#8e2de2'] },
  { id: 'golden_hour', name: 'Golden Hour', nameZh: '黄金时刻', price: 70, type: 'gradient', colors: ['#f7971e', '#ffd200'] },
  { id: 'forest_dawn', name: 'Forest Dawn', nameZh: '森林黎明', price: 60, type: 'gradient', colors: ['#134e5e', '#71b280'] },
  { id: 'midnight_city', name: 'Midnight City', nameZh: '午夜都市', price: 120, type: 'gradient', colors: ['#232526', '#414345'] },
  { id: 'candy_dream', name: 'Candy Dream', nameZh: '糖果梦境', price: 80, type: 'gradient', colors: ['#f093fb', '#f5576c'] },
];

// 货币奖励配置
const COIN_REWARDS = {
  TASK_COMPLETE: 5,
  FOCUS_SESSION: 10,
  DAILY_LOGIN: 3,
  STREAK_BONUS: 2,
  FIRST_TASK_OF_DAY: 5,
};

// GET /api/coins/:username - 获取用户货币信息
app.get('/api/coins/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.coins || 20,
      totalEarned: user.totalEarned || 20,
      totalSpent: user.totalSpent || 0,
      ownedThemes: user.ownedThemes || ['default_light', 'default_dark'],
      currentTheme: user.currentTheme || 'default_light',
      loginStreak: user.loginStreak || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coins: ' + err.message });
  }
});

// GET /api/themes - 获取所有可用主题
app.get('/api/themes', (req, res) => {
  res.json(AVAILABLE_THEMES);
});

// POST /api/themes/buy - 购买主题
app.post('/api/themes/buy', async (req, res) => {
  try {
    const { username, themeId } = req.body;

    if (!username || !themeId) {
      return res.status(400).json({ error: 'Username and themeId are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查主题是否存在
    const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // 检查是否已拥有
    if (user.ownedThemes && user.ownedThemes.includes(themeId)) {
      return res.status(400).json({ error: 'Theme already owned' });
    }

    // 检查余额
    if ((user.coins || 0) < theme.price) {
      return res.status(400).json({ error: 'Insufficient coins', required: theme.price, balance: user.coins || 0 });
    }

    // 扣除货币并添加主题
    const newCoins = (user.coins || 0) - theme.price;
    const newOwnedThemes = [...(user.ownedThemes || ['default_light', 'default_dark']), themeId];
    const newTotalSpent = (user.totalSpent || 0) + theme.price;

    await User.findOneAndUpdate(
      { username },
      {
        coins: newCoins,
        ownedThemes: newOwnedThemes,
        totalSpent: newTotalSpent
      }
    );

    res.json({
      success: true,
      message: `Successfully purchased ${theme.name}`,
      balance: newCoins,
      ownedThemes: newOwnedThemes,
      totalSpent: newTotalSpent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to buy theme: ' + err.message });
  }
});

// POST /api/themes/apply - 应用主题
app.post('/api/themes/apply', async (req, res) => {
  try {
    const { username, themeId } = req.body;

    if (!username || !themeId) {
      return res.status(400).json({ error: 'Username and themeId are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查是否拥有该主题
    if (!user.ownedThemes || !user.ownedThemes.includes(themeId)) {
      return res.status(400).json({ error: 'Theme not owned' });
    }

    await User.findOneAndUpdate({ username }, { currentTheme: themeId });

    res.json({
      success: true,
      message: 'Theme applied successfully',
      currentTheme: themeId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply theme: ' + err.message });
  }
});

// POST /api/coins/reward - 奖励货币（任务完成、专注完成等）
app.post('/api/coins/reward', async (req, res) => {
  try {
    const { username, rewardType, amount } = req.body;

    if (!username || !rewardType) {
      return res.status(400).json({ error: 'Username and rewardType are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 计算奖励金额
    let rewardAmount = amount || 0;
    if (!amount) {
      switch (rewardType) {
        case 'TASK_COMPLETE':
          rewardAmount = COIN_REWARDS.TASK_COMPLETE;
          break;
        case 'FOCUS_SESSION':
          rewardAmount = COIN_REWARDS.FOCUS_SESSION;
          break;
        case 'DAILY_LOGIN':
          rewardAmount = COIN_REWARDS.DAILY_LOGIN;
          break;
        case 'FIRST_TASK_OF_DAY':
          rewardAmount = COIN_REWARDS.FIRST_TASK_OF_DAY;
          break;
        default:
          rewardAmount = 0;
      }
    }

    const newCoins = (user.coins || 0) + rewardAmount;
    const newTotalEarned = (user.totalEarned || 0) + rewardAmount;

    await User.findOneAndUpdate(
      { username },
      {
        coins: newCoins,
        totalEarned: newTotalEarned
      }
    );

    res.json({
      success: true,
      rewardType,
      rewardAmount,
      balance: newCoins,
      totalEarned: newTotalEarned
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reward coins: ' + err.message });
  }
});

// POST /api/coins/daily-login - 每日登录奖励
app.post('/api/coins/daily-login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date().toDateString();
    const lastLogin = user.lastLoginDate;

    // 检查是否今天已经领取
    if (lastLogin === today) {
      return res.json({
        success: false,
        message: 'Already claimed today',
        balance: user.coins,
        loginStreak: user.loginStreak
      });
    }

    // 计算连续登录
    let newStreak = 1;
    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = (user.loginStreak || 0) + 1;
      }
    }

    // 计算奖励：基础奖励 + 连续登录奖励
    const baseReward = COIN_REWARDS.DAILY_LOGIN;
    const streakBonus = Math.min(newStreak - 1, 7) * COIN_REWARDS.STREAK_BONUS; // 最多7天连续奖励
    const totalReward = baseReward + streakBonus;

    const newCoins = (user.coins || 0) + totalReward;
    const newTotalEarned = (user.totalEarned || 0) + totalReward;

    await User.findOneAndUpdate(
      { username },
      {
        coins: newCoins,
        totalEarned: newTotalEarned,
        lastLoginDate: today,
        loginStreak: newStreak
      }
    );

    res.json({
      success: true,
      message: 'Daily login reward claimed!',
      baseReward,
      streakBonus,
      totalReward,
      balance: newCoins,
      loginStreak: newStreak
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim daily login: ' + err.message });
  }
});

// ==================== 结束虚拟货币系统 API ====================

// 8. Socket.IO 实时聊天逻辑
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 用户加入（传入用户名）
  socket.on('join', (username) => {
    onlineUsers.set(username, socket.id);
    console.log(`${username} joined with socket id: ${socket.id}`);
    // 广播在线用户列表
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // 发送私信
  socket.on('privateMessage', async (data) => {
    const { fromUser, toUser, text } = data;

    try {
      // 保存消息到数据库
      const newMessage = new Message({
        fromUser,
        toUser,
        text
      });
      const savedMessage = await newMessage.save();

      // 发送给接收方
      const receiverSocketId = onlineUsers.get(toUser);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', savedMessage);
      }

      // 发送给发送方确认
      socket.emit('messageSent', savedMessage);
    } catch (err) {
      socket.emit('messageError', { error: err.message });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    // 从在线用户中移除
    for (const [username, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(username);
        console.log(`${username} disconnected`);
        break;
      }
    }
    // 广播更新后的在线用户列表
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});

// 9. 启动服务器，监听端口
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Socket.IO is ready for real-time chat!');
});

