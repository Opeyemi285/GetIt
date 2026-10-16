/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { fetchCart, removeCartItem, updateCartQuantity, type CartItem } from "@/lib/cart";
import { placeOrders, type PaymentMethod } from "@/lib/orders";
import { AUTH_ENTRY, setNext } from "@/lib/session";
import { useRequireAuth } from "@/lib/useRequireAuth";

const PAYMENT: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Credit Card" },
  { id: "cash", label: "Cash on Delivery" },
];

const sectionCard =
  "lg:rounded-2xl lg:bg-white lg:p-6 lg:shadow-sm lg:ring-1 lg:ring-black/5";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function itemSub(item: CartItem) {
  const unit = item.size || formatPrice(item.product.price);
  return `${item.quantity} x ${unit}`;
}

export default function CartPage() {
  const router = useRouter();
  const ready = useRequireAuth(); // guests are sent to onboarding and back here afterwards
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);

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

  const total = useMemo(
    () => items.reduce((n, i) => n + i.product.price * i.quantity, 0),
    [items]
  );

  // optimistic update, rolled back if the request fails (going to 0 removes the item)
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

  async function handlePlace() {
    setNotice("");
    if (address.trim().length < 5) {
      setAddressError("Please enter your delivery address.");
      document.getElementById("address")?.focus();
      return;
    }
    setAddressError("");
    setPlacing(true);
    try {
      const { placedItemIds, orderCount, error } = await placeOrders({
        items,
        address: address.trim(),
        notes: notes.trim(),
        payment,
      });

      // remove whatever was ordered from the cart (backend and screen)
      if (placedItemIds.length > 0) {
        await Promise.allSettled(placedItemIds.map((cid) => removeCartItem(cid)));
        setItems((prev) => prev.filter((i) => !placedItemIds.includes(i.cartItemId)));
      }

      if (error) {
        setNotice(error);
      } else {
        setPlacedCount(orderCount);
        setPlaced(true);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setNext("/cart");
        router.replace(AUTH_ENTRY);
        return;
      }
      setNotice((e as Error).message || "Could not place your order. Try again.");
    } finally {
      setPlacing(false);
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  if (!ready) return null;

  if (placed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fafaf9] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4bd381]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-[#0f1a12]">Order placed</h1>
          <p className="mt-2 text-[#0f1a12]/60">
            {placedCount > 1
              ? `Your items were split into ${placedCount} orders, one per store.`
              : "Thanks! Your order has been received."}
          </p>
          <Link
            href="/home"
            className="mt-8 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#4bd381] font-bold text-[#0f1a12] shadow-md transition hover:brightness-105"
          >
            Back to home
          </Link>
          <Link
            href="/orders"
            className="mt-3 block text-sm font-medium text-[#0f1a12]/60 hover:text-[#0f1a12]"
          >
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 lg:px-10 lg:pt-10">
        {/* Header */}
        <header className="grid grid-cols-[44px_1fr_44px] items-center">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-center text-lg font-bold text-[#0f1a12] lg:text-2xl">Cart</h1>
          <span />
        </header>

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-600">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}

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

        {!loading && !error && items.length > 0 && (
          <div className="mt-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
            <div className="space-y-8">
              {/* Items */}
              <section className={sectionCard}>
                <h2 className="text-lg font-bold text-[#0f1a12]">Items</h2>
                <ul className="mt-4 space-y-5">
                  {items.map((item) => (
                    <li key={item.cartItemId} className="flex items-center gap-4">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          loading="lazy"
                          className="h-16 w-20 shrink-0 rounded-lg object-cover sm:h-20 sm:w-24"
                        />
                      ) : (
                        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-bold text-black/30 sm:h-20 sm:w-24">
                          {item.product.title.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-bold text-[#0f1a12]">{item.product.title}</p>
                        <p className="mt-0.5 text-[#0f1a12]/50">{itemSub(item)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => changeQty(item, item.quantity - 1)}
                          disabled={busyId === item.cartItemId}
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f2d9] text-xl font-bold text-[#0f1a12] transition hover:bg-[#b5ebc8] disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-lg font-bold tabular-nums text-[#0f1a12]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => changeQty(item, item.quantity + 1)}
                          disabled={busyId === item.cartItemId}
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f2d9] text-xl font-bold text-[#0f1a12] transition hover:bg-[#b5ebc8] disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Delivery */}
              <section className={sectionCard}>
                <h2 className="text-lg font-bold text-[#0f1a12]">Delivery</h2>
                <div className="mt-4 space-y-3">
                  <input
                    id="address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (addressError) setAddressError("");
                    }}
                    placeholder="Enter delivery address"
                    autoComplete="street-address"
                    className={`h-[52px] w-full rounded-xl bg-[#eefaf2] px-4 text-base text-[#0f1a12] outline-none ring-2 transition placeholder:text-[#0f1a12]/40 focus:ring-[#4bd381] ${
                      addressError ? "ring-red-400" : "ring-transparent"
                    }`}
                  />
                  {addressError && <p className="text-sm text-red-500">{addressError}</p>}
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add delivery notes [optional]"
                    rows={3}
                    className="w-full resize-none rounded-xl bg-[#eefaf2] px-4 py-3 text-base text-[#0f1a12] outline-none ring-2 ring-transparent transition placeholder:text-[#0f1a12]/40 focus:ring-[#4bd381]"
                  />
                </div>
              </section>
            </div>

            {/* Payment + total + place order */}
            <aside className="mt-8 lg:sticky lg:top-8 lg:mt-0">
              <div className="lg:rounded-2xl lg:bg-white lg:p-6 lg:shadow-sm lg:ring-1 lg:ring-black/5">
                <h2 className="text-lg font-bold text-[#0f1a12]">Payment</h2>
                <div role="radiogroup" aria-label="Payment method" className="mt-4 space-y-3">
                  {PAYMENT.map((p) => {
                    const on = payment === p.id;
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-4 font-bold text-[#0f1a12] transition focus-within:ring-2 focus-within:ring-[#4bd381] ${
                          on ? "bg-[#c9f2d9]" : "bg-[#eefaf2] hover:bg-[#e2f6ea]"
                        }`}
                      >
                        {p.label}
                        <input
                          type="radio"
                          name="payment"
                          value={p.id}
                          checked={on}
                          onChange={() => setPayment(p.id)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={`h-6 w-6 rounded-full bg-white ${
                            on ? "border-[5px] border-[#4bd381]" : "border border-[#4bd381]"
                          }`}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#c9f2d9] px-4 py-4 text-lg font-bold text-[#0f1a12]">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {notice && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{notice}</p>
                )}

                <button
                  onClick={handlePlace}
                  disabled={placing}
                  className="mt-5 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#4bd381] text-base font-bold text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                >
                  {placing ? "Placing order..." : "Place Order"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}