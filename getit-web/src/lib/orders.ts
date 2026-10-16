import { api, ApiError } from "./api";
import type { CartItem } from "./cart";

export type PaymentMethod = "card" | "cash";

function groupByStore(items: CartItem[]) {
  const map = new Map<string, CartItem[]>();
  for (const i of items) {
    const storeId = i.product.storeId;
    if (!storeId) {
      throw new Error("An item in your cart is missing its store. Remove it and add it again.");
    }
    const list = map.get(storeId);
    if (list) list.push(i);
    else map.set(storeId, [i]);
  }
  return Array.from(map, ([storeId, list]) => ({ storeId, items: list }));
}

// one POST /orders per store, in order. Stops at the first failure.
export async function placeOrders(input: {
  items: CartItem[];
  address: string;
  notes: string;
  payment: PaymentMethod;
}) {
  const placedItemIds: string[] = [];
  let orderCount = 0;

  for (const g of groupByStore(input.items)) {
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          store_id: g.storeId,
          items: g.items.map((i) => ({
            product_id: i.product.id,
            name: i.product.title,
            qty: i.quantity,
            unit: i.size ?? null,
            price: i.product.price,
            image_url: i.product.image ?? null,
          })),
          delivery_address: input.address,
          delivery_notes: input.notes || null,
          payment_method: input.payment,
        }),
      });
      orderCount++;
      placedItemIds.push(...g.items.map((i) => i.cartItemId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) throw e; // page sends them to sign in
      const msg = (e as Error).message || "Could not place the order.";
      return {
        placedItemIds,
        orderCount,
        error:
          orderCount > 0
            ? `Some items could not be ordered (${msg}). The rest of your cart is still here.`
            : msg,
      };
    }
  }

  return { placedItemIds, orderCount, error: null as string | null };
}