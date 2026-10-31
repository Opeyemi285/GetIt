import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  senderName: string;
  senderPhoto: string;
  lastMessage: string;
  time: string;
  unread: number;
  isRunner?: boolean;
}

interface MessageProps {
  onBack: () => void;
  onNavigateToHome: () => void;
  onNavigateToOrders: () => void;
  onNavigateToProfile: () => void;
  chats: ChatMessage[];
  setChats: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const INITIAL_CHATS: ChatMessage[] = [];

const tabs = [
  { name: 'home',    label: 'Home',    icon: require('../../assets/tab-icons/home.png') },
  { name: 'orders',  label: 'Orders',  icon: require('../../assets/tab-icons/orders.png') },
  { name: 'message', label: 'Message', icon: require('../../assets/tab-icons/message.png') },
  { name: 'profile', label: 'Profile', icon: require('../../assets/tab-icons/profile.png') },
];

// ─── Chat Thread View ─────────────────────────────────────────────────────────

interface ChatBubble {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

function ChatThread({ chat, onBack }: { chat: ChatMessage; onBack: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await api.get(`/messages/${chat.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [chat.id]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post(
        `/messages/${chat.id}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Thread header */}
      <View style={styles.threadHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>
        <Image source={{ uri: chat.senderPhoto }} style={styles.threadAvatar} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.threadName}>{chat.senderName}</Text>
          {chat.isRunner && <Text style={styles.threadSub}>Runner · Active now</Text>}
        </View>
        <TouchableOpacity>
          <Ionicons name="call-outline" size={22} color="#3EC481" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: '#FAFAF9' }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {loadingMessages ? (
          <ActivityIndicator color="#3EC481" size="small" style={{ marginTop: 40 }} />
        ) : messages.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#A0A0A0', marginTop: 40 }}>
            No messages yet. Say hello!
          </Text>
        ) : (
          messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.bubbleWrap, msg.fromMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}
            >
              <View style={[styles.bubble, msg.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMe]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={styles.bubbleTime}>{msg.time}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor="#A0A0A0"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Message Component ───────────────────────────────────────────────────

export default function Message({
  onBack,
  onNavigateToHome,
  onNavigateToOrders,
  onNavigateToProfile,
  chats,
  setChats,
}: MessageProps) {
  const [activeTab, setActiveTab] = useState('message');
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [search, setSearch] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await api.get('/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  const totalUnread = chats.reduce((sum, c) => sum + c.unread, 0);

  const filtered = chats.filter(c =>
    c.senderName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectChat = async (chat: ChatMessage) => {
    setChats(prev =>
      prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c)
    );
    setSelectedChat({ ...chat, unread: 0 });
    try {
      const token = await AsyncStorage.getItem('token');
      await api.patch(`/messages/${chat.id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'home')    onNavigateToHome();
    if (tabName === 'orders')  onNavigateToOrders();
    if (tabName === 'profile') onNavigateToProfile();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {selectedChat ? (
        <ChatThread chat={selectedChat} onBack={() => setSelectedChat(null)} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#1C1917" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={22} color="#3EC481" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#A0A0A0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#A0A0A0"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ✅ flex: 1 wrapper pushes tab bar to bottom */}
          <View style={{ flex: 1 }}>
            {loadingChats ? (
              <ActivityIndicator color="#3EC481" size="large" style={{ marginTop: 40 }} />
            ) : chats.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#A0A0A0', marginTop: 60, fontSize: 14 }}>
                No messages yet
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {filtered.map(chat => (
                  <TouchableOpacity
                    key={chat.id}
                    style={styles.chatRow}
                    onPress={() => handleSelectChat(chat)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.avatarWrap}>
                      <Image source={{ uri: chat.senderPhoto }} style={styles.avatar} />
                      {chat.isRunner && <View style={styles.onlineDot} />}
                    </View>

                    <View style={styles.chatInfo}>
                      <View style={styles.chatTopRow}>
                        <Text style={styles.chatName} numberOfLines={1}>{chat.senderName}</Text>
                        <Text style={styles.chatTime}>{chat.time}</Text>
                      </View>
                      <View style={styles.chatBottomRow}>
                        <Text style={styles.chatPreview} numberOfLines={1}>
                          {chat.lastMessage}
                        </Text>
                        {chat.unread > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{chat.unread}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}

      {/* Bottom Tab Bar — always fixed to bottom, hidden in chat thread */}
      {!selectedChat && (
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleTabPress(tab.name)}
                activeOpacity={1}
              >
                <View>
                  <Image
                    source={tab.icon}
                    style={[styles.tabIcon, isActive && { tintColor: '#3EC481' }]}
                    resizeMode="contain"
                  />
                  {tab.name === 'message' && !isActive && totalUnread > 0 && (
                    <View style={styles.tabDot} />
                  )}
                </View>
                <Text style={[styles.tabLabel, { color: isActive ? '#3EC481' : '#000' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEF',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1917' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1917' },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
    backgroundColor: '#FFF',
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F5F5F4' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#3EC481', borderWidth: 2, borderColor: '#FFF',
  },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 14, fontWeight: '700', color: '#1C1917', flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11, color: '#A0A0A0' },
  chatBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatPreview: { fontSize: 13, color: '#78716C', flex: 1, marginRight: 8 },

  unreadBadge: {
    backgroundColor: '#3EC481',
    borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEF',
  },
  threadAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F4', marginLeft: 8 },
  threadName: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  threadSub: { fontSize: 11, color: '#3EC481' },

  bubbleWrap: { maxWidth: '78%' },
  bubbleWrapLeft: { alignSelf: 'flex-start' },
  bubbleWrapRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 2 },
  bubbleThem: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0' },
  bubbleMe: { backgroundColor: '#3EC481' },
  bubbleText: { fontSize: 14, color: '#1C1917', lineHeight: 20 },
  bubbleTextMe: { color: '#FFF' },
  bubbleTime: { fontSize: 10, color: '#A0A0A0', marginHorizontal: 4 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  chatInput: {
    flex: 1, backgroundColor: '#F5F5F4',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1C1917',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3EC481', alignItems: 'center', justifyContent: 'center',
  },

  tabBar: {
    flexDirection: 'row', 
    backgroundColor: '#fde4c1',
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    paddingBottom: 20, 
    paddingTop: 10, 
    paddingHorizontal: 16,
  },
  tab: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 4 
  },
  tabIcon: { 
    width: 24, 
    height: 24 
  },
  tabLabel: { 
    fontSize: 11 
  },

  tabDot: {
    position: 'absolute',
    top: -2, 
    right: -2,
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'red',
  },
});