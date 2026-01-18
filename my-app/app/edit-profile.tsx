import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCoins } from '@/modules/coins/context/CoinContext';
import ThemedBackground from '@/components/ThemedBackground';
import { API_URL } from '@/utils/apiConfig';

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser, setCurrentUser } = useUser();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { currentThemeData } = useCoins();
  
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [motto, setMotto] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // 加载用户信息
  useEffect(() => {
    loadUserInfo();
  }, [currentUser]);

  const loadUserInfo = async () => {
    if (!currentUser) {
      router.back();
      return;
    }

    try {
      setLoadingUser(true);
      const response = await fetch(`${API_URL}/users/${currentUser}`);
      
      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        Alert.alert(
          t('error'),
          'Server error. Please check if the backend server is running.'
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded user info for edit:', { username: data.username, avatar: data.avatar, motto: data.motto, allData: data });
        setUsername(data.username || currentUser);
        setAvatar(data.avatar || null);
        setMotto(data.motto || ''); // 和用户名一样，直接设置，没有就用空字符串
      } else {
        try {
          const errorData = await response.json();
          Alert.alert(t('error'), errorData.error || 'Failed to load user information');
        } catch (parseError) {
          Alert.alert(t('error'), `Failed to load user information (Status: ${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      Alert.alert(t('error'), 'Network error. Please check if the backend server is running.');
    } finally {
      setLoadingUser(false);
    }
  };

  const pickImage = async () => {
    try {
      // 动态导入 expo-image-picker
      const ImagePicker = await import('expo-image-picker');
      
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), 'Permission to access camera roll is required!');
        return;
      }

      Alert.alert(
        t('select_image'),
        '',
        [
          {
            text: t('take_photo'),
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // 降低质量以减少文件大小
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
              }
            },
          },
          {
            text: t('choose_from_library'),
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // 降低质量以减少文件大小
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
              }
            },
          },
          {
            text: t('cancel'),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      // 如果 expo-image-picker 未安装，提示用户
      Alert.alert(
        t('error'),
        'expo-image-picker is not installed. Please run: npx expo install expo-image-picker',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // 验证密码
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('password_mismatch'));
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {};
      
      if (username !== currentUser) {
        updateData.newUsername = username;
      }
      
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      if (avatar !== null) {
        updateData.avatar = avatar;
      }
      
      // 座右铭：始终发送，和用户名类似的处理方式
      // 空字符串或只有空格时发送 null，否则发送原始值（包括空格）
      updateData.motto = (motto && motto.trim()) ? motto : null;
      
      console.log('Sending update data:', { ...updateData, password: updateData.password ? '***' : undefined, avatar: updateData.avatar ? 'base64...' : null });

      const response = await fetch(`${API_URL}/users/${currentUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        Alert.alert(
          t('error'),
          'Server error. Please check if the backend server is running.'
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Profile updated successfully:', { 
          username: data.username, 
          motto: data.motto,
          allData: data 
        });
        // 如果用户名改变了，更新 currentUser
        if (data.username && data.username !== currentUser) {
          setCurrentUser(data.username);
        }
        Alert.alert(t('success') || 'Success', t('profile_updated'));
        // 延迟一下再返回，确保数据已保存
        setTimeout(() => {
          router.back();
        }, 100);
      } else {
        try {
          const errorData = await response.json();
          Alert.alert(t('error'), errorData.error || 'Failed to update profile');
        } catch (parseError) {
          Alert.alert(t('error'), `Failed to update profile (Status: ${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('error'), 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <ThemedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  // 获取输入框背景颜色（根据主题自动调整）
  const getInputBackgroundColor = () => {
    // colors.surface 会根据 isDarkMode 自动变化：
    // - 浅色模式: #FFFFFF (白色)
    // - 深色模式: #3A3A3A (深灰色)
    return colors.surface;
  };

  // 获取 header 背景样式
  const getHeaderBackground = () => {
    if (currentThemeData && !currentThemeData.isDefault && currentThemeData.type === 'gradient') {
      return (
        <LinearGradient
          colors={currentThemeData.colors as [string, string, ...string[]]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('edit_profile')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>
              {loading ? '...' : t('save')}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      );
    } else if (currentThemeData && !currentThemeData.isDefault && currentThemeData.type === 'solid' && currentThemeData.colors.length > 0) {
      return (
        <View style={[styles.header, { backgroundColor: currentThemeData.colors[0], borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('edit_profile')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>
              {loading ? '...' : t('save')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('edit_profile')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>
              {loading ? '...' : t('save')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        {getHeaderBackground()}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={60} color="#fff" />
                </View>
              )}
              <View style={[styles.avatarEditIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarLabel, { color: colors.textSecondary }]}>
              {t('change_avatar')}
            </Text>
          </View>

          {/* Username Section */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('username')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: getInputBackgroundColor(), color: colors.text, borderColor: colors.border }]}
              placeholder={t('username')}
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('new_password')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: getInputBackgroundColor(), color: colors.text, borderColor: colors.border }]}
              placeholder={t('new_password')}
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Section */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('confirm_password')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: getInputBackgroundColor(), color: colors.text, borderColor: colors.border }]}
              placeholder={t('confirm_password')}
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {/* Motto Section */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('motto')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: getInputBackgroundColor(), color: colors.text, borderColor: colors.border }]}
              placeholder={t('enter_motto')}
              placeholderTextColor={colors.textSecondary}
              value={motto}
              onChangeText={setMotto}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 44,
  },
});
