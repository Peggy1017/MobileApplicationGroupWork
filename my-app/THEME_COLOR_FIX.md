# 主题颜色修复说明

## 问题描述
主题颜色没有正确应用，特别是 Classic Dark 模式的颜色。

## 修复内容

### 1. 更新 ThemeContext 中的 darkColors
**文件**: `contexts/ThemeContext.tsx`

**修改前**:
```typescript
const darkColors = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  primary: '#007AFF',
};
```

**修改后**:
```typescript
const darkColors = {
  background: '#303030', // Classic Dark 背景色
  surface: '#3A3A3A', // 稍浅的灰色，用于卡片
  text: '#D8D8CF', // Classic Dark 文字色
  textSecondary: '#A0A0A0', // 次要文字色
  border: '#4A4A4A', // 边框色
  primary: '#007AFF',
};
```

### 2. 更新主题定义中的 default_dark 颜色
**文件**: `modules/coins/types/theme.ts`

**修改前**:
```typescript
{
  id: 'default_dark',
  colors: ['#1C1C1E'],
  // ...
}
```

**修改后**:
```typescript
{
  id: 'default_dark',
  colors: ['#303030'], // Classic Dark 背景色
  // ...
}
```

### 3. 更新后端主题配置
**文件**: `backend/index.js`

**修改前**:
```javascript
{ id: 'default_dark', name: 'Classic Dark', nameZh: '经典深色', price: 0, type: 'solid', colors: ['#1C1C1E'], isDefault: true },
```

**修改后**:
```javascript
{ id: 'default_dark', name: 'Classic Dark', nameZh: '经典深色', price: 0, type: 'solid', colors: ['#303030'], isDefault: true },
```

### 4. 更新测试文件
**文件**: `__tests__/ThemeColors.test.tsx`

更新了测试中的期望值，使其与新的颜色值匹配。

## Classic Dark 主题颜色规范

- **背景色 (background)**: `#303030`
- **表面色 (surface)**: `#3A3A3A` (用于卡片、按钮等)
- **文字色 (text)**: `#D8D8CF`
- **次要文字色 (textSecondary)**: `#A0A0A0`
- **边框色 (border)**: `#4A4A4A`
- **主色调 (primary)**: `#007AFF` (保持不变)

## 工作原理

1. **ThemeContext** 提供全局的主题颜色，当 `isDarkMode` 为 `true` 时使用 `darkColors`
2. **CoinContext** 管理用户购买和应用的主题，包括 `default_dark` 和 `default_light`
3. **ThemedBackground** 组件根据当前应用的主题显示背景：
   - 如果应用了 `default_dark` 主题，使用 `#303030` 作为背景
   - 同时 `ThemeContext` 的 `isDarkMode` 会被设置为 `true`，文字颜色使用 `#D8D8CF`

## 验证方法

1. 切换到 Classic Dark 主题
2. 检查背景色是否为 `#303030`
3. 检查文字颜色是否为 `#D8D8CF`
4. 检查卡片、按钮等表面元素的颜色是否为 `#3A3A3A`

## 注意事项

- 这些更改会影响所有使用 `useTheme()` hook 的组件
- 确保所有组件都使用 `colors.text`、`colors.background` 等，而不是硬编码的颜色值
- 如果应用了其他自定义主题，背景色会使用主题定义的颜色，但文字颜色仍会使用 `ThemeContext` 中的颜色
