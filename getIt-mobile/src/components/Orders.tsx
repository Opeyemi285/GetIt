import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../utils/currency';
import api from '../api/client';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  storeName: string;
  storeLogo: string;
  date: string;
  status: 'In Progress' | 'Delivered' | 'Canceled';
  items: OrderItem[];
  total: number;
}

// NOTE: There is no `runners` table / dispatch system in the backend yet.
// This stays as a placeholder until that feature exists. Swap this out
// for a real fetch once order assignment/runner tracking is built.
export interface RunnerInfo {
  name: string;
  photo: string;
  rating: number;
  reviewCount: number;
}

const PLACEHOLDER_RUNNER: RunnerInfo = {
  name: 'Runner not yet assigned',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
  rating: 0,
  reviewCount: 0,
};

interface OrdersProps {
  onBack: () => void;
  onNavigateToHome: () => void;
  onNavigateToMessage: () => void;
  onNavigateToProfile: () => void;
  unreadMessage?: boolean;
}

const tabs = [
  { name: 'home',    label: 'Home',    icon: require('../../assets/tab-icons/home.png') },
  { name: 'orders',  label: 'Orders',  icon: require('../../assets/tab-icons/orders.png') },
  { name: 'message', label: 'Message', icon: require('../../assets/tab-icons/message.png') },
  { name: 'profile', label: 'Profile', icon: require('../../assets/tab-icons/profile.png') },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: Order['status']) {
  if (status === 'Canceled') return '#EF4444';
  return '#3EC481';
}

function buildItemSummary(items: OrderItem[]) {
  if (items.length === 0) return '';
  const names = items.map(i => i.name);
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
}

function formatDate(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
}

// ─── Order Detail View ────────────────────────────────────────────────────────

function OrderListDetail({ order, runner }: { order: Order; runner: RunnerInfo }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Items */}
      <Text style={[styles.sectionLabel, { marginTop: 20, marginHorizontal: 16 }]}>Items</Text>

      {order.items.map(item => (
        <View key={item.id} style={styles.orderDetailRow}>
          <Image source={{ uri: item.image }} style={styles.orderDetailImage} resizeMode="cover" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.orderDetailName}>{item.name}</Text>
            <Text style={styles.orderDetailSub}>{item.qty}x {item.unit}</Text>
          </View>
          <Text style={styles.orderDetailPrice}>{formatPrice(item.price)}</Text>
        </View>
      ))}

      {/* Total banner */}
      <View style={styles.totalBanner}>
        <Text style={styles.totalBannerLabel}>Total</Text>
        <Text style={styles.totalBannerValue}>{formatPrice(order.total)}</Text>
      </View>

      {/* Runner */}
      <Text style={[styles.sectionLabel, { marginTop: 24, marginHorizontal: 16 }]}>Your Runner</Text>
      <View style={styles.runnerCard}>
        <Image source={{ uri: runner.photo }} style={styles.runnerPhoto} resizeMode="cover" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.runnerName}>{runner.name}</Text>
          <View style={styles.runnerRatingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.runnerRating}>
              {runner.rating} ({runner.reviewCount} Reviews)
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3EC481" />
        </TouchableOpacity>
      </View>

      {/* Track Order */}
      <Text style={[styles.sectionLabel, { marginTop: 24, marginHorizontal: 16 }]}>Track Order</Text>
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: 'https://staticmap.openstreetmap.de/staticmap.php?center=6.5244,3.3792&zoom=13&size=400x220' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.mapOverlayPin}>
          <Ionicons name="location" size={32} color="#EF4444" />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Order History List ───────────────────────────────────────────────────────

function OrderHistoryList({
  orders,
  onSelectOrder,
}: {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = orders.filter(
    o =>
      o.storeName.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#A0A0A0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by store or items"
          placeholderTextColor="#A0A0A0"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={40} color="#D6D3D1" />
          <Text style={styles.emptyStateText}>
            {orders.length === 0 ? "You haven't placed any orders yet" : 'No orders match your search'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {filtered.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => onSelectOrder(order)}
              activeOpacity={0.85}
            >
              <View style={styles.orderCardTop}>
                <Image source={{ uri: order.storeLogo }} style={styles.storeLogo} resizeMode="contain" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.orderStoreName}>{order.storeName}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <Text style={[styles.orderStatus, { color: statusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
              <View style={styles.orderCardBottom}>
                <Text style={styles.orderItemsSummary} numberOfLines={1}>
                  {buildItemSummary(order.items)}
                </Text>
                <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
}

// ─── Main Orders Component ────────────────────────────────────────────────────

export default function Orders({
  onBack,
  onNavigateToHome,
  onNavigateToMessage,
  onNavigateToProfile,
  unreadMessage,
}: OrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped: Order[] = (res.data || []).map((o: any) => ({
        id: o.id,
        storeName: o.storeName,
        storeLogo: o.storeLogo,
        date: formatDate(o.date),
        status: o.status,
        total: Number(o.total),
        items: (o.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          price: Number(item.price),
          image: item.image,
        })),
      }));
      setOrders(mapped);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError('Failed to load orders. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'home')    onNavigateToHome();
    if (tabName === 'message') onNavigateToMessage();
    if (tabName === 'profile') onNavigateToProfile();
    // 'orders' → stay here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={selectedOrder ? () => setSelectedOrder(null) : onBack}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedOrder ? 'Order List' : 'Order History'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {selectedOrder ? (
          <OrderListDetail order={selectedOrder} runner={PLACEHOLDER_RUNNER} />
        ) : loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#3EC481" size="large" />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ color: '#78716C', textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity onPress={fetchOrders} style={styles.retryBtn} activeOpacity={0.8}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <OrderHistoryList orders={orders} onSelectOrder={setSelectedOrder} />
        )}
      </View>

      {/* Inline Bottom Tab Bar */}
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
                {tab.name === 'message' && !isActive && unreadMessage && (
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

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 14,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1917' },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
    gap: 12,
  },
  emptyStateText: { fontSize: 14, color: '#A8A29E', textAlign: 'center' },

  // Retry
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#3EC481',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  // Order card
  orderCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  storeLogo: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#F5F5F4' },
  orderStoreName: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 2 },
  orderDate: { fontSize: 12, color: '#78716C' },
  orderStatus: { fontSize: 13, fontWeight: '600' },
  orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemsSummary: { fontSize: 12, color: '#78716C', flex: 1, marginRight: 8 },
  orderTotal: { fontSize: 13, fontWeight: '700', color: '#1C1917' },

  // Order detail
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  orderDetailImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#F5F5F4' },
  orderDetailName: { fontSize: 14, fontWeight: '600', color: '#1C1917', marginBottom: 4 },
  orderDetailSub: { fontSize: 12, color: '#78716C' },
  orderDetailPrice: { fontSize: 14, fontWeight: '600', color: '#1C1917' },

  // Total banner
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D0F2E1',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  totalBannerLabel: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  totalBannerValue: { fontSize: 18, fontWeight: '800', color: '#1C1917' },

  // Runner
  runnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  runnerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F4',
  },
  runnerName: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 4 },
  runnerRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  runnerRating: { fontSize: 12, color: '#78716C' },
  chatBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF2',
    borderRadius: 20,
  },

  // Map
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlayPin: { position: 'absolute' },

  // Tab bar
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
    gap: 4,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 11,
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