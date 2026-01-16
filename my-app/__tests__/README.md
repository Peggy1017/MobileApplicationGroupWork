# 测试文档

本目录包含项目的所有测试文件，包括单元测试、集成测试和 UI 测试。

## 测试文件说明

### 单元测试 (Unit Tests)

1. **ThemeContext.test.tsx**
   - 测试 ThemeContext 的基本功能
   - 测试主题切换（浅色/深色模式）
   - 测试主题持久化（AsyncStorage）
   - 测试主色调设置
   - 测试主题颜色值

2. **CoinContext.test.tsx**
   - 测试 CoinContext 的基本功能
   - 测试金币余额和统计
   - 测试主题拥有状态检查
   - 测试主题应用功能
   - 测试可用主题列表

3. **ThemeColors.test.tsx**
   - 测试主题颜色值的正确性
   - 验证 Classic Dark 和 Classic Light 的颜色配置
   - 验证颜色格式（hex 格式）
   - 验证浅色和深色主题的差异

### 集成测试 (Integration Tests)

4. **ThemedBackground.integration.test.tsx**
   - 测试 ThemedBackground 组件与多个 Context 的集成
   - 测试默认主题渲染
   - 测试 Classic Dark 和 Classic Light 主题应用
   - 测试渐变主题渲染

5. **ThemeIntegration.test.tsx**
   - 测试 ThemeContext 和 CoinContext 之间的同步
   - 测试应用 Classic Dark 主题时 ThemeContext 的自动同步
   - 测试应用 Classic Light 主题时 ThemeContext 的自动同步
   - 测试跨 Context 的主题一致性

6. **ThemeSwitch.integration.test.tsx**
   - 测试完整的主题切换流程
   - 测试从 Classic Light 切换到 Classic Dark
   - 测试从 Classic Dark 切换到 Classic Light
   - 测试主题选择的持久化
   - 测试主题状态在 Context 更新中的维护

### UI 测试 (UI Tests)

7. **ShopScreen.ui.test.tsx**
   - 测试主题商店页面的 UI 渲染
   - 测试余额卡片显示
   - 测试可用主题列表显示
   - 测试 Classic Dark 主题的正确显示
   - 测试每日登录奖励按钮
   - 测试"如何获得金币"部分

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行测试（监视模式）
```bash
npm run test:watch
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 运行特定测试文件
```bash
npm test ThemeContext.test.tsx
```

## 测试覆盖率目标

- 单元测试覆盖率：> 80%
- 集成测试覆盖率：> 70%
- 关键功能测试覆盖率：100%

## 测试最佳实践

1. **测试隔离**：每个测试应该是独立的，不依赖其他测试的状态
2. **Mock 依赖**：使用 Jest mock 来隔离外部依赖
3. **清晰命名**：测试名称应该清楚地描述测试的内容
4. **AAA 模式**：Arrange（准备）、Act（执行）、Assert（断言）
5. **测试边界情况**：不仅要测试正常流程，还要测试错误和边界情况

## 注意事项

- 所有测试文件都使用 Jest 和 React Native Testing Library
- Mock 文件在 `jest.setup.js` 中统一配置
- 测试环境使用 `jest-expo` preset
- 某些测试可能需要调整以匹配实际的实现细节

## 待添加的测试

- [ ] E2E 测试（使用 Detox 或类似工具）
- [ ] 性能测试
- [ ] 可访问性测试
- [ ] 快照测试的更多场景
