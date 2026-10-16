/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassNav from "@/components/GlassNav";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { fetchOrders, type Order } from "@/lib/orders";
import { AUTH_ENTRY, setNext } from "@/lib/session";
import { useRequireAuth } from "@/lib/useRequireAuth";

const isInProgress = (o: Order) => o.status.toLowerCase() === "in progress";

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "in progress" || s === "delivered") return "text-[#34c473]";
  if (s.startsWith("cancel")) return "text-red-500";
  return "text-[#0f1a12]/50";
}

function summary(items: Order["items"]) {
  const names = items.map((i) => i.name);
  const rest = names.length - 2;
  const shown = names.slice(0, 2).join(", ");
  return rest > 0 ? `${shown} + ${rest} more` : shown;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function StoreLogo({ order }: { order: Order }) {
  return order.storeLogo ? (
    <img
      src={order.storeLogo}
      alt={order.storeName}
      loading="lazy"
      className="h-14 w-20 shrink-0 rounded-lg bg-white object-contain p-1"
    />
  ) : (
    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-white text-xl font-bold text-black/30">
      {order.storeName.charAt(0).toUpperCase()}
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const live = isInProgress(order);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Order list">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="step-in absolute inset-x-0 bottom-0 top-10 overflow-y-auto rounded-t-3xl bg-[#fafaf9] px-5 pb-10 pt-5 lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[480px] lg:rounded-none lg:rounded-l-3xl lg:px-8 lg:pt-8">
        <header className="grid grid-cols-[44px_1fr_44px] items-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-center text-lg font-bold text-[#0f1a12]">Order List</h2>
          <span />
        </header>
        <p className="mt-1 text-center text-sm text-[#0f1a12]/50">
          {order.storeName}
          {formatDate(order.date) ? ` · ${formatDate(order.date)}` : ""}
        </p>

        {/* Items */}
        <h3 className="mt-6 text-lg font-bold text-[#0f1a12]">Items</h3>
        <ul className="mt-4 space-y-5">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4">
              {i.image ? (
                <img
                  src={i.image}
                  alt={i.name}
                  loading="lazy"
                  className="h-16 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-bold text-black/30">
                  {i.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-bold text-[#0f1a12]">{i.name}</p>
                <p className="mt-0.5 text-[#0f1a12]/50">
                  {i.qty} x {i.unit ?? formatPrice(i.price)}
                </p>
              </div>
              <p className="shrink-0 text-[#0f1a12]/50">{formatPrice(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-[#c9f2d9] px-4 py-4 text-lg font-bold text-[#0f1a12]">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        {/* Runner */}
        {(live || order.runner) && (
          <>
            <h3 className="mt-8 text-lg font-bold text-[#0f1a12]">Your Runner</h3>
            {order.runner ? (
              <div className="mt-4 flex items-center gap-4">
                {order.runner.photo ? (
                  <img
                    src={order.runner.photo}
                    alt={order.runner.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xl font-bold text-black/30">
                    {order.runner.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-[#0f1a12]">{order.runner.name}</p>
                  {order.runner.rating !== undefined && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-[#0f1a12]/50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round">
                        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                      </svg>
                      {order.runner.rating.toFixed(2)}
                      {order.runner.reviews !== undefined ? ` (${order.runner.reviews} Reviews)` : ""}
                    </p>
                  )}
                </div>
                <Link
                  href="/messages"
                  aria-label="Message your runner"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#34c473] transition hover:bg-[#c9f2d9]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" />
                  </svg>
                </Link>
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-white px-4 py-4 text-[#0f1a12]/60 ring-1 ring-black/5">
                A runner will be assigned to your order soon.
              </p>
            )}
          </>
        )}

        {/* Track */}
        {live && (
          <>
            <h3 className="mt-8 text-lg font-bold text-[#0f1a12]">Track Order</h3>
            <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-[#e9efe9] px-6 text-center text-sm text-[#0f1a12]/50">
              Live tracking will show here once your runner picks up the order.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const ready = useRequireAuth(); // guests are sent to onboarding and back here afterwards
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchOrders()
      .then((o) => !cancelled && setOrders(o))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setNext("/orders");
          router.replace(AUTH_ENTRY);
        } else {
          setError("Could not load your orders.");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ready, attempt, router]);

  // lock page scroll and close on Escape while the order panel is open
  useEffect(() => {
    if (!selectedId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.storeName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [orders, query]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  // the floating button opens the order in progress, or the latest one if nothing is in progress
  const current = orders.find(isInProgress) ?? orders[0] ?? null;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  if (!ready) return null;

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-5xl px-5 pb-44 pt-6 lg:px-10 lg:pt-10">
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
          <h1 className="text-center text-lg font-bold text-[#0f1a12] lg:text-2xl">Order History</h1>
          <span />
        </header>

        {/* Search */}
        <div className="relative mt-6 lg:max-w-2xl">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by store or items"
            className="h-[52px] w-full rounded-xl border-2 border-[#d9d9d9] bg-white pl-12 pr-12 text-base text-[#0f1a12] outline-none transition placeholder:text-[#0f1a12]/40 focus:border-[#4bd381]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/40 hover:text-[#0f1a12]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-600">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-xl font-bold text-[#0f1a12]">No orders yet</p>
            <p className="mt-2 text-[#0f1a12]/60">Orders you place will show up here.</p>
            <Link
              href="/home"
              className="mt-6 inline-block rounded-xl bg-[#4bd381] px-6 py-3 font-bold text-[#0f1a12] transition hover:brightness-105"
            >
              Start shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && shown.length === 0 && (
          <p className="mt-8 text-[#0f1a12]/60">No orders match &ldquo;{query.trim()}&rdquo;.</p>
        )}

        {!loading && !error && shown.length > 0 && (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-5">
            {shown.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => setSelectedId(o.id)}
                  className="flex w-full flex-col gap-4 rounded-2xl bg-[#f5f5f4] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <StoreLogo order={o} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-[#0f1a12]">{o.storeName}</p>
                      <p className="text-[#0f1a12]/50">{formatDate(o.date)}</p>
                    </div>
                    <span className={`shrink-0 self-start font-medium ${statusClass(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[#0f1a12]/50">
                    <span className="truncate">{summary(o.items)}</span>
                    <span className="shrink-0 font-medium">{formatPrice(o.total)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Floating button: shows the items ordered */}
      {!loading && !error && current && !selected && (
        <button
          onClick={() => setSelectedId(current.id)}
          className="fixed bottom-28 right-4 z-30 flex items-center gap-2 rounded-full bg-[#4bd381] py-4 pl-5 pr-6 font-bold text-[#0f1a12] shadow-lg transition hover:brightness-105 active:scale-95 lg:bottom-32 lg:right-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
          Items ordered
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0f1a12] px-1.5 text-xs text-white">
            {current.items.reduce((n, i) => n + i.qty, 0)}
          </span>
        </button>
      )}

      {selected && <OrderDetail order={selected} onClose={() => setSelectedId(null)} />}

      <GlassNav />
    </div>
  );
}