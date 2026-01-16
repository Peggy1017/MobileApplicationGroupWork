# Android APK 构建指南

## 项目状态
✅ Android 项目文件已通过 `expo prebuild` 成功生成
✅ 所有必要的配置文件已就位
✅ 项目代码保持不变，仅添加了 Android 原生代码

## ⚠️ 重要：如何正确运行 Android 应用

### 问题说明
**不要在 `android` 目录下直接运行应用！** 

如果你在 `my-app/android` 目录下直接运行，应用会显示空白页面或错误，因为：
1. JavaScript bundle 还没有被构建
2. React Native 需要从项目根目录（`my-app`）加载源代码
3. Metro bundler 需要在正确的目录下运行

### ✅ 正确的运行方式

#### 方法 1: 使用 Expo CLI 运行（推荐用于开发）

```bash
# 在 my-app 目录下（不是 android 目录）
cd finalProject/my-app
npm run android
# 或者
npx expo run:android
```

这会：
- 自动启动 Metro bundler
- 构建 JavaScript bundle
- 编译并安装 APK 到设备/模拟器
- 自动连接 Metro bundler 进行热重载

#### 方法 2: 手动启动 Metro + Gradle

```bash
# 终端 1: 在 my-app 目录下启动 Metro bundler
cd finalProject/my-app
npm start

# 终端 2: 在 android 目录下构建并安装
cd finalProject/my-app/android
./gradlew installDebug
```

#### 方法 3: 构建独立的 APK（用于分发）

如果你想构建一个**不依赖 Metro bundler**的独立 APK：

```bash
# 在 my-app 目录下
cd finalProject/my-app

# 构建 Debug APK（包含 bundle）
npx expo run:android --variant debug

# 或构建 Release APK
npx expo run:android --variant release
```

生成的 APK 位置：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

**注意**: 这些 APK 已经包含了 JavaScript bundle，可以直接安装运行，不需要 Metro bundler。

## 构建 APK 的步骤（用于分发）

### 方法 1: 使用 Expo CLI 构建（推荐）

```bash
# 在项目根目录（my-app）
cd finalProject/my-app
npx expo run:android --variant release
```

### 方法 2: 使用 Gradle 直接构建

```bash
# 在项目根目录（my-app）
cd finalProject/my-app

# 构建 Debug APK
cd android
./gradlew assembleDebug

# 构建 Release APK
./gradlew assembleRelease
```

**注意**: 
- 使用 Gradle 直接构建时，bundle 会在构建过程中自动生成
- 确保在 `my-app` 目录下有 `node_modules` 和所有依赖
- Release APK 目前使用 debug keystore 签名。生产环境需要配置自己的 keystore。

### 方法 3: 使用 Android Studio

1. 打开 Android Studio
2. 选择 `File` -> `Open` -> 选择 `android` 文件夹
3. 等待 Gradle 同步完成
4. 选择 `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
5. 等待构建完成，APK 位置会显示在通知中

## 项目配置信息

- **应用包名**: `com.peggy1017.myapp`
- **版本号**: `1.0.0`
- **版本代码**: `1`
- **最小 SDK**: 由 Expo 自动配置
- **目标 SDK**: 由 Expo 自动配置

## 重要提示

1. **Keystore 配置**: 
   - 当前 Release 构建使用 debug keystore
   - 生产环境需要生成自己的 keystore 并配置签名
   - 参考: https://reactnative.dev/docs/signed-apk-android

2. **项目结构**:
   - 原项目代码在 `app/`, `components/`, `contexts/` 等目录，保持不变
   - Android 原生代码在 `android/` 目录
   - 两个部分独立，互不影响

3. **重新生成 Android 项目**:
   ```bash
   npx expo prebuild --platform android --clean
   ```

4. **清理构建缓存**:
   ```bash
   cd android
   ./gradlew clean
   ```

## 首次构建前的配置

### 1. 配置 Android SDK 路径

创建 `android/local.properties` 文件（如果不存在），添加以下内容：

**Windows:**
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```
或者使用反斜杠：
```properties
sdk.dir=C:/Users/YourUsername/AppData/Local/Android/Sdk
```

**macOS/Linux:**
```properties
sdk.dir=/Users/YourUsername/Library/Android/sdk
```

**查找 Android SDK 路径的方法：**
- Windows: 通常在 `%LOCALAPPDATA%\Android\Sdk` 或 `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- macOS: 通常在 `~/Library/Android/sdk`
- Linux: 通常在 `~/Android/Sdk`

或者设置环境变量 `ANDROID_HOME`：
- Windows: 在系统环境变量中设置 `ANDROID_HOME` 指向 Android SDK 目录
- macOS/Linux: 在 `~/.bashrc` 或 `~/.zshrc` 中添加：
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

### 2. 安装 Android SDK

如果还没有安装 Android SDK：
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 打开 Android Studio -> SDK Manager (Tools -> SDK Manager)
3. 安装以下组件：
   - Android SDK Platform (最新版本)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

## 常见问题

### ❌ 问题：应用显示空白页面或错误

**原因**: 在 `android` 目录下直接运行，没有 JavaScript bundle

**解决方案**:
1. 确保从 `my-app` 目录运行，而不是 `android` 目录
2. 使用 `npm run android` 或 `npx expo run:android`
3. 如果使用 Android Studio，确保先运行 `npm start` 启动 Metro bundler

### ❌ 问题：找不到 JavaScript bundle

**原因**: Bundle 没有正确构建

**解决方案**:
```bash
# 在 my-app 目录下
cd finalProject/my-app

# 清理并重新构建
cd android
./gradlew clean
cd ..
npx expo run:android
```

### ❌ 问题：构建失败 - SDK location not found
- 确保已安装 Android SDK 和构建工具
- 创建 `android/local.properties` 文件并设置 `sdk.dir` 路径
- 或设置 `ANDROID_HOME` 环境变量
- 运行 `./gradlew clean` 清理缓存

### ❌ 问题：其他构建错误
- 确保 Java JDK 已安装（推荐 JDK 17 或更高版本）
- 检查网络连接（需要下载依赖）
- 查看完整错误日志：`./gradlew assembleDebug --stacktrace`
- 确保在 `my-app` 目录下有完整的 `node_modules`

### ❌ 问题：APK 文件过大
- 启用代码混淆和资源压缩
- 在 `android/app/build.gradle` 中配置 ProGuard
- 考虑使用 AAB (Android App Bundle) 格式

### ✅ 验证应用是否正常工作

运行应用后，你应该看到：
- 应用正常启动（不是空白页面）
- 可以正常导航和使用功能
- 如果使用 `npm run android`，修改代码后会自动热重载
