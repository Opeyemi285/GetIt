/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/home/Cards";
import { ApiError } from "@/lib/api";
import { searchAll, type Product, type Store } from "@/lib/home";
import { setNext } from "@/lib/session";

type Tab = "All" | "Stores" | "Items";
type Sort = "relevance" | "name" | "priceAsc" | "priceDesc" | "rating";

const CATEGORIES = ["Grocery", "Pharmacy", "Restaurant", "Toiletries", "Electronics"];
const POPULAR = ["Wolfs Baine", "Vervain", "Ofada Rice"]; // placeholder until the backend has trending searches
const SORTS: { id: Sort; label: string }[] = [
  { id: "relevance", label: "Sort: Relevance" },
  { id: "name", label: "Name: A to Z" },
  { id: "priceAsc", label: "Price: Low to high" },
  { id: "priceDesc", label: "Price: High to low" },
  { id: "rating", label: "Top rated stores" },
];
const RECENT_KEY = "recent_searches";

// treats "Restaurant" and "Restaurants" as the same category
const norm = (s?: string) => (s ?? "").toLowerCase().replace(/s$/, "");

function StoreRow({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f5f4] p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-[#0f1a12]">{store.name}</p>
        <p className="mt-1 text-sm text-[#0f1a12]/60">
          {store.category}
          {store.distance ? ` · ${store.distance}` : ""}
        </p>
        {store.rating !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-sm font-medium text-[#0f1a12]/70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
            </svg>
            {store.rating.toFixed(1)}
          </div>
        )}
      </div>
      {store.image ? (
        <img src={store.image} alt={store.name} loading="lazy" className="h-[72px] w-[88px] shrink-0 rounded-lg object-cover lg:h-24 lg:w-32" />
      ) : (
        <div className="flex h-[72px] w-[88px] shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-bold text-black/30 lg:h-24 lg:w-32">
          {store.name.charAt(0).toUpperCase()}
        </div>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("relevance");
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  // recent searches live in this browser only
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {}
  }, []);

  function saveRecent(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function clearRecent() {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  }
  function runSearch(term: string) {
    const t = term.trim();
        if (t.length < 2) return;
        setQuery(t);
        setSubmitted(t);
        saveRecent(t);
    }

  // search only runs for the submitted term
    useEffect(() => {
    if (submitted.length < 2) {
        setStores([]);
        setProducts([]);
        setSearched(false);
        setLoading(false);
        setNeedsLogin(false);
        return;
    }
    let cancelled = false;
    setLoading(true);
    searchAll(submitted)
        .then((r) => {
        if (cancelled) return;
        setStores(r.stores);
        setProducts(r.products);
        setNeedsLogin(false);
        setSearched(true);
        })
        .catch((e) => {
        if (cancelled) return;
        setStores([]);
        setProducts([]);
        setNeedsLogin(e instanceof ApiError && e.status === 401);
        setSearched(true);
        })
        .finally(() => !cancelled && setLoading(false));
    return () => {
        cancelled = true;
    };
    }, [submitted]);

  const shownStores = useMemo(() => {
    let list = category ? stores.filter((s) => norm(s.category) === norm(category)) : stores;
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "rating") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [stores, category, sort]);

  const shownProducts = useMemo(() => {
    let list = category ? products.filter((p) => norm(p.category) === norm(category)) : products;
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, sort]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  function loginFirst() {
    setNext("/search");
    router.push("/login");
  }

  const hasQuery = submitted.length >= 2;
  const showStores = tab === "All" || tab === "Stores";
  const showItems = tab === "All" || tab === "Items";

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 lg:px-10 lg:pt-10">
        {/* Header */}
        <header className="flex items-center gap-2">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#0f1a12] lg:text-3xl">Search</h1>
        </header>

        {/* Search bar */}
        <form
            className="relative mt-5 lg:max-w-3xl"
            onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
            }}
            >
            {/* search icon svg stays the same */}
            <input
                autoFocus
                enterKeyHint="search"
                value={query}
                onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) setSubmitted(""); // emptying the box returns to recent/popular
                }}
                placeholder="Search for store or items"
                className="h-[52px] w-full rounded-xl border-2 border-[#d9d9d9] bg-white pl-12 pr-12 text-base text-[#0f1a12] outline-none transition placeholder:text-[#0f1a12]/40 focus:border-[#4bd381]"
            />
            {query && (
                <button
                type="button"
                onClick={() => {
                    setQuery("");
                    setSubmitted("");
                }}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0f1a12]/40 hover:text-[#0f1a12]"
                >
                {/* x svg stays the same */}
                </button>
            )}
            </form>

            {query.trim().length >= 2 && query.trim() !== submitted && (
            <p className="mt-2 text-sm text-[#0f1a12]/50">Press Enter to search</p>
            )}

        {/* Before searching: recent and popular */}
        {!hasQuery && (
          <div className="mt-8 grid gap-8 lg:max-w-3xl lg:grid-cols-2">
            {recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0f1a12]">Recent Searches</h2>
                  <button onClick={clearRecent} className="text-sm font-semibold text-[#2e9e5b] hover:underline">
                    Clear
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#0f1a12]/70 ring-1 ring-black/10 transition hover:bg-black/5"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-bold text-[#0f1a12]">Popular Searches</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    onClick={() => runSearch(term)}
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#0f1a12]/70 ring-1 ring-black/10 transition hover:bg-black/5"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17l6-6 4 4 8-8" />
                      <path d="M15 7h6v6" />
                    </svg>
                    {term}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Results */}
        {hasQuery && (
          <>
            {/* Tabs */}
            <div className="mt-8 flex gap-6 border-b border-black/10">
              {(["All", "Stores", "Items"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-2 text-base transition ${
                    tab === t
                      ? "border-[#0f1a12] font-bold text-[#0f1a12]"
                      : "border-transparent text-[#0f1a12]/50 hover:text-[#0f1a12]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort and category chips */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label="Sort results"
                  className="cursor-pointer appearance-none rounded-full border border-[#d9d9d9] bg-white py-2 pl-4 pr-9 text-sm text-[#0f1a12] outline-none transition focus:border-[#4bd381]"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? null : c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                    category === c
                      ? "bg-[#4bd381] font-semibold text-[#0f1a12]"
                      : "bg-[#e5e5e5] text-[#0f1a12]/70 hover:bg-[#dcdcdc]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-8 flex justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#4bd381]/30 border-t-[#4bd381]" />
              </div>
            )}

            {!loading && needsLogin && (
              <div className="mt-8 rounded-2xl bg-[#fde4c1] p-6">
                <p className="text-lg font-semibold text-[#0f1a12]">Log in to search stores and items</p>
                <button
                  onClick={loginFirst}
                  className="mt-4 rounded-xl bg-[#4bd381] px-6 py-3 font-bold text-[#0f1a12] transition hover:brightness-105"
                >
                  Log in
                </button>
              </div>
            )}

            {!loading && searched && !needsLogin && (
              <div className="mt-6 space-y-10" onClickCapture={() => saveRecent(query)}>
                {showStores && (
                  <section>
                    <h2 className="text-lg font-bold text-[#0f1a12] lg:text-2xl">Stores</h2>
                    {shownStores.length === 0 ? (
                      <p className="mt-3 text-[#0f1a12]/50">No stores found</p>
                    ) : (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-5">
                        {shownStores.map((s) => (
                          <StoreRow key={s.id} store={s} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {showItems && (
                  <section>
                    <h2 className="text-lg font-bold text-[#0f1a12] lg:text-2xl">Products</h2>
                    {shownProducts.length === 0 ? (
                      <p className="mt-3 text-[#0f1a12]/50">No products found</p>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
                        {shownProducts.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}