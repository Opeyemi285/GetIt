/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import type { Product, Store } from "@/lib/home";

function Photo({ src, name, className }: { src?: string; name: string; className: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-black/5 text-3xl font-bold text-black/30 ${className}`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={name} loading="lazy" className={`object-cover ${className}`} />;
}

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.id}`}
      className="group block w-60 shrink-0 overflow-hidden rounded-2xl bg-[#fde4c1] transition hover:-translate-y-1 hover:shadow-lg lg:w-auto"
    >
      <Photo src={store.image} name={store.name} className="aspect-[4/3] w-full transition group-hover:scale-[1.03]" />
      <div className="px-3 py-3">
        <p className="text-base font-semibold text-[#0f1a12]">{store.name}</p>
        {store.category && <p className="text-xs text-[#0f1a12]/50">{store.category}</p>}
      </div>
    </Link>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={product.storeId ? `/store/${product.storeId}?product=${product.id}` : "#"}
      className="group block overflow-hidden rounded-2xl bg-[#c9f2d9] transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="overflow-hidden">
        <Photo src={product.image} name={product.name} className="aspect-square w-full transition group-hover:scale-[1.03]" />
      </div>
      <div className="px-3 py-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-base font-semibold leading-tight text-[#0f1a12]">
          {product.name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#0f1a12]/60">
            {formatPrice(product.price, product.currency)}
          </p>
          {product.storeName && (
            <p className="truncate text-xs text-[#0f1a12]/50">{product.storeName}</p>
          )}
        </div>
      </div>
    </Link>
  );
}