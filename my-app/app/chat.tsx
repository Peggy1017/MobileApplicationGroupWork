import { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { io, Socket } from 'socket.io-client';
import ThemedBackground from '@/components/ThemedBackground';
import { API_URL } from '@/utils/apiConfig';

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
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

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

  // Use ref to track chatPartner for socket event handlers (avoid closure trap)
  const chatPartnerRef = useRef(chatPartner);
  useEffect(() => {
    chatPartnerRef.current = chatPartner;
  }, [chatPartner]);

  // Initialize Socket.IO connection - only depends on currentUser
  useEffect(() => {
    if (!currentUser) return;

    // Create socket connection
    const socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
      // Join with username
      socket.emit('join', currentUser);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Receive online users list
    socket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    // Receive new message (from other user)
    socket.on('newMessage', (message: Message) => {
      // Use ref to get latest chatPartner value
      const partner = chatPartnerRef.current;
      // Only add if it's from our chat partner
      if (message.fromUser === partner || message.toUser === partner) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Confirmation that our message was sent
    socket.on('messageSent', (message: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Handle message error
    socket.on('messageError', (error: { error: string }) => {
      Alert.alert('Error', error.error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]); // Only re-create socket when currentUser changes


  // Fetch initial message history
  const fetchMessages = useCallback(async () => {
    if (!chatPartner || !currentUser) return;

    try {
      const response = await fetch(`${API_URL}/messages?fromUser=${currentUser}&toUser=${chatPartner}`);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return;
      }

      const data = await response.json();
      const filteredMessages = data.filter((msg: Message) =>
        (msg.fromUser === currentUser && msg.toUser === chatPartner) ||
        (msg.fromUser === chatPartner && msg.toUser === currentUser)
      );
      setMessages(filteredMessages);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatPartner, currentUser]);

  // Load initial messages when chat partner changes
  useEffect(() => {
    if (chatPartner && currentUser) {
      fetchMessages();
    }
  }, [chatPartner, currentUser, fetchMessages]);

  // Send message via Socket.IO
  const sendMessage = () => {
    if (!inputText.trim() || !chatPartner || !currentUser) return;
    if (!socketRef.current?.connected) {
      Alert.alert('Not Connected', 'Please wait for connection to be established');
      return;
    }

    setLoading(true);

    // Send via Socket.IO
    socketRef.current.emit('privateMessage', {
      fromUser: currentUser,
      toUser: chatPartner,
      text: inputText.trim(),
    });

    setInputText('');
    setLoading(false);
  };

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

  const isPartnerOnline = onlineUsers.includes(chatPartner);

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {chatPartner ? `Chat with ${chatPartner}` : 'Chat'}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: connected ? (isPartnerOnline ? '#34C759' : '#FF9500') : '#FF3B30' }
                ]} />
                <Text style={styles.statusText}>
                  {!connected ? 'Connecting...' : (isPartnerOnline ? 'Online' : 'Offline')}
                </Text>
              </View>
            </View>
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
              </View>
            }
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
              editable={!loading && connected}
            />
            <TouchableOpacity
              style={[styles.sendButton, (loading || !connected) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={loading || !inputText.trim() || !connected}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedBackground>
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
  headerCenter: {
    flex: 1,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
