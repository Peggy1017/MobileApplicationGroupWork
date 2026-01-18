import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import ThemedBackground from '@/components/ThemedBackground';
import { API_URL } from '@/utils/apiConfig';

interface User {
  _id: string;
  username: string;
  email: string;
}

export default function ChatSelectScreen() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      Alert.alert('Not Logged In', 'Please login first to select a chat partner', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    fetchUsers();
  }, [currentUser, isLoggedIn]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users`);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        // If endpoint doesn't exist, show some default users
        setUsers([
          { _id: '1', username: 'UserB', email: 'userb@example.com' },
          { _id: '2', username: 'UserC', email: 'userc@example.com' },
        ]);
        return;
      }

      const data = await response.json();
      // Filter out current user
      const otherUsers = data.filter((user: User) => user.username !== currentUser);
      setUsers(otherUsers.length > 0 ? otherUsers : [
        { _id: '1', username: 'UserB', email: 'userb@example.com' },
        { _id: '2', username: 'UserC', email: 'userc@example.com' },
      ]);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // If endpoint doesn't exist, show some default users
      setUsers([
        { _id: '1', username: 'UserB', email: 'userb@example.com' },
        { _id: '2', username: 'UserC', email: 'userc@example.com' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectChatPartner = (username: string) => {
    router.push({
      pathname: '/chat',
      params: { partner: username },
    });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => selectChatPartner(item.username)}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color="#007AFF" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Chat Partner</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users available</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

