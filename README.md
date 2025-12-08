# Time Management Application

一个基于 React Native (Expo) 和 Node.js 的时间管理应用，帮助用户追踪任务、管理时间并可视化时间分配。

## 📁 项目结构

```
finalProject/
├── backend/              # 后端服务器 (Express + MongoDB)
│   ├── index.js         # 服务器入口文件
│   ├── init-users.js    # 用户初始化脚本
│   └── package.json     # 后端依赖配置
│
├── my-app/              # 前端移动应用 (React Native + Expo)
│   ├── app/             # 应用页面 (Expo Router)
│   │   ├── (tabs)/      # 标签页导航
│   │   │   ├── index.tsx    # 今日任务页面
│   │   │   ├── data.tsx     # 数据统计页面
│   │   │   └── profile.tsx   # 个人设置页面
│   │   ├── timer.tsx    # 计时器页面
│   │   ├── review.tsx   # 任务回顾页面
│   │   └── add-task.tsx # 添加任务页面
│   │
│   ├── components/      # 可复用组件
│   │   ├── time-blocks-visualization.tsx  # 时间块可视化
│   │   ├── calendar-horizontal.tsx        # 横向日历
│   │   ├── date-time-picker.tsx           # 日期时间选择器
│   │   └── ...
│   │
│   ├── contexts/        # React Context 状态管理
│   │   ├── TodoContext.tsx    # 任务状态管理
│   │   ├── UserContext.tsx    # 用户状态管理
│   │   ├── ThemeContext.tsx   # 主题管理
│   │   ├── LanguageContext.tsx # 语言管理
│   │   └── TagContext.tsx      # 标签管理
│   │
│   ├── types/           # TypeScript 类型定义
│   ├── hooks/           # 自定义 React Hooks
│   ├── constants/       # 常量配置
│   └── assets/          # 静态资源
│
└── README.md            # 项目说明文档
```

## 🚀 快速开始

### 前置要求

- Node.js (v18 或更高版本)
- npm 或 yarn
- MongoDB (本地或远程)
- Expo CLI (用于移动应用开发)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/Peggy1017/MobileApplicationGroupWork.git
cd MobileApplicationGroupWork
```

#### 2. 安装后端依赖

```bash
cd backend
npm install
```

#### 3. 配置后端环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

#### 4. 启动后端服务器

```bash
cd backend
node index.js
```

后端服务器将在 `http://localhost:3000` 启动。

#### 5. 安装前端依赖

```bash
cd my-app
npm install
```

#### 6. 启动前端应用

```bash
cd my-app
npx expo start
```

使用 Expo Go 应用扫描二维码，或在模拟器中运行。

## ✨ 主要功能

- ✅ **任务管理**: 创建、编辑、完成和删除任务
- ⏱️ **计时器**: 追踪任务执行时间
- 📊 **数据可视化**: 时间块图表和统计信息
- 🏷️ **标签系统**: 使用标签分类任务
- 🌓 **主题切换**: 支持深色/浅色模式
- 🌐 **多语言**: 支持中英文切换
- 📅 **日历视图**: 查看不同日期的任务
- 📈 **时间分析**: 查看每日/每周/每月的时间分配

## 🛠️ 技术栈

### 前端
- React Native
- Expo
- TypeScript
- React Context API
- React Native Chart Kit
- Expo Router

### 后端
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.io

## 📝 开发

### 项目结构说明

- `backend/`: 后端 API 服务器，处理数据持久化和业务逻辑
- `my-app/`: 前端移动应用，使用 Expo 框架
- `my-app/app/`: 使用 Expo Router 的文件路由系统
- `my-app/components/`: 可复用的 UI 组件
- `my-app/contexts/`: 全局状态管理

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 组件使用函数式组件和 Hooks

## 📄 许可证

ISC

## 👥 贡献者

- Peggy1017

## 📧 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

