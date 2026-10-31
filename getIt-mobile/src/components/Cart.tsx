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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types';
import { formatPrice } from '../utils/currency';
import api from '../api/client';

const { width } = Dimensions.get('window');

interface CartProps {
  cartItems: CartItem[];
  loading?: boolean;
  onBack: () => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderPlaced?: (address: string, paymentMethod: string) => void;
}

export default function Cart({
  cartItems,
  loading,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
}: CartProps) {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash'>('credit_card');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || placingOrder) return;

    // All items in the cart must belong to one store, since an order is
    // placed against a single store_id. If the cart somehow has items
    // from multiple stores, we can't safely place a single order.
    const storeIds = new Set(cartItems.map(item => item.storeId));
    if (storeIds.size > 1) {
      setOrderError('Your cart has items from multiple stores. Please order from one store at a time.');
      return;
    }

    setPlacingOrder(true);
    setOrderError('');
    try {
      const token = await AsyncStorage.getItem('token');
      await api.post(
        '/orders',
        {
          store_id: cartItems[0].storeId,
          items: cartItems.map(item => ({
            product_id: item.product.id,
            name: item.product.title,
            qty: item.quantity,
            unit: item.selectedSize ?? 'Standard',
            price: item.product.price,
            image_url: item.product.image,
          })),
          delivery_address: deliveryAddress,
          delivery_notes: deliveryNotes,
          payment_method: paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onOrderPlaced?.(deliveryAddress, paymentMethod);
      setOrderPlaced(true);
      setTimeout(() => {
        onClearCart();
        onBack();
      }, 2000);
    } catch (err) {
      console.error('Failed to place order', err);
      setOrderError('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#D0F2E1" />
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color="#3EC481" />
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successMsg}>
            Your order has been placed successfully. A runner will be assigned shortly.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1C1917" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3EC481" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1C1917" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={64} color="#C8E6C9" />
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyMsg}>Add products to your cart to get started.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={onBack}>
            <Text style={styles.shopBtnText}>Explore Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main cart ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Items Section */}
        <Text style={styles.sectionLabel}>Items</Text>

        {cartItems.map(item => (
          <View key={item.cartItemId} style={styles.itemRow}>
            <Image
              source={{ uri: item.product.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>{item.product.title}</Text>
              <Text style={styles.itemSub}>
                {item.quantity} x {item.selectedSize ?? 'Standard'}
              </Text>
            </View>
            {/* Qty controls */}
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyCircle}
                onPress={() =>
                  item.quantity <= 1
                    ? onRemoveItem(item.cartItemId)
                    : onUpdateQuantity(item.cartItemId, item.quantity - 1)
                }
              >
                <Ionicons name="remove" size={16} color="#3EC481" />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyCircle}
                onPress={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#3EC481" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Delivery Section */}
        <Text style={styles.sectionLabel}>Delivery</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter delivery address"
          placeholderTextColor="#A0C4A8"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
        />
        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Add delivery notes [optional]"
          placeholderTextColor="#A0C4A8"
          value={deliveryNotes}
          onChangeText={setDeliveryNotes}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Payment Section */}
        <Text style={styles.sectionLabel}>Payment</Text>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'credit_card' && styles.paymentSelected]}
          onPress={() => setPaymentMethod('credit_card')}
          activeOpacity={0.85}
        >
          <Text style={styles.paymentLabel}>Credit Card</Text>
          <View style={[styles.radio, paymentMethod === 'credit_card' && styles.radioSelected]}>
            {paymentMethod === 'credit_card' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentSelected, { marginTop: 10 }]}
          onPress={() => setPaymentMethod('cash')}
          activeOpacity={0.85}
        >
          <Text style={styles.paymentLabel}>Cash on Delivery</Text>
          <View style={[styles.radio, paymentMethod === 'cash' && styles.radioSelected]}>
            {paymentMethod === 'cash' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Total Row */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        {orderError !== '' && (
          <Text style={styles.errorText}>{orderError}</Text>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },

  // Header
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

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 14,
    marginTop: 8,
  },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
  },
  itemMeta: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1C1917', marginBottom: 4 },
  itemSub: { fontSize: 12, color: '#78716C' },

  // Qty controls
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: { fontSize: 15, fontWeight: '700', color: '#1C1917', minWidth: 20, textAlign: 'center' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },

  // Delivery inputs
  input: {
    backgroundColor: '#F0FAF2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1C1917',
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  paymentSelected: {
    backgroundColor: '#F0FAF2',
    borderColor: '#3EC481',
  },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: '#1C1917' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#3EC481' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3EC481',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FAF2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#1C1917' },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEF',
  },
  placeOrderBtn: {
    backgroundColor: '#3EC481',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1917', marginTop: 16, marginBottom: 8 },
  emptyMsg: { fontSize: 13, color: '#78716C', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  shopBtn: { backgroundColor: '#3EC481', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  shopBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Success
  successScreen: { flex: 1, backgroundColor: '#D0F2E1', alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', paddingHorizontal: 32 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1E5A35', marginTop: 20, marginBottom: 12 },
  successMsg: { fontSize: 14, color: '#2E7D32', textAlign: 'center', lineHeight: 22 },
});