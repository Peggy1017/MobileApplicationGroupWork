import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * 手动设置 IP 地址（如果需要）
 * 如果自动检测失败，请在这里设置您的电脑 IP 地址
 * Windows: 运行 ipconfig 查找 IPv4 地址
 * Mac/Linux: 运行 ifconfig 查找本地网络 IP
 */
const MANUAL_IP = '192.168.0.102'; // 您的 Wi-Fi 网络 IP 地址

/**
 * 获取 API URL
 * - Android 模拟器: http://10.0.2.2:3000
 * - iOS 模拟器: http://localhost:3000
 * - 真实设备: 使用电脑的 IP 地址
 */
export function getApiUrl(): string {
  if (!__DEV__) {
    return 'http://your-server-ip:3000'; // 生产环境
  }

  const isRealDevice = Device.isDevice;
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  
  // 优先从 hostUri 提取 IP 地址（适用于真实设备、虚拟机环境等）
  // 这样可以处理虚拟机、NAT 网络等复杂网络环境
  if (hostUri) {
    const parts = hostUri.split(':');
    const host = parts[0];
    
    // 如果是 IP 地址格式（包含点且是4段数字）
    if (host && host.includes('.') && host.split('.').length === 4) {
      // 验证是否是有效的 IP 地址
      const ipParts = host.split('.');
      const isValidIP = ipParts.every(part => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255;
      });
      
      if (isValidIP) {
        console.log('✅ 从 Host URI 自动检测到 IP 地址:', host);
        console.log('   这适用于虚拟机、真实设备等环境');
        return `http://${host}:3000`;
      }
    }
    
    // 如果是 tunnel 模式（exp.direct），使用手动设置的 IP
    if (hostUri.includes('exp.direct')) {
      console.warn('⚠️ 检测到 Expo tunnel 模式。使用手动设置的 IP 地址');
      if (MANUAL_IP) {
        return `http://${MANUAL_IP}:3000`;
      }
      console.warn('⚠️ 请在 utils/apiConfig.ts 中设置 MANUAL_IP 为您的电脑 IP 地址');
    }
  }

  // 如果手动设置了 IP，使用手动设置的 IP（作为后备）
  if (MANUAL_IP) {
    console.log('✅ 使用手动设置的 IP 地址:', MANUAL_IP);
    return `http://${MANUAL_IP}:3000`;
  }

  // 模拟器情况（当没有 hostUri 时使用）
  if (Platform.OS === 'android' && !isRealDevice) {
    console.log('✅ 检测到 Android 模拟器（标准环境），使用 10.0.2.2:3000');
    return 'http://10.0.2.2:3000';
  }
  
  if (Platform.OS === 'ios' && !isRealDevice) {
    console.log('✅ 检测到 iOS 模拟器，使用 localhost:3000');
    return 'http://localhost:3000';
  }
  
  // Web 平台
  if (Platform.OS === 'web') {
    console.log('✅ Web 平台，使用 localhost:3000');
    return 'http://localhost:3000';
  }

  // 默认情况
  console.warn('⚠️ 无法自动检测 IP，使用默认值 localhost:3000');
  return 'http://localhost:3000';
}

// 导出常量以便直接使用
export const API_URL = getApiUrl();

// 开发环境下打印调试信息
if (__DEV__) {
  console.log('API_URL configured:', API_URL);
  console.log('Platform:', Platform.OS);
  console.log('Host URI:', Constants.expoConfig?.hostUri || Constants.manifest?.hostUri);
  console.log('Is Real Device:', Device.isDevice);
}
