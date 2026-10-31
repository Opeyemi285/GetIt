export interface Product {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  description: string;
  sizes?: string[];
  colors?: string[];
  storeId?: string;
}

export interface CartItem {
  cartItemId: string;   
  storeId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'email'
  | 'confirmEmail'
  | 'password'
  | 'home'
  | 'details'
  | 'cart'
  | 'orders'
  | 'message'
  | 'profile'
  | 'search'
  | 'storeDetail';

  