// Coins Module - 虚拟货币模块入口
// 按照模块化结构组织的货币系统

// Types - 类型定义
export * from './types/theme';

// Context - 状态管理
export { CoinProvider, useCoins } from './context/CoinContext';

// Components - 组件
export { default as CoinRewardToast } from './components/CoinRewardToast';

// Screens - 页面组件
export { default as ShopScreen } from './screens/ShopScreen';

// Utils - 工具函数
export * from './utils/coinHelpers';
