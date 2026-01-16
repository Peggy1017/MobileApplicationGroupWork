# 测试实现总结

## 📁 测试文件结构

### 配置文件（3个）

#### 1. `jest.config.js` - Jest 主配置文件
**作用**: 配置 Jest 测试运行器的核心设置

**关键配置**:
- **preset**: `jest-expo` - 使用 Expo 预设配置
- **setupFiles**: 按顺序加载 `jest.preset.js` 和 `jest.setup.js`
- **testEnvironment**: `jsdom` - 使用 jsdom 环境运行 React Native 测试
- **testTimeout**: `20000ms` - 增加超时时间以支持集成测试
- **moduleNameMapper**: 
  - 映射 `@/` 路径别名
  - 重定向 Expo Winter runtime 文件到 mock
- **transformIgnorePatterns**: 配置哪些模块需要转译

**实现原理**:
```javascript
// 关键：setupFiles 的顺序很重要
setupFiles: ['<rootDir>/jest.preset.js', '<rootDir>/jest.setup.js']
// jest.preset.js 先运行，设置全局对象
// jest.setup.js 后运行，设置模块 mock
```

#### 2. `jest.preset.js` - Jest 预设配置（最先运行）
**作用**: 在**任何模块导入之前**设置全局对象，修复 Expo Winter runtime 问题

**关键实现**:
- Mock `TextDecoder` / `TextEncoder` 及其 Stream 版本
- Mock `structuredClone`
- Mock `__ExpoImportMetaRegistry`（关键修复）
- 同时在 `global` 和 `window` 上设置

**为什么需要这个文件**:
- Expo Winter runtime 在模块加载时就会访问这些全局对象
- 如果这些对象不存在，会导致 `ReferenceError`
- 必须在任何模块导入之前设置，所以放在 `setupFiles` 的第一位

#### 3. `jest.setup.js` - Jest 设置文件
**作用**: 设置所有模块的 mock

**Mock 的模块**:
- `@react-native-async-storage/async-storage` - 使用官方 mock
- `expo-notifications` - Mock 所有通知相关 API
- `expo-device` - Mock 设备检测
- `expo-linear-gradient` - Mock 渐变组件
- `expo-router` - Mock 路由功能
- `expo-splash-screen` - Mock 启动屏
- `expo-status-bar` - Mock 状态栏
- `react-native-reanimated` - Mock 动画库

**实现原理**:
```javascript
jest.mock('module-name', () => ({
  // 返回 mock 实现
}));
```

### 辅助文件（1个）

#### 4. `__tests__/expo-winter-fix.js` - Expo Winter 运行时修复
**作用**: 作为 Expo Winter runtime 文件的替代实现

**使用场景**:
- 当 Jest 尝试导入 `expo/src/winter/runtime.native` 时
- 当 Jest 尝试导入 `expo/src/winter/installGlobal` 时
- 通过 `moduleNameMapper` 重定向到这里

**实现**:
```javascript
// 提供空的实现，避免运行时错误
module.exports = {};
```

---

## 🧪 测试文件分类

### 单元测试（Unit Tests）

#### 1. `ThemeContext.test.tsx` - 主题上下文单元测试
**测试内容**:
- 默认提供浅色主题
- 切换深色模式
- 从 AsyncStorage 加载保存的主题
- 设置主色调
- 提供正确的颜色值

**实现方式**:
```typescript
// 使用 renderHook 测试 React Hook
const { result } = renderHook(() => useTheme(), { wrapper });

// 使用 waitFor 等待异步操作
await waitFor(() => {
  expect(result.current.isDarkMode).toBe(true);
});

// 使用 act 包装状态更新
await act(async () => {
  await result.current.toggleDarkMode();
});
```

**Mock 策略**:
- Mock `AsyncStorage` - 控制存储行为
- Mock `useColorScheme` - 控制系统主题检测

#### 2. `CoinContext.test.tsx` - 货币上下文单元测试
**测试内容**:
- 初始状态
- 奖励金币
- 购买主题
- 应用主题
- 检查主题拥有状态

**实现方式**:
- Mock `UserContext` - 提供测试用户
- Mock `ThemeContext` - 提供测试主题
- Mock `fetch` - 模拟 API 调用
- 使用真实的 `AsyncStorage` mock

#### 3. `ThemeColors.test.tsx` - 主题颜色值测试
**测试内容**:
- 验证浅色和深色主题的颜色值是否正确

**实现方式**:
- 直接导入主题配置
- 断言颜色值

#### 4. `NotificationContext.test.tsx` - 通知上下文单元测试
**测试内容**:
- 初始状态
- 请求权限
- 安排任务提醒
- 更新设置

**实现方式**:
- Mock `expo-notifications`
- Mock `UserContext` 和 `LanguageContext`
- 使用 `render` 和 `fireEvent` 测试组件交互

### 组件测试（Component Tests）

#### 5. `ThemedBackground.test.tsx` - 主题背景组件测试
**测试内容**:
- 使用默认主题颜色
- 使用自定义主题（纯色）
- 使用自定义主题（渐变）
- 禁用自定义主题时使用系统主题

**实现方式**:
- Mock `LinearGradient`
- Mock `useCoins` hook
- 使用 `render` 渲染组件
- 检查样式属性

#### 6. `ShopScreen.ui.test.tsx` - 商店界面 UI 测试
**测试内容**:
- 渲染余额卡片
- 显示可用主题
- 显示每日登录奖励按钮
- 显示如何赚取金币部分

**实现方式**:
- 使用真实的 Provider（`ThemeProvider`, `CoinProvider` 等）
- Mock `expo-router`
- Mock `fetch` 用于 API 调用
- 使用 `waitFor` 等待异步渲染

### 集成测试（Integration Tests）

#### 7. `ThemedBackground.integration.test.tsx` - 主题背景集成测试
**测试内容**:
- 主题背景与主题上下文集成
- 主题切换时背景更新

**实现方式**:
- 使用真实的 Context Provider
- 测试多个 Context 之间的交互

#### 8. `ThemeIntegration.test.tsx` - 主题集成测试
**测试内容**:
- `CoinContext` 和 `ThemeContext` 之间的同步
- 应用 Classic Dark 主题时同步深色模式
- 应用 Classic Light 主题时同步浅色模式
- 跨上下文的一致性

**实现方式**:
```typescript
// 创建包含所有 Provider 的 TestWrapper
const TestWrapper = ({ children }) => (
  <UserProvider>
    <ThemeProvider>
      <CoinProvider>{children}</CoinProvider>
    </ThemeProvider>
  </UserProvider>
);

// 使用两个 renderHook 分别测试两个 Context
const { result: themeResult } = renderHook(() => useTheme(), { wrapper: TestWrapper });
const { result: coinResult } = renderHook(() => useCoins(), { wrapper: TestWrapper });

// 分阶段验证：
// 1. 先验证 AsyncStorage 是否更新
await waitFor(async () => {
  const savedTheme = await AsyncStorage.getItem('@app_theme');
  expect(savedTheme).toBe('dark');
});

// 2. 再验证 React 状态是否同步
await waitFor(async () => {
  expect(themeResult.current.isDarkMode).toBe(true);
}, { timeout: 15000, interval: 500 });
```

**关键挑战**:
- React 状态更新是异步的
- 需要等待状态在组件树中传播
- 使用 `waitFor` 和 `act` 确保状态更新完成

#### 9. `ThemeSwitch.integration.test.tsx` - 主题切换集成测试
**测试内容**:
- 从 Classic Light 切换到 Classic Dark
- 从 Classic Dark 切换到 Classic Light
- 主题选择的持久化
- 跨上下文更新的状态一致性

**实现方式**:
- 类似 `ThemeIntegration.test.tsx`
- 测试完整的主题切换流程
- 验证状态持久化

### 其他测试

#### 10. `sanity.test.js` - 基础健全性测试
**测试内容**:
- 验证测试环境是否正常工作

---

## 🔧 关键技术实现

### 1. Mock AsyncStorage 的真实存储

**问题**: 默认的 AsyncStorage mock 不真正存储值

**解决方案**:
```typescript
// 创建真实的存储对象
const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
}));

// 在 beforeEach 中清理
beforeEach(() => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
});
```

### 2. 处理异步状态更新

**问题**: React 状态更新是异步的，测试中需要等待

**解决方案**:
```typescript
// 方法 1: 使用 waitFor
await waitFor(
  () => {
    expect(result.current.isDarkMode).toBe(true);
  },
  { timeout: 15000, interval: 500 }
);

// 方法 2: 使用 act 包装异步操作
await act(async () => {
  await result.current.applyTheme('default_dark');
  await new Promise(resolve => setTimeout(resolve, 100));
});

// 方法 3: 分阶段验证
// 先验证 AsyncStorage（确认操作执行）
await waitFor(async () => {
  const savedTheme = await AsyncStorage.getItem('@app_theme');
  expect(savedTheme).toBe('dark');
});

// 再验证 React 状态（等待状态传播）
await waitFor(() => {
  expect(themeResult.current.isDarkMode).toBe(true);
});
```

### 3. 修复 Expo Winter Runtime 问题

**问题**: Expo Winter 在测试环境中访问不存在的全局对象

**解决方案**:
1. **jest.preset.js** - 在模块导入前设置全局对象
2. **moduleNameMapper** - 重定向 Expo Winter 文件到 mock
3. **expo-winter-fix.js** - 提供空的替代实现

### 4. 测试多个 Context 的交互

**问题**: 需要测试多个 Context 之间的数据同步

**解决方案**:
```typescript
// 创建包含所有 Provider 的包装器
const TestWrapper = ({ children }) => (
  <UserProvider>
    <ThemeProvider>
      <CoinProvider>{children}</CoinProvider>
    </ThemeProvider>
  </UserProvider>
);

// 使用多个 renderHook
const { result: themeResult } = renderHook(() => useTheme(), { wrapper: TestWrapper });
const { result: coinResult } = renderHook(() => useCoins(), { wrapper: TestWrapper });

// 测试交互
await act(async () => {
  await coinResult.current.applyTheme('default_dark');
});

// 验证两个 Context 都更新了
expect(coinResult.current.currentTheme).toBe('default_dark');
expect(themeResult.current.isDarkMode).toBe(true);
```

---

## 📊 测试统计

### 测试文件数量
- **单元测试**: 4 个文件
- **组件测试**: 2 个文件
- **集成测试**: 3 个文件
- **配置文件**: 3 个文件
- **辅助文件**: 1 个文件
- **总计**: 13 个测试相关文件

### 测试覆盖
- **Contexts**: ThemeContext, CoinContext, NotificationContext
- **Components**: ThemedBackground, ShopScreen
- **Integration**: 主题系统集成，主题切换流程

### 当前测试状态
- ✅ **8 个测试套件通过**
- ⚠️ **2 个测试套件失败**（主题同步相关的集成测试，主要是异步状态更新问题）
- ✅ **45 个测试通过**
- ⚠️ **6 个测试失败**（需要更长的等待时间处理 React 状态更新）

---

## 🎯 最佳实践

### 1. Mock 顺序很重要
- 全局对象 mock 必须在模块导入前（`jest.preset.js`）
- 模块 mock 在设置文件中（`jest.setup.js`）
- 测试特定的 mock 在测试文件中

### 2. 异步测试策略
- 使用 `waitFor` 等待异步操作
- 使用 `act` 包装状态更新
- 分阶段验证（先验证副作用，再验证状态）

### 3. 集成测试的挑战
- React 状态更新是异步的，需要足够的等待时间
- 使用真实的 Provider 而不是 mock
- 验证多个 Context 之间的数据一致性

### 4. 错误处理
- 提供详细的错误信息（包含当前状态值）
- 使用 `onTimeout` 回调提供调试信息
- 记录尝试次数以便调试

---

## 📝 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- __tests__/ThemeContext.test.tsx

# 运行测试并查看覆盖率
npm run test:coverage

# 监视模式
npm run test:watch
```

---

## 🔍 调试技巧

1. **查看详细错误**: 使用 `--verbose` 标志
2. **增加超时时间**: 在测试中设置 `timeout` 参数
3. **检查 AsyncStorage**: 在测试中打印 `mockStorage` 的值
4. **使用 console.log**: 在关键点添加日志（注意：某些测试会抑制 console）

---

## 📚 相关文档

- [Jest 文档](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing-with-jest/)
