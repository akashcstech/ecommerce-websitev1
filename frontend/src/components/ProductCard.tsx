import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { StockBadge } from "@/components/Badges";
import { useAddToCart } from "@/hooks/useShop";
import { inr } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add, isPending, pendingId } = useAddToCart();
  const out = product.stock <= 0;
  const busy = isPending && pendingId === product.id;

  return (
    <article
      className="card-lift group flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-slate-100" data-testid={`product-card-link-${product.id}`}>
        <img
          src={getAssetImageUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          className={`size-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${out ? "grayscale" : ""}`}
        />
        <div className="absolute left-3 top-3">
          <StockBadge stock={product.stock} testId={`product-stock-${product.id}`} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{product.category_name}</p>
        <Link to={`/product/${product.id}`} className="line-clamp-2 font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-heading text-lg font-semibold tabular-nums" data-testid={`product-price-${product.id}`}>
            {inr(product.price)}
          </span>
          <button
            type="button"
            disabled={out || busy}
            onClick={() => add(product.id)}
            aria-label={out ? "Out of stock" : `Add ${product.name} to cart`}
            data-testid={`quick-add-${product.id}`}
            className="grid size-9 place-items-center rounded-full bg-slate-900 text-white transition-[background-color,transform] duration-200 hover:bg-slate-700 active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
