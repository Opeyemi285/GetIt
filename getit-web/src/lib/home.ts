/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api";

export type Store = {
  id: string;
  name: string;
  image?: string;
  category?: string;
  distance?: string;
  rating?: number;
};

export type Product = {
  id: string;
  storeId?: string;
  name: string;
  price: number;
  currency?: string;
  image?: string;
  category?: string;
  storeName?: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  price: number;
  currency?: string;
  image?: string;
  category?: string;
  unit?: string;
  tag?: string | null;
};

const toStore = (s: any): Store => ({
  id: s.id,
  name: s.name,
  image: s.image_url ?? undefined,
  category: s.category,
  distance: s.distance ?? undefined,
  rating: s.rating != null ? Number(s.rating) : undefined,
});

const toProduct = (p: any): Product => ({
  id: p.id,
  storeId: p.store_id,
  name: p.name,
  price: Number(p.price),
  currency: p.currency,
  image: p.image_url ?? undefined,
  category: p.category,
  storeName: p.store,
});

export async function fetchHome(category: string) {
  const d = await api<any>(`/home/${encodeURIComponent(category)}`);
  return {
    stores: (d.stores ?? []).map(toStore) as Store[],
    popular: (d.popular_items ?? []).map(toProduct) as Product[],
    recommended: (d.recommended ?? []).map(toProduct) as Product[],
  };
}

export async function searchAll(q: string) {
  const d = await api<any>(`/home/search/products?q=${encodeURIComponent(q)}`);
  return {
    stores: (d.stores ?? []).map(toStore) as Store[],
    products: (d.products ?? []).map(toProduct) as Product[],
  };
}

export async function fetchCartCount() {
  const d = await api<any>("/cart");
  const items = Array.isArray(d) ? d : d.items ?? [];
  return items.length as number;
}

export async function fetchStore(id: string) {
  const s = await api<any>(`/store/${encodeURIComponent(id)}`);
  return toStore(s);
}

export async function fetchStoreProducts(id: string) {
  const d = await api<any[]>(`/store/${encodeURIComponent(id)}/products`);
  return d.map(
    (p): StoreProduct => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      image: p.image_url || undefined,
      category: p.category || undefined,
      unit: p.unit,
      tag: p.tag,
    })
  );
}