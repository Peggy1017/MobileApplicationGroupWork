import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCoins } from '@/modules/coins/context/CoinContext';
import { useUser } from '@/contexts/UserContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { currentThemeData } = useCoins();
  const { isLoggedIn } = useUser();
  
  // 根据主题设置底部导航栏背景
  const getTabBarBackground = () => {
    if (currentThemeData && !currentThemeData.isDefault) {
      if (currentThemeData.type === 'gradient' && currentThemeData.colors.length >= 2) {
        // 渐变主题：使用第一个颜色作为背景（因为 TabBar 不支持渐变）
        return currentThemeData.colors[0];
      } else if (currentThemeData.type === 'solid' && currentThemeData.colors.length > 0) {
        // 纯色主题：使用主题颜色
        return currentThemeData.colors[0];
      }
    }
    // Classic 主题：使用 surface 颜色
    return colors.surface;
  };
  
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: isLoggedIn ? { backgroundColor: getTabBarBackground() } : { display: 'none' },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('today'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: t('data'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}