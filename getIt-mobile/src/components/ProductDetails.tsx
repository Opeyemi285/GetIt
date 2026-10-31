import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';

const { width } = Dimensions.get('window');

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
}

export default function ProductDetails({
  product,
  onBack,
  onAddToCart
}: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [isAdded, setIsAdded] = useState(false);

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQty = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCartPress = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Detail Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        <View style={styles.detailsCard}>
          {/* Category & Rating */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category}</Text>
            </View>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.reviewsText}>({product.reviewsCount} reviews)</Text>
            </View>
          </View>

          {/* Title & Price */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.sizesContainer}>
                {product.sizes.map(size => {
                  const isSelected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizePill,
                        isSelected && styles.activeSizePill
                      ]}
                    >
                      <Text style={[
                        styles.sizeText,
                        isSelected && styles.activeSizeText
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={styles.sectionTitle}>Select Color</Text>
              <View style={styles.colorsContainer}>
                {product.colors.map(color => {
                  const isSelected = selectedColor === color;
                  
                  // Map color names to actual hex colors for display
                  let colorHex = '#000';
                  if (color === 'Red') colorHex = '#D22B2B';
                  else if (color === 'White') colorHex = '#FFF';
                  else if (color === 'Blue') colorHex = '#2B6CB0';
                  else if (color === 'Black') colorHex = '#1C1917';
                  else if (color === 'Silver') colorHex = '#CBD5E0';
                  else if (color === 'Dark Brown') colorHex = '#5C4033';
                  else if (color === 'Sandy Gold') colorHex = '#D4AF37';
                  else if (color === 'Rose Gold') colorHex = '#B76E79';
                  else if (color === 'Space Gray') colorHex = '#555555';
                  else if (color === 'Cream White') colorHex = '#FFFDD0';
                  else if (color === 'Terracotta') colorHex = '#C27D38';
                  else if (color === 'Sage Green') colorHex = '#87A96B';
                  else if (color === 'Sea Blue') colorHex = '#006994';
                  else if (color === 'Forest Green') colorHex = '#228B22';
                  else if (color === 'Slate Grey') colorHex = '#708090';

                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorCircleWrapper,
                        isSelected && styles.activeColorCircleWrapper
                      ]}
                    >
                      <View style={[
                        styles.colorCircle,
                        { backgroundColor: colorHex },
                        color === 'White' && styles.whiteBorder
                      ]} />
                      <Text style={styles.colorLabel}>{color}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecreaseQty}>
                <Ionicons name="remove" size={18} color="#1C1917" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncreaseQty}>
                <Ionicons name="add" size={18} color="#1C1917" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Add To Cart Panel */}
      <View style={styles.footerPanel}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalAmount}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>
        
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.addToCartBtn,
            isAdded && styles.addedBtn
          ]}
          onPress={handleAddToCartPress}
        >
          <Ionicons
            name={isAdded ? "checkmark-circle" : "cart"}
            size={20}
            color="#FFF"
            style={styles.cartIcon}
          />
          <Text style={styles.addToCartBtnText}>
            {isAdded ? "Added to Cart!" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F4',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1917',
    maxWidth: width - 120,
  },
  placeholderBtn: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsCard: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    backgroundColor: '#FFF',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#D0F2E1',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E5A35',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1917',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    color: '#78716C',
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1917',
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E5A35',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7E5E4',
    marginVertical: 16,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#57534E',
    lineHeight: 18,
  },
  selectorSection: {
    marginBottom: 20,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizePill: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSizePill: {
    backgroundColor: '#3EC481',
    borderColor: '#3EC481',
  },
  sizeText: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: 'bold',
  },
  activeSizeText: {
    color: '#FFF',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeColorCircleWrapper: {
    opacity: 1,
    borderWidth: 1.5,
    borderColor: '#3EC481',
    borderRadius: 8,
    padding: 4,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: '#D7D5D4',
  },
  activeColorCircleWrapperStyle: {
    // Add custom style when active
  },
  colorLabel: {
    fontSize: 10,
    color: '#78716C',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    height: 40,
    backgroundColor: '#F5F5F4',
  },
  qtyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1917',
    paddingHorizontal: 8,
  },
  footerPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EFEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  totalContainer: {
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: 11,
    color: '#78716C',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E5A35',
  },
  addToCartBtn: {
    backgroundColor: '#3EC481',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 10,
    width: width * 0.55,
  },
  addedBtn: {
    backgroundColor: '#1E5A35',
  },
  cartIcon: {
    marginRight: 6,
  },
  addToCartBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
