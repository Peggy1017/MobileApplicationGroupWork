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

  // 如果手动设置了 IP，优先使用
  if (MANUAL_IP) {
    return `http://${MANUAL_IP}:3000`;
  }

  // 检测是否是真实设备
  const isRealDevice = Device.isDevice;
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  
  // 如果是真实设备（包括 tunnel 模式）
  if (isRealDevice && hostUri) {
    // 尝试从 hostUri 提取 IP 地址
    // hostUri 可能是 "192.168.1.100:8081" 或 "pzpq55k-peggy1017-8081.exp.direct"
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
        return `http://${host}:3000`;
      }
    }
    
    // 如果是 tunnel 模式（exp.direct），需要手动设置 IP
    // 因为 tunnel 域名无法直接访问本地服务器
    if (hostUri.includes('exp.direct')) {
      console.warn('⚠️ 检测到 Expo tunnel 模式。请在 utils/apiConfig.ts 中设置 MANUAL_IP 为您的电脑 IP 地址');
      // 返回一个提示性的 URL，实际使用时需要设置 MANUAL_IP
    }
  }

  // 模拟器情况
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'; // Android 模拟器
  } else {
    return 'http://localhost:3000'; // iOS 模拟器或 Web
  }
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
