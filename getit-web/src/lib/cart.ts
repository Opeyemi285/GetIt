/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api";

export type CartItem = {
  cartItemId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: {
    id: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    storeId?: string;
  };
};

export function addToCart(productId: string, storeId: string, quantity = 1) {
  return api("/cart", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      store_id: storeId,
      quantity,
    }),
  });
}

export async function fetchCart(): Promise<CartItem[]> {
  const rows = await api<any[]>("/cart");
  return rows
    .filter((r) => r.product?.id)
    .map((r) => ({
      cartItemId: r.cart_item_id,
      quantity: r.quantity,
      size: r.selected_size,
      color: r.selected_color,
      product: {
        id: r.product.id,
        title: r.product.title ?? "Item",
        price: Number(r.product.price ?? 0),
        image: r.product.image || undefined,
        category: r.product.category || undefined,
        storeId: r.product.store_id,
      },
    }));
}

export function updateCartQuantity(cartItemId: string, quantity: number) {
  return api(`/cart/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(cartItemId: string) {
  return api(`/cart/${cartItemId}`, { method: "DELETE" });
}

export function clearCart() {
  return api("/cart", { method: "DELETE" });
}