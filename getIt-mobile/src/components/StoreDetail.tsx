import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../utils/currency';
import { Product } from '../types';
import api from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  unit: string;        // e.g. "24ml", "454g"
  tag?: 'Limited in Stock' | 'New' | 'Discounted Sales';
  image_url: string;
  category: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  category: string;
  banner_url: string;
  image_url: string;
}

interface StoreDetailProps {
  store: StoreInfo;
  products?: StoreProduct[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tagColor(tag: StoreProduct['tag']) {
  if (tag === 'Limited in Stock') return '#3EC481';
  if (tag === 'New') return '#3EC481';
  if (tag === 'Discounted Sales') return '#3EC481';
  return '#3EC481';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoreDetail({
  store,
  onBack,
  onAddToCart,
  onSelectProduct,
}: StoreDetailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await api.get(`/store/${store.id}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStoreProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch store products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [store.id]);

  // Derive unique categories from products
  const categories = Array.from(new Set(storeProducts.map(p => p.category)));

  // Set default active category
  React.useEffect(() => {
    if (categories.length > 0 && (!activeCategory || !categories.includes(activeCategory))) {
      setActiveCategory(categories[0]);
    }
  }, [storeProducts]);

  const filtered = storeProducts.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToCart = (p: StoreProduct) => {
    onAddToCart({
      id: p.id,
      title: p.name,
      price: p.price,
      image: p.image_url,
      category: p.category,
      rating: 4.5,
      reviewsCount: 80,
      description: `${p.name} — ${p.unit}. From ${store.name}.`,
      sizes: [p.unit],
      colors: [],
    });
  };

  const handleSelectProduct = (p: StoreProduct) => {
    onSelectProduct({
      id: p.id,
      title: p.name,
      price: p.price,
      image: p.image_url,
      category: p.category,
      rating: 4.5,
      reviewsCount: 80,
      description: `${p.name} — ${p.unit}. From ${store.name}.`,
      sizes: [p.unit],
      colors: [],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{store.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Search bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#A0A0A0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for items"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={{ uri: store.banner_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          {/* Shop Live pill */}
          <TouchableOpacity style={styles.shopLiveBtn} activeOpacity={0.85}>
            <Text style={styles.shopLiveText}>Shop Live</Text>
          </TouchableOpacity>
        </View>

        {/* Categories row */}
        <View style={styles.categoriesHeader}>
          <View style={{ flex: 1 }} />
          <Text style={styles.categoriesLabel}>Categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products list */}
        {loading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3EC481" />
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {filtered.map((product, idx) => (
            <React.Fragment key={product.id}>
              <TouchableOpacity
                style={styles.productRow}
                onPress={() => handleSelectProduct(product)}
                activeOpacity={0.85}
              >
                {/* Left: tag + name + price */}
                <View style={{ flex: 1, paddingRight: 12 }}>
                  {product.tag && (
                    <Text style={[styles.productTag, { color: tagColor(product.tag) }]}>
                      {product.tag}
                    </Text>
                  )}
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    {formatPrice(product.price)} / {product.unit}
                  </Text>
                </View>

                {/* Right: image + add button */}
                <View style={styles.productImageWrap}>
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(product)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Divider between items */}
              {idx < filtered.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}

            {/* See More */}
            {filtered.length > 0 && (
              <TouchableOpacity style={styles.seeMoreBtn}>
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            )}
          </View>
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
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1917' },

  bannerWrap: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#E8F5E9',
  },
  bannerImage: { width: '100%', height: '100%' },
  shopLiveBtn: {
    position: 'absolute',
    bottom: 20,
    left: width / 2 - 80 - 16,
    backgroundColor: '#3EC481',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  shopLiveText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  categoriesLabel: { fontSize: 14, color: '#78716C', fontWeight: '500' },

  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FAF5EC',
  },
  categoryChipActive: { backgroundColor: '#3EC481', borderColor: '#3EC481' },
  categoryChipText: { fontSize: 13, color: '#78716C' },
  categoryChipTextActive: { color: '#FFF', fontWeight: '600' },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
  },
  productTag: { fontSize: 12, fontWeight: '600', marginBottom: 3 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 4 },
  productPrice: { fontSize: 13, color: '#78716C' },

  productImageWrap: { position: 'relative', width: 80, height: 80 },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5F4',
  },
  addBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3EC481',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  divider: { height: 1, backgroundColor: '#F5F5F4', marginHorizontal: 16 },

  seeMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  seeMoreText: { fontSize: 14, color: '#E8A317', fontWeight: '600' },
});