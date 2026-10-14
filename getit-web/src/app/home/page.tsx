"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassNav from "@/components/GlassNav";
import { ProductCard, StoreCard } from "@/components/home/Cards";
import { ApiError } from "@/lib/api";
import {
  fetchCartCount,
  fetchHome,
  searchAll,
  type Product,
  type Store,
} from "@/lib/home";
import { AUTH_ENTRY, isLoggedIn, setNext } from "@/lib/session";
import Link from "next/dist/client/link";

const CATEGORIES = ["Grocery", "Pharmacy", "Restaurant", "Toiletries", "Electronics"];

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

export default function Home() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello!");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [results, setResults] = useState<{ stores: Store[]; products: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [fabCollapsed, setFabCollapsed] = useState(false);

useEffect(() => {
  let last = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    // collapse once the user scrolls down; never auto-expand
    if (y > last && y > 80) setFabCollapsed(true);
    last = y;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning!" : h < 17 ? "Good Afternoon!" : "Good Evening!");
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchCartCount().then(setCartCount).catch(() => {});
  }, []);

  // home data for the selected category
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setNeedsLogin(false);
    fetchHome(category)
      .then((d) => {
        if (cancelled) return;
        setStores(d.stores);
        setPopular(d.popular);
        setRecommended(d.recommended);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) setNeedsLogin(true);
        else setError("Failed to load data. Try again.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, attempt]);

  // debounced search (2+ characters, 400ms like the mobile app)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      searchAll(q)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults({ stores: [], products: [] }));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  function go(path: string) {
    if (!isLoggedIn()) {
      setNext(path);
      router.push(AUTH_ENTRY);
      return;
    }
    router.push(path);
  }

  const searching = results !== null;
  const noResults = searching && results.stores.length === 0 && results.products.length === 0;

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-7xl px-5 pb-40 pt-8 lg:px-10 lg:pt-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#0f1a12] lg:text-4xl">{greeting}</h1>
          <button
            onClick={() => go("/cart")}
            aria-label="Cart"
            className="relative flex h-12 w-12 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <img src="/shopping-cart.png" width={28} height={28} alt="Cart icon" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4bd381] px-1 text-xs font-bold text-[#0f1a12]">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* Search */}
        <div className="relative mt-6 lg:max-w-2xl">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <Link
            href="/search"
            className="relative mt-6 flex h-[52px] w-full items-center rounded-xl border-2 border-[#d9d9d9] bg-white pl-12 pr-4 text-base text-[#0f1a12]/40 transition hover:border-[#4bd381] lg:max-w-2xl"
            >
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
            </svg>
            Search for store or items
          </Link>
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

        {/* Categories */}
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-5 py-2 text-base transition ${
                c === category
                  ? "bg-[#4bd381] font-semibold text-[#0f1a12]"
                  : "bg-[#e5e5e5] text-[#0f1a12]/70 hover:bg-[#dcdcdc]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search results */}
        {searching && (
          <div className="mt-10 space-y-10">
            {noResults && (
              <p className="text-[#0f1a12]/60">No results for &ldquo;{query.trim()}&rdquo;</p>
            )}

            {results.stores.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Stores</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                  {results.stores.map((s) => (
                    <StoreCard key={s.id} store={s} />
                  ))}
                </div>
              </section>
            )}

            {results.products.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Products</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
                  {results.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Home content */}
        {!searching && (
          <>
            {needsLogin && (
              <div className="mt-10 rounded-2xl bg-[#fde4c1] p-6">
                <p className="text-lg font-semibold text-[#0f1a12]">Log in to see stores and items</p>
                <button
                  onClick={() => go("/home")}
                  className="mt-4 rounded-xl bg-[#4bd381] px-6 py-3 font-bold text-[#0f1a12] transition hover:brightness-105"
                >
                  Log in
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

            {!needsLogin && (
              <>
                <section className="mt-10">
                  <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Featured Stores</h2>
                  <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-56 w-60 shrink-0" />
                        ))
                        : stores.map((s) => (
                            <div key={s.id} className="w-60 shrink-0">
                            <StoreCard store={s} />
                            </div>
                        ))}
                  </div>
                  {!loading && !error && stores.length === 0 && (
                    <p className="text-[#0f1a12]/60">No stores in this category yet.</p>
                  )}
                </section>

                <section className="mt-12">
                  <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Popular Items</h2>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-60" />)
                      : popular.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                  {!loading && !error && popular.length === 0 && (
                    <p className="text-[#0f1a12]/60">No items in this category yet.</p>
                  )}
                </section>

                {(loading || recommended.length > 0) && (
                  <section className="mt-12">
                    <h2 className="text-xl font-bold text-[#0f1a12] lg:text-2xl">Recommended for you</h2>
                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-60" />)
                        : recommended.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* New Request button */}
      <button
        onClick={() => go("/request/new")}
        aria-label="New Request"
        className="group fixed bottom-28 right-0 z-30 flex items-center rounded-l-full rounded-r-none bg-[#4bd381] py-4 pl-5 pr-4 font-bold text-[#0f1a12] shadow-lg transition hover:brightness-105 active:scale-95 lg:bottom-32"
        >
        <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
        </svg>
        <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
            fabCollapsed
                ? "ml-0 max-w-0 opacity-0 group-hover:ml-2 group-hover:max-w-[10rem] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[10rem] group-focus-visible:opacity-100"
                : "ml-2 max-w-[10rem] opacity-100"
            }`}
        >
            New Request
        </span>
      </button>

      <GlassNav />
    </div>
  );
}