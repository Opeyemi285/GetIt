import React, { useState, useRef, useEffect } from 'react';
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
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../utils/currency';
import { Product } from '../types';

const { width } = Dimensions.get('window');

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchStore {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  distance?: string;
  rating?: number;
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

type FilterTab = 'All' | 'Stores' | 'Items';

// ─── Static data ───────────────────────────────────────────────────────────────

const RECENT_SEARCHES = ['Corned Beef', 'Millet', 'Nivea'];
const POPULAR_SEARCHES = ['Wolfs Baine', 'Vervain', 'Ofada Rice'];
const CATEGORY_FILTERS = ['Restaurants', 'Pharmacy', 'Grocery', 'Toiletries'];

const FALLBACK_STORE = require('../../assets/stores/grocery-store.png');
const FALLBACK_ITEM = require('../../assets/popular-items/skincare-product.png');

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SearchPageProps {
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectStore: (store: SearchStore) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SearchPage({ onBack, onSelectProduct, onSelectStore }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<SearchStore[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setStores([]);
      setProducts([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await api.get('/home/search/products', {
          params: { q: query.trim() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setStores(res.data?.stores ?? []);
        setProducts(res.data?.products ?? []);
      } catch (err) {
        console.error('Search failed', err);
        setStores([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const handleRecentSearch = (term: string) => {
    setQuery(term);
  };

  const clearRecent = () => setRecentSearches([]);

  const displayedStores = activeCategory
    ? stores.filter(s => s.category === activeCategory)
    : stores;

  const displayedProducts = searched ? products : [];

  const showStores = filterTab === 'All' || filterTab === 'Stores';
  const showItems = filterTab === 'All' || filterTab === 'Items';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search-outline" size={18} color="#A0A0A0" />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search for store or items"
          placeholderTextColor="#A0A0A0"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#A0A0A0" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── No query: show recent + popular ── */}
        {query.trim().length < 2 && (
          <>
            {/* Recent Searches */}
            <View style={styles.searchMeta}>
              <Text style={styles.metaTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecent}>
                <Text style={styles.clearBtn}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagGrid}>
              {recentSearches.map(term => (
                <TouchableOpacity key={term} style={styles.tagRow} onPress={() => handleRecentSearch(term)}>
                  <Ionicons name="time-outline" size={16} color="#A0A0A0" />
                  <Text style={styles.tagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Popular Searches */}
            <Text style={[styles.metaTitle, { marginTop: 20, marginHorizontal: 16 }]}>Popular Searches</Text>
            <View style={styles.tagGrid}>
              {POPULAR_SEARCHES.map(term => (
                <TouchableOpacity key={term} style={styles.tagRow} onPress={() => handleRecentSearch(term)}>
                  <Ionicons name="trending-up-outline" size={16} color="#A0A0A0" />
                  <Text style={styles.tagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Filter tabs + category chips ── */}
        <View style={styles.filterRow}>
          {(['All', 'Stores', 'Items'] as FilterTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilterTab(tab)}
              style={styles.filterTabWrap}
            >
              <Text style={[styles.filterTabText, filterTab === tab && styles.filterTabActive]}>
                {tab}
              </Text>
              {filterTab === tab && <View style={styles.filterTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity style={styles.sortChip}>
            <Text style={styles.sortChipText}>Sort</Text>
            <Ionicons name="options-outline" size={14} color="#1C1917" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, styles.chipActive]}>
            <Text style={[styles.chipText, styles.chipTextActive]}>Filters</Text>
            <View style={styles.chipBadge}><Text style={styles.chipBadgeText}>3</Text></View>
          </TouchableOpacity>
          {CATEGORY_FILTERS.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Loading ── */}
        {loading && <ActivityIndicator color="#3EC481" size="small" style={{ marginTop: 20 }} />}

        {/* ── Stores section ── */}
        {showStores && !loading && searched && (
          <>
            <Text style={styles.sectionTitle}>Stores</Text>
            {displayedStores.length === 0 ? (
              <Text style={styles.emptyText}>No stores found</Text>
            ) : (
              displayedStores.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeRow}
                  onPress={() => onSelectStore(store)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeRowName}>{store.name}</Text>
                    <Text style={styles.storeRowSub}>
                      {store.category}{store.distance ? ` · ${store.distance}` : ''}
                    </Text>
                    {store.rating !== undefined && (
                      <View style={styles.storeRatingRow}>
                        <Ionicons name="star-outline" size={13} color="#F59E0B" />
                        <Text style={styles.storeRatingText}>{store.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <Image
                    source={store.image_url ? { uri: store.image_url } : FALLBACK_STORE}
                    style={styles.storeRowImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ── Products section ── */}
        {showItems && !loading && searched && (
          <>
            <Text style={styles.sectionTitle}>Products</Text>
            {displayedProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products found</Text>
            ) : (
              displayedProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productRow}
                  onPress={() =>
                    onSelectProduct({
                      id: product.id,
                      storeId: product.store_id,
                      title: product.name,
                      price: product.price,
                      image: product.image_url || '',
                      category: product.category,
                      rating: 4.5,
                      reviewsCount: 80,
                      description: `${product.name} from ${product.store}`,
                      sizes: ['Standard'],
                      colors: [],
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Image
                    source={product.image_url ? { uri: product.image_url } : FALLBACK_ITEM}
                    style={styles.productRowImage}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.productRowName}>{product.name}</Text>
                    <Text style={styles.productRowSub}>{product.store} · {product.category}</Text>
                  </View>
                  <Text style={styles.productRowPrice}>{formatPrice(product.price)}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
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

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1917' },

  // Recent / Popular
  searchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  metaTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  clearBtn: { fontSize: 13, color: '#3EC481', fontWeight: '600' },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 10,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagText: { fontSize: 13, color: '#555' },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
    gap: 20,
  },
  filterTabWrap: { alignItems: 'center' },
  filterTabText: { fontSize: 14, color: '#A0A0A0', fontWeight: '500', paddingBottom: 4 },
  filterTabActive: { color: '#1C1917', fontWeight: '700' },
  filterTabUnderline: {
    height: 2,
    backgroundColor: '#1C1917',
    width: '100%',
    borderRadius: 1,
  },

  // Category chips
  chipsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  sortChipText: { fontSize: 13, color: '#1C1917' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    gap: 4,
  },
  chipActive: { backgroundColor: '#3EC481', borderColor: '#3EC481' },
  chipText: { fontSize: 13, color: '#1C1917' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  chipBadge: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: { fontSize: 11, fontWeight: '700', color: '#3EC481' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#A0A0A0',
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Store row
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
    backgroundColor: '#FFF',
  },
  storeRowName: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 3 },
  storeRowSub: { fontSize: 12, color: '#78716C', marginBottom: 4 },
  storeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  storeRatingText: { fontSize: 12, color: '#78716C' },
  storeRowImage: {
    width: 80,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    marginLeft: 12,
  },

  // Product row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  productRowImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#F5F5F4' },
  productRowName: { fontSize: 14, fontWeight: '600', color: '#1C1917', marginBottom: 3 },
  productRowSub: { fontSize: 12, color: '#78716C' },
  productRowPrice: { fontSize: 14, fontWeight: '700', color: '#3EC481' },
});