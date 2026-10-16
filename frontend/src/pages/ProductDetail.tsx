import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Minus, Plus, ShieldCheck, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/Badges";
import { useAddToCart } from "@/hooks/useShop";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Product } from "@/lib/types";

function OfferBadge({ label }: { label: string }) {
  const base = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold tracking-wide animate-pulse-slow";
  if (label === "LIMITED") return <span className={`${base} bg-purple-100 text-purple-700 border border-purple-300`}><Zap className="size-3" />{label}</span>;
  if (label === "SALE") return <span className={`${base} bg-rose-100 text-rose-600 border border-rose-300`}><Zap className="size-3" />{label}</span>;
  return <span className={`${base} bg-orange-100 text-orange-700 border border-orange-300`}><Zap className="size-3" />{label}</span>;
}

export default function ProductDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const { add, isPending } = useAddToCart();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    retry: false,
  });

  const product = isError ? undefined : data;
  const out = (product?.stock ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900" data-testid="back-to-shop-link">
        <ArrowLeft className="size-4" /> Back to shop
      </Link>

      {isLoading ? (
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200/70" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200/70" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200/70" />
          </div>
        </div>
      ) : !product ? (
        <div className="py-24 text-center" data-testid="product-not-found">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <p className="mt-2 text-slate-500">It may have been removed from the catalogue.</p>
        </div>
      ) : (
        <div className="mt-6 grid animate-fade-up gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <img
              src={getAssetImageUrl(product.image_url)}
              alt={product.name}
              className={`aspect-square w-full object-cover ${out ? "grayscale" : ""}`}
              data-testid="product-detail-image"
            />
          </div>
          <div className="flex flex-col gap-6 lg:py-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500" data-testid="product-detail-category">
                {product.category_name}
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl" data-testid="product-detail-name">
                {product.name}
              </h1>

              {/* ── Price block ── */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-heading text-3xl font-semibold tabular-nums" data-testid="product-detail-price">
                  {inr(product.price)}
                </span>
                {product.mrp != null && product.mrp > product.price && (
                  <span className="text-lg text-slate-400 line-through tabular-nums">
                    {inr(product.mrp)}
                  </span>
                )}
                {product.offer_label && <OfferBadge label={product.offer_label} />}
              </div>

              {/* Savings line */}
              {product.mrp != null && product.mrp > product.price && (() => {
                const savings = product.mrp - product.price;
                const pct = Math.round((savings / product.mrp) * 100);
                return (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200">
                      {inr(savings)} off
                    </span>
                    <span className="text-sm text-slate-500">{pct}% savings on MRP</span>
                  </div>
                );
              })()}

              <div className="flex items-center gap-4">
                <StockBadge stock={product.stock} testId="product-detail-stock" />
              </div>
              <p className="text-sm text-slate-500" data-testid="product-detail-stock-count">
                {out ? "Currently unavailable" : `${product.stock} units available`}
              </p>
            </div>

            <p className="leading-relaxed text-slate-700" data-testid="product-detail-description">
              {product.description || "No description provided."}
            </p>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center rounded-full border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={qty <= 1 || out}
                    onClick={() => setQty((q) => q - 1)}
                    className="p-2.5 transition-colors hover:bg-slate-100 disabled:opacity-40"
                    data-testid="qty-decrease-button"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-10 text-center font-medium tabular-nums" data-testid="qty-value">{out ? 0 : qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={qty >= product.stock || out}
                    onClick={() => setQty((q) => q + 1)}
                    className="p-2.5 transition-colors hover:bg-slate-100 disabled:opacity-40"
                    data-testid="qty-increase-button"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 flex-1 rounded-full text-base"
                  disabled={out || isPending}
                  onClick={() => add(product.id, qty)}
                  data-testid="add-to-cart-button"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {out ? "Out of stock" : "Add to cart"}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-full text-base"
                  disabled={out || isPending}
                  onClick={() => add(product.id, qty, () => navigate("/checkout"))}
                  data-testid="buy-now-button"
                >
                  Buy now
                </Button>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <span className="flex items-center gap-2"><Truck className="size-4" /> Cash on delivery available</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Cancel free while order is Placed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
