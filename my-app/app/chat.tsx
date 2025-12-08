import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator or physical device, use your computer's IP address
const API_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000'  // Android emulator
    : 'http://localhost:3000'  // iOS simulator
  : 'http://your-server-ip:3000';  // Production - replace with your server IP

interface Message {
  _id: string;
  fromUser: string;
  toUser: string;
  text: string;
  timestamp: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser, isLoggedIn } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatPartner, setChatPartner] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      Alert.alert('Not Logged In', 'Please login first to use chat', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [isLoggedIn, currentUser]);

  // Get chat partner from route params
  useEffect(() => {
    if (params?.partner && typeof params.partner === 'string') {
      setChatPartner(params.partner);
    }
  }, [params]);

  // Fetch messages from backend
  const fetchMessages = async () => {
    if (!chatPartner || !currentUser) return;
    
    try {
      // Fetch messages between current user and chat partner
      const response = await fetch(`${API_URL}/messages?fromUser=${currentUser}&toUser=${chatPartner}`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return;
      }

      const data = await response.json();
      // Filter messages to show only messages between current user and chat partner
      const filteredMessages = data.filter((msg: Message) => 
        (msg.fromUser === currentUser && msg.toUser === chatPartner) ||
        (msg.fromUser === chatPartner && msg.toUser === currentUser)
      );
      setMessages(filteredMessages);
      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message to backend
  const sendMessage = async () => {
    if (!inputText.trim() || !chatPartner || !currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUser: currentUser,
          toUser: chatPartner,
          text: inputText.trim(),
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setInputText('');
        // Refresh messages after sending
        await fetchMessages();
      } else {
        console.error('Error sending message:', data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages on mount and set up polling
  useEffect(() => {
    if (chatPartner && currentUser) {
      fetchMessages();
      // Poll for new messages every 2 seconds
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [chatPartner, currentUser]);

  const renderMessage = ({ item }: { item: Message }) => {
    if (!currentUser) return null;
    const isFromCurrentUser = item.fromUser === currentUser;
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft
      ]}>
        <Text style={[
          styles.messageText,
          isFromCurrentUser ? styles.messageTextRight : styles.messageTextLeft
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageUser,
          isFromCurrentUser ? styles.messageUserRight : styles.messageUserLeft
        ]}>
          {isFromCurrentUser ? 'You' : item.fromUser}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {chatPartner ? `Chat with ${chatPartner}` : 'Chat'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            onSubmitEditing={sendMessage}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>SEND</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 60,
  },
  headerSpacer: {
    width: 24,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextLeft: {
    color: '#333',
  },
  messageTextRight: {
    color: '#fff',
  },
  messageUser: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  messageUserLeft: {
    color: '#333',
  },
  messageUserRight: {
    color: '#fff',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

