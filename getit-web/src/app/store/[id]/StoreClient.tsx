/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import GlassNav from "@/components/GlassNav";
import { ApiError } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/currency";
import {
  fetchStore,
  fetchStoreProducts,
  type Store,
  type StoreProduct,
} from "@/lib/home";
import { useRequireLogin } from "@/lib/useRequireLogin";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function ProductTile({
  product,
  state,
  highlighted,
  onAdd,
}: {
  product: StoreProduct;
  state: "idle" | "adding" | "added";
  highlighted?: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      id={`product-${product.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-[#c9f2d9] transition hover:-translate-y-1 hover:shadow-lg ${
        highlighted ? "ring-2 ring-[#4bd381] ring-offset-2 ring-offset-[#fafaf9]" : ""
      }`}
    >
      <div className="relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-black/5 text-3xl font-bold text-black/30">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        {product.tag && (
          <span className="absolute left-2 top-2 rounded-full bg-[#4bd381] px-3 py-1 text-xs font-bold text-[#0f1a12]">
            {product.tag}
          </span>
        )}
        {highlighted && (
          <span className="absolute right-2 top-2 rounded-full bg-[#0f1a12] px-3 py-1 text-xs font-bold text-white">
            Your pick
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-base font-semibold leading-tight text-[#0f1a12]">
          {product.name}
        </p>
        <p className="mt-1 text-sm text-[#0f1a12]/50">{product.unit}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-base font-bold text-[#0f1a12]">
            {formatPrice(product.price, product.currency)}
          </p>
          <button
            onClick={onAdd}
            disabled={state === "adding"}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition active:scale-95 disabled:opacity-60 ${
              state === "added"
                ? "bg-white text-[#1a9a52]"
                : "bg-[#4bd381] text-[#0f1a12] hover:brightness-105"
            }`}
          >
            {state === "adding" ? "..." : state === "added" ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const requireLogin = useRequireLogin();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("product");

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setNotFound(false);
    Promise.all([fetchStore(id), fetchStoreProducts(id)])
      .then(([s, p]) => {
        if (cancelled) return;
        setStore(s);
        setProducts(p);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setError("Could not load this store. Try again.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  // scroll to the clicked product once the list has loaded
  useEffect(() => {
    if (loading || !focusId) return;
    document
      .getElementById(`product-${focusId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, focusId]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const shown = useMemo(() => {
    const list = category ? products.filter((p) => p.category === category) : products;
    if (!focusId) return list;
    const hit = list.find((p) => p.id === focusId);
    return hit ? [hit, ...list.filter((p) => p.id !== focusId)] : list;
  }, [products, category, focusId]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  async function handleAdd(p: StoreProduct) {
    setNotice("");
    setAdding(p.id);
    try {
      await addToCart(p.id, id);
      setAdded((s) => new Set(s).add(p.id));
      setTimeout(() => {
        setAdded((s) => {
          const n = new Set(s);
          n.delete(p.id);
          return n;
        });
      }, 1800);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        requireLogin(() => {}); // token was cleared by api.ts, so this redirects to /login
        return;
      }
      setNotice((e as Error).message || "Could not add to cart.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-7xl px-5 pb-40 pt-6 lg:px-10 lg:pt-10">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#fde4c1]">
          {loading ? (
            <div className="h-44 animate-pulse bg-black/5 lg:h-72" />
          ) : store?.image ? (
            <img src={store.image} alt={store.name} className="h-44 w-full object-cover lg:h-72" />
          ) : (
            <div className="flex h-44 items-center justify-center text-6xl font-extrabold text-black/20 lg:h-72">
              {store?.name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={goBack}
            aria-label="Go back"
            className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/40 shadow-md backdrop-blur-lg transition hover:bg-white/60"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {notFound && (
          <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-xl font-bold text-[#0f1a12]">Store not found</p>
            <p className="mt-2 text-[#0f1a12]/60">This store may have been removed.</p>
            <button
              onClick={() => router.push("/home")}
              className="mt-5 rounded-xl bg-[#4bd381] px-6 py-3 font-bold text-[#0f1a12] transition hover:brightness-105"
            >
              Back to home
            </button>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-2xl bg-red-50 p-5 text-red-600">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* Store info */}
        {store && !notFound && (
          <>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0f1a12] lg:text-4xl">{store.name}</h1>
                <p className="mt-1 text-[#0f1a12]/60">
                  {store.category}
                  {store.distance ? ` · ${store.distance}` : ""}
                </p>
                {store.rating !== undefined && (
                  <div className="mt-2 flex items-center gap-1 font-medium text-[#0f1a12]/70">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round">
                      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                    </svg>
                    {store.rating.toFixed(1)}
                  </div>
                )}
              </div>

              <button
                onClick={() => requireLogin(() => router.push(`/messages?store=${store.id}`))}
                className="flex items-center gap-2 rounded-xl border-2 border-[#d9d9d9] bg-white px-5 py-3 font-bold text-[#0f1a12] transition hover:border-[#4bd381]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" />
                </svg>
                Chat with store
              </button>
            </div>

            {notice && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{notice}</p>}

            {/* Category chips */}
            {categories.length > 1 && (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
                <button
                  onClick={() => setCategory(null)}
                  className={`shrink-0 rounded-full px-5 py-2 transition ${
                    category === null
                      ? "bg-[#4bd381] font-semibold text-[#0f1a12]"
                      : "bg-[#e5e5e5] text-[#0f1a12]/70 hover:bg-[#dcdcdc]"
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? null : c)}
                    className={`shrink-0 rounded-full px-5 py-2 transition ${
                      category === c
                        ? "bg-[#4bd381] font-semibold text-[#0f1a12]"
                        : "bg-[#e5e5e5] text-[#0f1a12]/70 hover:bg-[#dcdcdc]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products */}
        {!notFound && !error && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Products</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-72" />)
                : shown.map((p) => (
                    <ProductTile
                      key={p.id}
                      product={p}
                      highlighted={p.id === focusId}
                      state={adding === p.id ? "adding" : added.has(p.id) ? "added" : "idle"}
                      onAdd={() => requireLogin(() => handleAdd(p))}
                    />
                  ))}
            </div>
            {!loading && shown.length === 0 && (
              <p className="text-[#0f1a12]/60">No products here yet.</p>
            )}
          </section>
        )}
      </main>

      <GlassNav />
    </div>
  );
}