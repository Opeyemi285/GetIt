import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types and Screens
import { ScreenName, Product, CartItem } from './src/types';
import Splash from './src/components/Splash';
import Onboarding from './src/components/Onboarding';
import Login from './src/components/authentications/Login';
import Register from './src/components/authentications/Register';
import Email from './src/components/authentications/Email';
import ConfirmEmail from './src/components/authentications/ConfirmEmail';
import Password from './src/components/authentications/Password';
import Home from './src/components/Home';
import ProductDetails from './src/components/ProductDetails';
import Cart from './src/components/Cart';
import Profile from './src/components/Profile';
import Orders from './src/components/Orders';
import Message, { ChatMessage } from './src/components/Message';
import SearchPage from './src/components/Search';
import StoreDetail, {
  StoreInfo,
  StoreProduct,
} from './src/components/StoreDetail';
import api from './src/api/client';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingFirstName, setPendingFirstName] = useState('');
  const [pendingLastName, setPendingLastName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const hasUnreadMessages = chats.some(c => c.unread > 0);

  // ─── Cart (now backed by the API, not local state) ──────────────────────────

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Maps the API's cart shape -> the CartItem shape the rest of the app expects
  const mapCartResponse = (data: any[]): CartItem[] => {
    return (data || []).map(row => ({
      cartItemId: row.cart_item_id,
      product: {
        id: row.product.id,
        title: row.product.title,
        price: Number(row.product.price),
        image: row.product.image || '',
        category: row.product.category || '',
        rating: 4.8,
        reviewsCount: 120,
        description: '',
        sizes: ['Standard'],
        colors: [],
      },
      storeId: row.product.store_id,
      quantity: row.quantity,
      selectedSize: row.selected_size ?? undefined,
      selectedColor: row.selected_color ?? undefined,
    }));
  };

  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await api.get('/cart', { headers });
      setCartItems(mapCartResponse(res.data));
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // ─── Navigation helpers ──────────────────────────────────────────────────────

  const navigateTo = (screen: ScreenName) => {
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
    if (screen === 'cart') {
      refreshCart();
    }
  };

  const goBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory(h => h.slice(0, -1));
      setCurrentScreen(prev);
    }
  };

  // ─── Cart operations (now async, hit the API) ───────────────────────────────

  const handleAddToCart = async (
    product: Product,
    quantity: number = 1,
    size?: string,
    color?: string,
    storeId?: string
  ) => {
    if (!storeId) {
      console.error('handleAddToCart called without a storeId — cannot add to cart');
      return;
    }
    try {
      const headers = await getAuthHeader();
      await api.post(
        '/cart',
        {
          product_id: product.id,
          store_id: storeId,
          quantity,
          selected_size: size,
          selected_color: color,
        },
        { headers }
      );
      await refreshCart();
    } catch (err) {
      console.error('Failed to add to cart', err);
    }
  };

  const handleUpdateCartQty = async (cartItemId: string, newQty: number) => {
    try {
      const headers = await getAuthHeader();
      await api.patch(`/cart/${cartItemId}`, { quantity: newQty }, { headers });
      await refreshCart();
    } catch (err) {
      console.error('Failed to update cart quantity', err);
    }
  };

  const handleRemoveCartItem = async (cartItemId: string) => {
    try {
      const headers = await getAuthHeader();
      await api.delete(`/cart/${cartItemId}`, { headers });
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove cart item', err);
    }
  };

  const handleClearCart = async () => {
    try {
      const headers = await getAuthHeader();
      await api.delete('/cart', { headers });
      setCartItems([]);
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  const handleLogout = () => {
    setCartItems([]);
    setSelectedProduct(null);
    navigateTo('splash');
  };

  const getCartCount = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Load cart once on mount so the badge count is accurate from the start
  useEffect(() => {
    const checkAndLoadCart = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) refreshCart();
    };
    checkAndLoadCart();
  }, [refreshCart]);

  // ─── Store navigation ────────────────────────────────────────────────────────

  const handleSelectStore = (storeInfo: any) => {
    // Map search store → StoreInfo shape
    setSelectedStore({
      id: storeInfo.id,
      name: storeInfo.name,
      category: storeInfo.category,
      banner_url:
        storeInfo.image_url ||
        'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=800&q=80',
      image_url: storeInfo.image_url || '',
    });
    navigateTo('storeDetail');
  };

  // ─── Screen renderer ─────────────────────────────────────────────────────────

  const renderScreen = () => {
    switch (currentScreen) {
      // ── Auth flow ──
      case 'splash':
        return <Splash onGetStarted={() => navigateTo('onboarding')} />;

      case 'onboarding':
        return (
          <Onboarding
            onRegister={() => navigateTo('register')}
            onLogin={() => navigateTo('login')}
          />
        );

      case 'login':
        return (
          <Login
            onFinish={() => navigateTo('home')}
            onBack={goBack}
            onRegister={() => navigateTo('register')}
          />
        );

      case 'register':
        return (
          <Register
            onFinish={(firstName, lastName) => {
              setPendingFirstName(firstName);
              setPendingLastName(lastName);
              navigateTo('email');
            }}
            onBack={goBack}
            onLogin={() => navigateTo('login')}
          />
        );

      case 'email':
        return (
          <Email
            firstName={pendingFirstName}
            lastName={pendingLastName}
            onBack={goBack}
            onContinue={email => {
              setPendingEmail(email);
              navigateTo('confirmEmail');
            }}
          />
        );

      case 'confirmEmail':
        return (
          <ConfirmEmail
            email={pendingEmail}
            onBack={goBack}
            onConfirmed={() => navigateTo('password')}
            onResend={() => {}}
          />
        );

      case 'password':
        return (
          <Password
            firstName={pendingFirstName}
            lastName={pendingLastName}
            email={pendingEmail}
            onBack={goBack}
            onFinish={() => navigateTo('home')}
          />
        );

      // ── Main app ──
      case 'home':
        return (
          <Home
            onSelectProduct={product => {
              setSelectedProduct(product);
              navigateTo('details');
            }}
            cartCount={getCartCount()}
            onNavigateToCart={() => navigateTo('cart')}
            onNavigateToOrders={() => navigateTo('orders')}
            onNavigateToMessage={() => navigateTo('message')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToSearch={() => navigateTo('search')}
            unreadMessage={hasUnreadMessages}
          />
        );

      case 'search':
        return (
          <SearchPage
            onBack={goBack}
            onSelectProduct={product => {
              setSelectedProduct(product);
              navigateTo('details');
            }}
            onSelectStore={handleSelectStore}
          />
        );

      case 'storeDetail':
        if (!selectedStore) {
          navigateTo('home');
          return null;
        }
        return (
          <StoreDetail
            store={selectedStore}
            onBack={goBack}
            onAddToCart={product =>
              handleAddToCart(product, 1, undefined, undefined, selectedStore.id)
            }
            onSelectProduct={product => {
              setSelectedProduct(product);
              navigateTo('details');
            }}
          />
        );

      case 'details':
        if (!selectedProduct) {
          navigateTo('home');
          return null;
        }
        return (
          <ProductDetails
            product={selectedProduct}
            onBack={goBack}
            onAddToCart={(product, quantity, size, color) =>
              handleAddToCart(product, quantity, size, color, product.storeId ?? selectedStore?.id)
            }
          />
        );

      case 'cart':
        return (
          <Cart
            cartItems={cartItems}
            loading={cartLoading}
            onBack={goBack}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOrderPlaced={() => {
              setCartItems([]);
            }}
          />
        );

      case 'orders':
        return (
          <Orders
            onBack={() => navigateTo('home')}
            onNavigateToHome={() => navigateTo('home')}
            onNavigateToMessage={() => navigateTo('message')}
            onNavigateToProfile={() => navigateTo('profile')}
            unreadMessage={hasUnreadMessages}
          />
        );

      case 'message':
        return (
          <Message
            onBack={() => navigateTo('home')}
            onNavigateToHome={() => navigateTo('home')}
            onNavigateToOrders={() => navigateTo('orders')}
            onNavigateToProfile={() => navigateTo('profile')}
            chats={chats}
            setChats={setChats}
          />
        );

      case 'profile':
        return <Profile onBack={goBack} onLogout={handleLogout} />;

      default:
        return <Splash onGetStarted={() => navigateTo('home')} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
});