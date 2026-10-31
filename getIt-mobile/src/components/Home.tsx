import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView, BlurTargetView } from 'expo-blur';
import AppText from './AppText';
import { Product } from '../types';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../utils/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Store {
  id: string;
  name: string;
  image_url: string | null;
}

interface PopularItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  image_url: string | null;
  category?: string;
}

interface RecommendedItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  image_url: string | null;
  store: string;
  category?: string;
}

interface HomeData {
  stores: Store[];
  popular_items: PopularItem[];
  recommended: RecommendedItem[];
}

interface SearchProduct {
  id: string;
  store_id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  store: string;
}

interface SearchStore {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
}

interface SearchResults {
  products: SearchProduct[];
  stores: SearchStore[];
}

interface HomeProps {
  onSelectProduct: (product: Product) => void;
  cartCount: number;
  onNavigateToNewRequest: () => void;
  onNavigateToCart: () => void;
  onNavigateToOrders: () => void;
  onNavigateToMessage: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSearch?: () => void;
  unreadMessage?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const tabs = [
  { name: 'home',    label: 'Home',    icon: require('../../assets/tab-icons/home.png') },
  { name: 'orders',  label: 'Orders',  icon: require('../../assets/tab-icons/orders.png') },
  { name: 'message', label: 'Message', icon: require('../../assets/tab-icons/message.png') },
  { name: 'profile', label: 'Profile', icon: require('../../assets/tab-icons/profile.png') },
];

const categories = ['Grocery', 'Pharmacy', 'Restaurant', 'Toiletries', 'Electronics'];

const FALLBACK_STORE = require('../../assets/stores/grocery-store.png');
const FALLBACK_ITEM  = require('../../assets/popular-items/skincare-product.png');

const { width } = Dimensions.get('window');
const cardWidth = (width - 30 - 12) / 2;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning!';
  if (hour < 17) return 'Good Afternoon!';
  return 'Good Evening!';
};

// ─── Search Overlay ───────────────────────────────────────────────────────────

function SearchOverlay({
  visible,
  onClose,
  token,
  onSelectProduct,
  onSelectStoreCategory,
}: {
  visible: boolean;
  onClose: () => void;
  token: string;
  onSelectProduct: (product: Product) => void;
  onSelectStoreCategory: (category: string) => void;
}) {
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start(() => inputRef.current?.focus());
    } else {
      Keyboard.dismiss();
      Animated.timing(slideAnim, {
        toValue: -screenHeight,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setQuery('');
        setResults(null);
        setError('');
      });
    }
  }, [visible]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!token) return;
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/home/search/products', {
          params: { q: query.trim() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data);
      } catch {
        setError('Search failed. Try again.');
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query, token]);

  const hasResults =
    results && (results.products.length > 0 || results.stores.length > 0);

  const handleSelectProduct = (item: SearchProduct) => {
    const productObj: Product = {
      id: item.id,
      storeId: item.store_id,
      title: item.name,
      price: Number(item.price),
      image: item.image_url || '',
      category: item.category || 'Grocery',
      rating: 4.8,
      reviewsCount: 120,
      description: `High-quality ${item.name} from ${item.store}. Fresh and delivered to your doorstep.`,
      sizes: ['Standard'],
      colors: [],
    };
    onSelectProduct(productObj);
  };

  return (
    <Animated.View
      style={[styles.searchOverlay, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.searchOverlayBar}>
        <View style={styles.searchOverlayInput}>
          <Ionicons name="search-outline" size={18} color="#A0A0A0" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search stores or items..."
            placeholderTextColor="#A0A0A0"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#A0A0A0" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
          <AppText style={styles.cancelText}>Cancel</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <ActivityIndicator color="#4bd381" size="small" style={{ marginTop: 30 }} />
        )}
        {!loading && error !== '' && (
          <AppText style={styles.searchEmptyText}>{error}</AppText>
        )}
        {!loading && query.trim().length >= 2 && !hasResults && !error && (
          <AppText style={styles.searchEmptyText}>No results for "{query}"</AppText>
        )}
        {!loading && query.trim().length < 2 && (
          <AppText style={styles.searchHintText}>Type at least 2 characters to search</AppText>
        )}

        {results && results.stores.length > 0 && (
          <>
            <AppText style={styles.searchSectionTitle}>Stores</AppText>
            {results.stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={styles.searchRow}
                activeOpacity={0.75}
                onPress={() => { onSelectStoreCategory(store.category); onClose(); }}
              >
                <Image
                  source={store.image_url ? { uri: store.image_url } : FALLBACK_STORE}
                  style={styles.searchRowImage}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.searchRowName}>{store.name}</AppText>
                  <AppText style={styles.searchRowSub}>{store.category}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#A0A0A0" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {results && results.products.length > 0 && (
          <>
            <AppText style={styles.searchSectionTitle}>Products</AppText>
            {results.products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.searchRow}
                activeOpacity={0.75}
                onPress={() => { handleSelectProduct(product); onClose(); }}
              >
                <Image
                  source={product.image_url ? { uri: product.image_url } : FALLBACK_ITEM}
                  style={styles.searchRowImage}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.searchRowName}>{product.name}</AppText>
                  <AppText style={styles.searchRowSub}>{product.store} · {product.category}</AppText>
                </View>
                <AppText style={styles.searchRowPrice}>{formatPrice(product.price)}</AppText>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────

export default function Home({
  onSelectProduct,
  cartCount,
  onNavigateToNewRequest, // add this
  onNavigateToCart,
  onNavigateToOrders,
  onNavigateToMessage,
  onNavigateToProfile,
  onNavigateToSearch,
  unreadMessage,
}: HomeProps) {
  const blurTargetRef = useRef<View | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('Grocery');
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const FAB_LABEL_WIDTH = 100;
  const [fabCollapsed, setFabCollapsed] = useState(false);
  const fabAnim = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = plus only
  const lastY = useRef(0);

  useEffect(() => {
    Animated.timing(fabAnim, {
      toValue: fabCollapsed ? 0 : 1,
      duration: 250,
      useNativeDriver: false, // animating width can't use the native driver
    }).start();
  }, [fabCollapsed]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > lastY.current + 4 && y > 80) setFabCollapsed(true);
    else if (y < 40) setFabCollapsed(false);
    lastY.current = y;
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken || '');
      } catch {
        setToken('');
      }
    };
    loadToken();
  }, []);

  const fetchHomeData = useCallback(async (category: string) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/home/${category}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomeData(res.data);
    } catch {
      setError('Failed to load data. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token !== null) fetchHomeData(activeCategory);
  }, [activeCategory, token, fetchHomeData]);

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'orders')  onNavigateToOrders();
    if (tabName === 'message') onNavigateToMessage();
    if (tabName === 'profile') onNavigateToProfile();
  };

  const handleProductPress = (item: any) => {
    const productObj: Product = {
      id: item.id,
      storeId: item.store_id,
      title: item.name,
      price: Number(item.price),
      image: item.image_url || '',
      category: item.category || activeCategory,
      rating: 4.8,
      reviewsCount: 120,
      description: `High-quality ${item.name} from our verified store. Fresh and delivered to your doorstep.`,
      sizes: ['Standard'],
      colors: [],
    };
    onSelectProduct(productObj);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF9" />

      {/* Search overlay sits above everything */}
      <SearchOverlay
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        token={token || ''}
        onSelectProduct={onSelectProduct}
        onSelectStoreCategory={(category) => {
          if (categories.includes(category)) setActiveCategory(category);
        }}
      />

      {/* Content */}
      <BlurTargetView ref={blurTargetRef} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.greeting}>{getGreeting()}</AppText>
          <TouchableOpacity onPress={onNavigateToCart} style={styles.cartBtn} activeOpacity={0.8}>
            <Image source={require('../../assets/shopping-cart.png')} style={styles.cartIcon} resizeMode="contain" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <AppText style={styles.cartBadgeText}>{cartCount}</AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar (button) */}
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.8}
          onPress={() => onNavigateToSearch ? onNavigateToSearch() : setSearchOpen(true)}
        >
          <Ionicons name="search-outline" size={18} color="#A0A0A0" />
          <AppText style={styles.searchPlaceholder}>Search for store or items</AppText>
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                onPress={() => setActiveCategory(category)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Body */}
        {loading && !homeData ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#4bd381" size="large" />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <AppText style={{ color: 'gray', textAlign: 'center' }}>{error}</AppText>
            <TouchableOpacity
              onPress={() => fetchHomeData(activeCategory)}
              style={styles.retryBtn}
              activeOpacity={0.8}
            >
              <AppText style={{ color: '#fff', fontWeight: '600' }}>Retry</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
                  >
            {/* Featured Stores */}
            <AppText style={styles.sectionTitle}>Featured Stores</AppText>
            <ScrollView
              style={{ marginTop: 20 }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 15 }}
            >
              {(homeData?.stores ?? []).map((store) => (
                <TouchableOpacity
                  key={store.id}
                  activeOpacity={0.85}
                  style={{ backgroundColor: '#fde4c1', borderRadius: 8, width: 216 }}
                  onPress={() => setActiveCategory(activeCategory)}
                >
                  <Image
                    source={store.image_url ? { uri: store.image_url } : FALLBACK_STORE}
                    style={{ width: 216, height: 150, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <AppText style={{ marginTop: 8, marginBottom: 10, fontSize: 14, fontWeight: '600', marginHorizontal: 10 }}>
                    {store.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Popular Items */}
            <AppText style={[styles.sectionTitle, { marginTop: 20 }]}>Popular Items</AppText>
            <ScrollView
              style={{ marginTop: 20 }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 15 }}
            >
              {(homeData?.popular_items ?? []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={{ backgroundColor: '#c9f2d9', borderRadius: 8, width: 146 }}
                  onPress={() => handleProductPress(item)}
                >
                  <Image
                    source={item.image_url ? { uri: item.image_url } : FALLBACK_ITEM}
                    style={{ width: 146, height: 150, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <AppText style={{ marginTop: 8, fontSize: 14, fontWeight: '600', marginHorizontal: 10 }}>
                    {item.name}
                  </AppText>
                  <AppText style={{ marginTop: 4, fontSize: 14, color: 'gray', fontWeight: '600', marginHorizontal: 10, marginBottom: 10 }}>
                    {formatPrice(item.price)}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Recommended */}
            <AppText style={[styles.sectionTitle, { marginTop: 20 }]}>Recommended for you</AppText>
            <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {(homeData?.recommended ?? []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={{ borderRadius: 8, width: cardWidth }}
                  onPress={() => handleProductPress(item)}
                >
                  <Image
                    source={item.image_url ? { uri: item.image_url } : FALLBACK_ITEM}
                    style={{ width: cardWidth, height: 150, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <AppText style={{ marginTop: 8, fontSize: 14, fontWeight: '600', marginHorizontal: 10 }}>
                    {item.name}
                  </AppText>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText style={{ marginTop: 4, fontSize: 14, color: 'gray', fontWeight: '600', marginHorizontal: 10, marginBottom: 10 }}>
                      {formatPrice(item.price)}
                    </AppText>
                    <AppText
                      style={{ marginTop: 4, fontSize: 13, color: 'gray', marginHorizontal: 10, marginBottom: 10, flex: 1, textAlign: 'right' }}
                      numberOfLines={1}
                    >
                      {item.store}
                    </AppText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </BlurTargetView>

      {/* New Request button */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={onNavigateToNewRequest}
          accessibilityLabel="New Request"
        >
          <Ionicons name="add" size={22} color="#0F1A12" />
          <Animated.View
            style={{
              width: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, FAB_LABEL_WIDTH] }),
              opacity: fabAnim,
              overflow: 'hidden',
            }}
          >
            <AppText numberOfLines={1} style={styles.fabText}>New Request</AppText>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Glass bottom tab bar */}
      <View style={styles.tabBarWrap} pointerEvents="box-none">
        <BlurView
          blurTarget={blurTargetRef}
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={60}
          tint="light"
          style={styles.tabBar}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab.name)}
                activeOpacity={0.8}
              >
                <View>
                  <Image
                    source={tab.icon}
                    style={[styles.tabIcon, isActive && { tintColor: '#1a9a52' }]}
                    resizeMode="contain"
                  />
                  {tab.name === 'message' && unreadMessage && <View style={styles.unreadDot} />}
                </View>
                <AppText
                  style={[styles.tabLabel, { color: isActive ? '#1a9a52' : 'rgba(0,0,0,0.65)' }]}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { flex: 1, paddingHorizontal: 15 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
    paddingTop: 16,
    paddingBottom: 4,
  },
  greeting: { fontSize: 18, fontWeight: 'bold' },

  cartBtn: { position: 'relative' },
  cartIcon: { width: 28, height: 28 },
  cartBadge: {
    position: 'absolute', top: -5, right: -8,
    backgroundColor: '#4bd381', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9F9', borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 10, paddingHorizontal: 12, height: 48, gap: 8, marginTop: 16,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, color: '#A0A0A0' },

  categoriesScroll: { marginTop: 20, flexGrow: 0, height: 40, marginBottom: 10 },
  categoriesContent: { gap: 10, paddingRight: 15, alignItems: 'center' },
  categoryBtn: {
    paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryBtnActive: { backgroundColor: '#4bd381', borderColor: '#4bd381' },
  categoryText: { fontSize: 13, color: '#A0A0A0', textAlign: 'center', lineHeight: 18 },
  categoryTextActive: { color: '#fff', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20 },

  retryBtn: {
    marginTop: 14, backgroundColor: '#4bd381',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8,
  },

  // Search overlay
  searchOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FAFAF9', zIndex: 100,
    paddingTop: 50, paddingHorizontal: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
    minHeight: Dimensions.get('window').height,
  },
  searchOverlayBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  searchOverlayInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9F9', borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 10, paddingHorizontal: 12, height: 48, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F1A12' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: { fontSize: 15, color: '#4bd381', fontWeight: '600' },

  searchSectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#555',
    marginTop: 20, marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  searchRowImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#F0F0F0' },
  searchRowName: { fontSize: 14, fontWeight: '600', color: '#0F1A12' },
  searchRowSub: { fontSize: 12, color: '#A0A0A0', marginTop: 2 },
  searchRowPrice: { fontSize: 14, fontWeight: '700', color: '#4bd381' },
  searchEmptyText: { textAlign: 'center', color: '#A0A0A0', marginTop: 40, fontSize: 14 },
  searchHintText: { textAlign: 'center', color: '#C0C0C0', marginTop: 40, fontSize: 13 },

  fabWrap: { position: 'absolute', right: 0, bottom: 80, zIndex: 30 },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4bd381',
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { width: 92, marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#0F1A12' },

  tabBarWrap: {
  position: 'absolute',
  left: 40,
  right: 40,
  bottom: 10,
  borderRadius: 24,
  shadowColor: '#0F1A12',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
},
tabBar: {
  flexDirection: 'row',
  borderRadius: 24,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.55)',
  backgroundColor: 'rgba(255,255,255,0.25)',
  padding: 4,
},
tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 5, borderRadius: 20 },
tabActive: { backgroundColor: 'rgba(255,255,255,0.6)' },
tabIcon: { width: 20, height: 20 },
tabLabel: { fontSize: 10 },
unreadDot: {
  position: 'absolute', top: -2, right: -2,
  width: 8, height: 8, borderRadius: 4, backgroundColor: 'red',
},
});