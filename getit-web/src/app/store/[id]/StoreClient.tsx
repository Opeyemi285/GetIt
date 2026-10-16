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

const PAGE_SIZE = 20; // items shown per category, and added on each "See More"

type Group = { name: string; items: StoreProduct[] };

const slug = (s: string) => `cat-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function ProductRow({
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
    <li
      id={`product-${product.id}`}
      className={`flex items-center justify-between gap-4 rounded-2xl p-2 transition md:p-4 md:shadow-sm ${
        highlighted
          ? "bg-[#eef8f2] ring-2 ring-[#4bd381]"
          : "md:bg-white md:ring-1 md:ring-black/5"
      }`}
    >
      <div className="min-w-0 flex-1">
        {(product.tag || highlighted) && (
          <div className="flex items-center gap-2">
            {product.tag && (
              <span className="text-sm font-medium text-[#34c473]">{product.tag}</span>
            )}
            {highlighted && (
              <span className="rounded-full bg-[#0f1a12] px-2 py-0.5 text-[11px] font-bold text-white">
                Your pick
              </span>
            )}
          </div>
        )}
        <p className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-[#0f1a12] lg:text-lg">
          {product.name}
        </p>
        <p className="mt-0.5 text-[#0f1a12]/50">
          {formatPrice(product.price, product.currency)}
          {product.unit ? ` / ${product.unit}` : ""}
        </p>
      </div>

      <div className="relative shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-16 w-20 rounded-lg object-cover sm:h-[72px] sm:w-24"
          />
        ) : (
          <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-black/5 text-2xl font-bold text-black/30 sm:h-[72px] sm:w-24">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={onAdd}
          disabled={state === "adding"}
          aria-label={`Add ${product.name} to cart`}
          className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#4bd381] text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-90 disabled:opacity-70"
        >
          {state === "adding" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0f1a12]/30 border-t-[#0f1a12]" />
          ) : state === "added" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </div>
    </li>
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
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [liveNote, setLiveNote] = useState(false);

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

  const isSearching = query.trim().length > 0;

  // products grouped by category; the clicked product's group comes first, and it leads that group
  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;

    const map = new Map<string, StoreProduct[]>();
    for (const p of list) {
      const key = p.category || "Other";
      const arr = map.get(key);
      if (arr) arr.push(p);
      else map.set(key, [p]);
    }

    let out: Group[] = Array.from(map, ([name, items]) => ({ name, items }));
    if (focusId) {
      out = out.map((g) => {
        const hit = g.items.find((p) => p.id === focusId);
        return hit ? { ...g, items: [hit, ...g.items.filter((p) => p.id !== focusId)] } : g;
      });
      out.sort(
        (a, b) => Number(b.items[0]?.id === focusId) - Number(a.items[0]?.id === focusId)
      );
    }
    return out;
  }, [products, query, focusId]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  function showMore(name: string) {
    setCounts((c) => ({ ...c, [name]: (c[name] ?? PAGE_SIZE) + PAGE_SIZE }));
  }

  function showLess(name: string) {
    setCounts((c) => ({ ...c, [name]: PAGE_SIZE }));
    jumpTo(name); // so you don't get stranded far down the page after collapsing
  }

  function jumpTo(name: string) {
    document.getElementById(slug(name))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showLiveNote() {
    setLiveNote(true);
    setTimeout(() => setLiveNote(false), 3000);
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
        requireLogin(() => {}); // token was cleared by api.ts, so this redirects to onboarding
        return;
      }
      setNotice((e as Error).message || "Could not add to cart.");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-6xl px-5 pb-40 pt-6 lg:px-10 lg:pt-10">
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

          {loading ? (
            <div className="mx-auto h-6 w-24 animate-pulse rounded bg-black/10" />
          ) : (
            <h1 className="truncate text-center text-lg font-bold uppercase text-[#0f1a12] lg:text-2xl">
              {store?.name}
            </h1>
          )}

          <span /> {/* keeps the store name centered */}
        </header>

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

        {!notFound && !error && (
          <>
            {/* Search */}
            <div className="relative mt-6 lg:max-w-2xl">
              <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for items"
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

            {/* Banner */}
            <div className="relative mt-5 h-52 overflow-hidden rounded-2xl bg-[#fde4c1] sm:h-64 lg:h-80">
              {loading ? (
                <div className="h-full w-full animate-pulse bg-black/5" />
              ) : store?.image ? (
                <img
                  src={store.image}
                  alt=""
                  className="h-full w-full scale-110 object-cover blur-[6px]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl font-extrabold text-black/20">
                  {store?.name.charAt(0).toUpperCase()}
                </div>
              )}
              {!loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <button
                    onClick={showLiveNote}
                    className="rounded-lg bg-[#4bd381] px-5 py-2 font-bold text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-95"
                  >
                    Shop Live
                  </button>
                </div>
              )}
            </div>

            {liveNote && (
              <p className="mt-3 rounded-xl bg-[#fde4c1] px-4 py-3 text-sm text-[#0f1a12]">
                Live shopping is coming soon.
              </p>
            )}
            {notice && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{notice}</p>
            )}

            {/* Categories + products */}
            <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
              {/* Desktop category list */}
              <aside className="hidden lg:block">
                <div className="sticky top-8">
                  <h2 className="text-sm font-semibold text-[#0f1a12]/50">Categories</h2>
                  <ul className="mt-3 space-y-1">
                    {groups.map((g) => (
                      <li key={g.name}>
                        <button
                          onClick={() => jumpTo(g.name)}
                          className="w-full rounded-lg px-3 py-2 text-left font-medium text-[#0f1a12] transition hover:bg-black/5"
                        >
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              <div>
                {!loading && groups.length > 0 && (
                  <p className="mb-4 text-right text-base font-semibold text-[#0f1a12]/50 lg:hidden">
                    Categories
                  </p>
                )}

                {loading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-[#0f1a12]/60">
                    {isSearching ? `No items match "${query.trim()}".` : "No products here yet."}
                  </p>
                ) : (
                  groups.map((g) => {
                    const limit = isSearching ? g.items.length : counts[g.name] ?? PAGE_SIZE;
                    const visible = g.items.slice(0, limit);
                    const hasMore = !isSearching && g.items.length > limit;
                    const canCollapse = !isSearching && !hasMore && g.items.length > PAGE_SIZE;
                    return (
                      <section key={g.name} id={slug(g.name)} className="scroll-mt-24 pb-8">
                        <span className="inline-block rounded-lg bg-[#fde8cf] px-3 py-1 text-sm font-semibold text-[#0f1a12]">
                          {g.name}
                        </span>

                        <ul className="mt-5 space-y-6 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-3">
                          {visible.map((p) => (
                            <ProductRow
                              key={p.id}
                              product={p}
                              highlighted={p.id === focusId}
                              state={adding === p.id ? "adding" : added.has(p.id) ? "added" : "idle"}
                              onAdd={() => requireLogin(() => handleAdd(p))}
                            />
                          ))}
                        </ul>

                        {hasMore && (
                        <button
                          onClick={() => showMore(g.name)}
                          className="mx-auto mt-5 block text-sm font-semibold text-[#f0962e] underline underline-offset-2"
                        >
                          See More
                        </button>
                      )}
                      {canCollapse && (
                        <button
                          onClick={() => showLess(g.name)}
                          className="mx-auto mt-5 block text-sm font-semibold text-[#f0962e] underline underline-offset-2"
                        >
                          See Less
                        </button>
                      )}
                      </section>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <GlassNav />
    </div>
  );
}