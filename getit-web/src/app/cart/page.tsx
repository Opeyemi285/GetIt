/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassNav from "@/components/GlassNav";
import { ApiError } from "@/lib/api";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/currency";
import { AUTH_ENTRY, setNext } from "@/lib/session";
import { useRequireAuth } from "@/lib/useRequireAuth";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

export default function CartPage() {
  const router = useRouter();
  const ready = useRequireAuth(); // guests are sent to /login and back here afterwards
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchCart()
      .then((c) => !cancelled && setItems(c))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setNext("/cart");
          router.replace(AUTH_ENTRY);
        } else {
          setError("Could not load your cart.");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ready, attempt, router]);

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.product.price * i.quantity, 0),
    }),
    [items]
  );

  // optimistic update, rolled back if the request fails
  async function changeQty(item: CartItem, next: number) {
    if (busyId) return;
    setNotice("");
    setBusyId(item.cartItemId);
    const prev = items;
    setItems(
      next <= 0
        ? items.filter((i) => i.cartItemId !== item.cartItemId)
        : items.map((i) => (i.cartItemId === item.cartItemId ? { ...i, quantity: next } : i))
    );
    try {
      await updateCartQuantity(item.cartItemId, next);
    } catch (e) {
      setItems(prev);
      setNotice((e as Error).message || "Could not update the cart.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: CartItem) {
    if (busyId) return;
    setNotice("");
    setBusyId(item.cartItemId);
    const prev = items;
    setItems(items.filter((i) => i.cartItemId !== item.cartItemId));
    try {
      await removeCartItem(item.cartItemId);
    } catch (e) {
      setItems(prev);
      setNotice((e as Error).message || "Could not remove the item.");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAll() {
    if (!window.confirm("Remove everything from your cart?")) return;
    setNotice("");
    const prev = items;
    setItems([]);
    try {
      await clearCart();
    } catch (e) {
      setItems(prev);
      setNotice((e as Error).message || "Could not clear the cart.");
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  if (!ready) return null;

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-6xl px-5 pb-40 pt-6 lg:px-10 lg:pt-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              aria-label="Go back"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#0f1a12] lg:text-3xl">
              Cart{!loading && count > 0 ? ` (${count})` : ""}
            </h1>
          </div>
          {items.length > 0 && (
            <button onClick={clearAll} className="text-sm font-semibold text-red-600 hover:underline">
              Clear cart
            </button>
          )}
        </header>

        {notice && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{notice}</p>}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-600">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-xl font-bold text-[#0f1a12]">Your cart is empty</p>
            <p className="mt-2 text-[#0f1a12]/60">Browse stores and add something you like.</p>
            <Link
              href="/home"
              className="mt-6 inline-block rounded-xl bg-[#4bd381] px-6 py-3 font-bold text-[#0f1a12] transition hover:brightness-105"
            >
              Start shopping
            </Link>
          </div>
        )}

        {/* Cart */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.cartItemId}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      loading="lazy"
                      className="h-24 w-24 shrink-0 rounded-xl object-cover lg:h-28 lg:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-black/5 text-2xl font-bold text-black/30 lg:h-28 lg:w-28">
                      {item.product.title.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-semibold text-[#0f1a12]">{item.product.title}</p>
                        {(item.size || item.color) && (
                          <p className="mt-0.5 text-sm text-[#0f1a12]/50">
                            {[item.size, item.color].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item)}
                        aria-label={`Remove ${item.product.title}`}
                        className="shrink-0 rounded-full p-1.5 text-[#0f1a12]/40 transition hover:bg-black/5 hover:text-red-600"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-bold text-[#0f1a12]">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-1 rounded-full bg-[#f1f1f0] p-1">
                        <button
                          onClick={() => changeQty(item, item.quantity - 1)}
                          disabled={busyId === item.cartItemId}
                          aria-label="Decrease quantity"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-[#0f1a12] shadow-sm transition hover:bg-[#e8e8e6] disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold tabular-nums text-[#0f1a12]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => changeQty(item, item.quantity + 1)}
                          disabled={busyId === item.cartItemId}
                          aria-label="Increase quantity"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4bd381] text-lg font-bold text-[#0f1a12] shadow-sm transition hover:brightness-105 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-8">
              <h2 className="text-lg font-bold text-[#0f1a12]">Order summary</h2>
              <dl className="mt-4 space-y-3 text-[#0f1a12]/70">
                <div className="flex justify-between">
                  <dt>Items ({count})</dt>
                  <dd className="font-medium text-[#0f1a12]">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery fee</dt>
                  <dd className="text-sm">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="mt-5 flex justify-between border-t border-black/10 pt-5 text-lg font-bold text-[#0f1a12]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#4bd381] text-base font-bold text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-[0.99]"
              >
                Checkout
              </Link>
              <Link
                href="/home"
                className="mt-3 block text-center text-sm font-medium text-[#0f1a12]/60 hover:text-[#0f1a12]"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <GlassNav />
    </div>
  );
}