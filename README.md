# Time Management Application

A comprehensive time management mobile application built with React Native (Expo) and Node.js, designed to help users track tasks, manage time, and visualize time allocation effectively.

## 📱 Project Description

This application provides a complete solution for personal time management with features including:

- **Task Management**: Create, edit, complete, and delete tasks with due dates and priorities
- **Time Tracking**: Built-in timer to track time spent on tasks
- **Data Visualization**: Interactive charts and statistics showing daily/weekly/monthly time allocation
- **Tag System**: Organize tasks with custom tags and colors
- **Theme Customization**: Multiple themes including gradient and solid color options
- **Multi-language Support**: English and Chinese (Simplified) language support
- **User Profile**: Customizable profile with avatar, username, and personal motto
- **Coin Rewards**: Gamification system with coins earned through task completion
- **Notifications**: Local notifications for task reminders and daily check-ins
- **Calendar View**: Browse tasks across different dates

## 🛠️ Tech Stack

### Frontend

- **Framework**: React Native 0.81.5
- **Development Platform**: Expo SDK 54
- **Language**: TypeScript 5.9.2
- **Navigation**: Expo Router 6.0.15
- **State Management**: React Context API
- **UI Components**:
  - React Native Chart Kit (for data visualization)
  - Expo Linear Gradient (for theme gradients)
  - React Native SVG (for charts and icons)
  - Expo Image Picker (for avatar selection)
- **Styling**: StyleSheet API with dynamic theming
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications
- **Real-time**: Socket.io Client

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 9.0.0
- **Real-time**: Socket.io 4.8.1
- **Environment**: dotenv for configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Expo CLI** (optional, for development)
- **Expo Go** app on your mobile device (for testing)

## 🚀 Installation & Running Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Peggy1017/MobileApplicationGroupWork.git
cd MobileApplicationGroupWork
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/timemanagement
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timemanagement

PORT=3000
```

#### Start the Backend Server

```bash
npm start
# or
node index.js
```

The backend server will start on `http://localhost:3000`.

**Note**: Ensure MongoDB is running before starting the backend server.

### 3. Frontend Setup

#### Install Dependencies

```bash
cd my-app
npm install
```

#### Configure API URL (Optional)

If your backend is running on a different IP address, update `my-app/utils/apiConfig.ts`:

```typescript
const MANUAL_IP = '192.168.0.102'; // Your computer's IP address
```

The app automatically detects the correct API URL based on:
- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Real Device: Extracts IP from Host URI or uses MANUAL_IP
- Web: `http://localhost:3000` or MANUAL_IP

#### Start the Frontend Application

```bash
npm start
# or
npx expo start
```

#### Running Options

- **Expo Go**: Scan the QR code with Expo Go app (Android/iOS)
- **Android Emulator**: Press `a` in the terminal
- **iOS Simulator**: Press `i` in the terminal (macOS only)
- **Web Browser**: Press `w` in the terminal

### 4. Building for Production

#### Android APK

```bash
cd my-app
npx expo run:android --variant release
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### iOS Build

```bash
cd my-app
npx expo run:ios --configuration Release
```

## 📁 Project Structure

```
finalProject/
├── backend/                    # Backend server
│   ├── index.js               # Express server entry point
│   ├── init-users.js          # User initialization script
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables (not in repo)
│
├── my-app/                     # Frontend mobile application
│   ├── app/                   # Expo Router pages
│   │   ├── (tabs)/            # Tab navigation screens
│   │   │   ├── index.tsx      # Today's tasks screen
│   │   │   ├── data.tsx       # Data visualization screen
│   │   │   └── profile.tsx    # Profile & settings screen
│   │   ├── add-task.tsx       # Add task screen
│   │   ├── edit-profile.tsx   # Edit profile screen
│   │   ├── timer.tsx          # Timer screen
│   │   └── review.tsx         # Task review screen
│   │
│   ├── components/            # Reusable components
│   │   ├── time-blocks-visualization.tsx
│   │   ├── calendar-horizontal.tsx
│   │   ├── date-time-picker.tsx
│   │   └── ThemedBackground.tsx
│   │
│   ├── contexts/              # React Context providers
│   │   ├── TodoContext.tsx    # Task state management
│   │   ├── UserContext.tsx   # User authentication
│   │   ├── ThemeContext.tsx  # Theme management
│   │   ├── LanguageContext.tsx # i18n support
│   │   ├── TagContext.tsx    # Tag management
│   │   ├── CoinContext.tsx   # Coin rewards system
│   │   └── NotificationContext.tsx # Notifications
│   │
│   ├── modules/               # Feature modules
│   │   └── coins/            # Coin rewards module
│   │
│   ├── utils/                 # Utility functions
│   │   └── apiConfig.ts      # API URL configuration
│   │
│   ├── types/                 # TypeScript type definitions
│   ├── assets/                # Images and static assets
│   └── package.json           # Frontend dependencies
│
└── README.md                   # This file
```

## 📸 Screenshots

### Main Screens

#### Today's Tasks Screen
![Today's Tasks](screenshots/today-tasks.png)
*View and manage your daily tasks with tags, priorities, and due dates*

#### Timer Screen
![Timer](screenshots/timer.png)
*Focus timer to track time spent on tasks*

#### Data Visualization Screen
![Data Visualization](screenshots/data-visualization.png)
*Analyze your time allocation with interactive charts*

#### Profile & Settings Screen
![Profile](screenshots/profile.png)
*Customize your profile, manage tags, and adjust settings*

#### Theme Shop
![Theme Shop](screenshots/theme-shop.png)
*Purchase and apply custom themes with coins*

### Features Showcase

#### Task Management
- Create tasks with title, description, due date, priority, and tags
- Mark tasks as complete
- Edit and delete tasks
- Filter tasks by date, tag, or completion status

#### Time Tracking
- Start/stop timer for tasks
- View time spent on each task
- Visual time blocks showing daily activity

#### Theme System
- Multiple pre-built themes (Classic Light, Classic Dark, Ocean, Sunset, etc.)
- Gradient and solid color themes
- Dynamic theme application across all screens

#### User Profile
- Customizable avatar (camera or photo library)
- Username and password management
- Personal motto display
- Tag management with custom colors

## 🔧 Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Functional components with React Hooks
- Context API for state management

### Testing

```bash
cd my-app
npm test
```

### Linting

```bash
cd my-app
npm run lint
```

## 🌐 API Configuration

The app automatically detects the correct API URL based on the runtime environment. For manual configuration, edit `my-app/utils/apiConfig.ts`:

- **Android Emulator**: Uses `10.0.2.2:3000` (maps to host machine)
- **iOS Simulator**: Uses `localhost:3000`
- **Real Device**: Extracts IP from Expo Host URI or uses `MANUAL_IP`
- **Web**: Uses `localhost:3000` or `MANUAL_IP`

## 📝 Key Features

### Task Management
- ✅ Create, edit, and delete tasks
- 📅 Set due dates and priorities
- 🏷️ Organize with custom tags
- 📊 Track completion status

### Time Tracking
- ⏱️ Built-in focus timer
- 📈 Time visualization charts
- 📊 Daily/weekly/monthly statistics

### Personalization
- 🎨 Multiple theme options
- 🌓 Dark/light mode support
- 🌐 English/Chinese language support
- 👤 Customizable user profile

### Gamification
- 🪙 Coin rewards system
- 🏆 Achievement notifications
- 🛒 Theme shop

## 🐛 Troubleshooting

### Backend Connection Issues

1. **Check if backend is running**: Ensure the backend server is started on port 3000
2. **Verify MongoDB connection**: Check that MongoDB is running and accessible
3. **Check API URL**: Verify the API URL in the app logs matches your backend address
4. **Firewall**: Ensure port 3000 is not blocked by firewall

### Frontend Issues

1. **Clear cache**: Run `npx expo start --clear`
2. **Reinstall dependencies**: Delete `node_modules` and run `npm install`
3. **Reset Metro bundler**: Stop the server and restart

### Network Issues (Real Device)

1. Ensure device and computer are on the same Wi-Fi network
2. Update `MANUAL_IP` in `utils/apiConfig.ts` to your computer's IP address
3. Check that backend server listens on `0.0.0.0` not just `localhost`

## 📄 License

ISC

## 👥 Contributors

- Peggy1017

## 📧 Contact & Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Submit a pull request
- Contact the maintainers

---

**Note**: This project uses Expo SDK 54. Some features (like push notifications) require a development build instead of Expo Go. See [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/) for more information.
