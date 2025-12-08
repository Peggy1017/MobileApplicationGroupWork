import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useTags } from '@/contexts/TagContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tag } from '@/types/todo';

// For Android emulator, use 10.0.2.2 instead of localhost
const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'http://your-server-ip:3000';

export default function ProfileScreen() {
  const { currentUser, setCurrentUser, isLoggedIn, logout } = useUser();
  const { tags, addTag, updateTag, deleteTag } = useTags();
  const { isDarkMode, toggleDarkMode, primaryColor, setPrimaryColor, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#007AFF');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        Alert.alert('Error', 'Server error. Please check if the backend server is running.');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setCurrentUser(username);
        Alert.alert('Success', 'Login successful!');
        setUsername('');
        setPassword('');
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message && error.message.includes('JSON')) {
        Alert.alert('Error', 'Cannot connect to server. Please check if the backend is running on ' + API_URL);
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        Alert.alert('Error', 'Server error. Please check if the backend server is running.');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Registration successful! Please login.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setEmail('');
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.message && error.message.includes('JSON')) {
        Alert.alert('Error', 'Cannot connect to server. Please check if the backend is running on ' + API_URL);
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            setUsername('');
            setPassword('');
            setEmail('');
          },
        },
      ]
    );
  };

  const colorOptions = [
    '#FF3B30', // 红色
    '#FF9500', // 橙色
    '#FFCC00', // 黄色
    '#34C759', // 绿色
    '#007AFF', // 蓝色
    '#AF52DE', // 紫色
    '#5AC8FA', // 浅蓝色
    '#FF2D55', // 粉红色
  ];

  const openTagModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setNewTagName(tag.name);
      setNewTagColor(tag.color);
    } else {
      setEditingTag(null);
      setNewTagName('');
      setNewTagColor('#007AFF');
    }
    setTagModalVisible(true);
  };

  const handleSaveTag = () => {
    if (newTagName.trim() === '') {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    if (editingTag) {
      updateTag(editingTag.id, {
        id: editingTag.id,
        name: newTagName.trim(),
        color: newTagColor,
      });
    } else {
      addTag({
        id: Date.now().toString(),
        name: newTagName.trim(),
        color: newTagColor,
      });
    }
    setTagModalVisible(false);
    setEditingTag(null);
    setNewTagName('');
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTag(tag.id),
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={22} color={colors.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  if (isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={80} color="#007AFF" />
            </View>
            <Text style={styles.usernameText}>{currentUser}</Text>
            <Text style={styles.emailText}>User Profile</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tag Management</Text>
            <View style={[styles.settingsContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.tagsList}>
                {tags.map((tag) => (
                  <View key={tag.id} style={[styles.tagItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.tagItemLeft}>
                      <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
                      <Text style={[styles.tagItemName, { color: colors.text }]}>{tag.name}</Text>
                    </View>
                    <View style={styles.tagItemActions}>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => openTagModal(tag)}
                      >
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => handleDeleteTag(tag)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.addTagButton, { borderTopColor: colors.border }]}
                onPress={() => openTagModal()}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addTagButtonText, { color: colors.primary }]}>{t('add_new_tag')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings')}</Text>
            <View style={[styles.settingsContainer, { backgroundColor: colors.surface }]}>
              <SettingItem
                icon="notifications-outline"
                title={t('notifications')}
                subtitle={t('enable_push_notifications')}
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#ccc', true: colors.primary }}
                  />
                }
              />
              <SettingItem
                icon="moon-outline"
                title={t('dark_mode')}
                subtitle={t('switch_to_dark_theme')}
                rightComponent={
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#ccc', true: colors.primary }}
                  />
                }
              />
              <SettingItem
                icon="language-outline"
                title={t('language')}
                subtitle={language === 'en' ? 'English' : '中文'}
                onPress={() => setLanguageModalVisible(true)}
              />
              <SettingItem
                icon="color-palette-outline"
                title="Primary Color"
                subtitle={primaryColor}
                onPress={() => setColorPickerVisible(true)}
              />
              <SettingItem
                icon="help-circle-outline"
                title={t('help_support')}
                subtitle={t('get_help')}
                onPress={() => Alert.alert(t('help_support'), t('get_help'))}
              />
              <SettingItem
                icon="information-circle-outline"
                title={t('about')}
                subtitle={t('app_version')}
                onPress={() => Alert.alert(t('about'), 'Todo App\n' + t('app_version'))}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#ff3b30' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>

          {/* Tag Edit Modal */}
          <Modal
            visible={tagModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setTagModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {editingTag ? t('edit_tag') : t('add_new_tag')}
                  </Text>
                  <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>Tag Name</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter tag name"
                    placeholderTextColor={colors.textSecondary}
                    value={newTagName}
                    onChangeText={setNewTagName}
                    autoFocus
                  />

                  <Text style={[styles.modalLabel, { color: colors.text }]}>Color</Text>
                  <View style={styles.colorPicker}>
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newTagColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setNewTagColor(color)}
                      >
                        {newTagColor === color && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.background }]}
                    onPress={() => setTagModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonTextCancel, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave, { backgroundColor: colors.primary }]}
                    onPress={handleSaveTag}
                  >
                    <Text style={styles.modalButtonTextSave}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Language Selection Modal */}
          <Modal
            visible={languageModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setLanguageModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('language')}</Text>
                  <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      { backgroundColor: colors.background },
                      language === 'en' && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => {
                      setLanguage('en');
                      setLanguageModalVisible(false);
                    }}
                  >
                    <Text style={[styles.languageOptionText, { color: colors.text }]}>English</Text>
                    {language === 'en' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      { backgroundColor: colors.background },
                      language === 'zh' && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => {
                      setLanguage('zh');
                      setLanguageModalVisible(false);
                    }}
                  >
                    <Text style={[styles.languageOptionText, { color: colors.text }]}>中文</Text>
                    {language === 'zh' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Primary Color Picker Modal */}
          <Modal
            visible={colorPickerVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setColorPickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Primary Color</Text>
                  <TouchableOpacity onPress={() => setColorPickerVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <View style={styles.colorPicker}>
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          primaryColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => {
                          setPrimaryColor(color);
                          setColorPickerVisible(false);
                        }}
                      >
                        {primaryColor === color && (
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Welcome back! Please login to continue'
              : 'Create a new account to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setUsername('');
              setPassword('');
              setEmail('');
            }}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff3b30',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsList: {
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  tagItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  tagItemName: {
    fontSize: 16,
    color: '#333',
  },
  tagItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tagActionButton: {
    padding: 4,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  addTagButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    // backgroundColor will be set dynamically
  },
  modalButtonSave: {
    // backgroundColor will be set dynamically
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

