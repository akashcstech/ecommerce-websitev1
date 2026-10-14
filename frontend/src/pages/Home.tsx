import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, PackageSearch, Search, ShieldCheck, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import { useCategories } from "@/hooks/useShop";
import { apiGet } from "@/lib/api";
import type { ProductPage } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORTS: Record<string, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name: "Name A–Z",
};

import { HERO_ASSETS } from "@/lib/assets";

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("cat") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Number(params.get("page") ?? "1") || 1;
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const setParam = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in updates)) next.delete("page");
    setParams(next);
  };

  const { data: categories } = useCategories();
  const products = useQuery({
    queryKey: ["products", { q, cat, sort, page }],
    queryFn: () =>
      apiGet<ProductPage>(
        `/products?${new URLSearchParams({ q, category_id: cat, sort, page: String(page), page_size: "12" })}`,
      ),
    placeholderData: keepPreviousData,
  });

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setParam({ q: search.trim() });
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
  };

  const goPage = (p: number) => {
    setParam({ page: String(p) });
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
  };

  const data = products.isError ? undefined : products.data;

  return (
    <div>
      {/* Hero */}
      <section className="grid-texture border-b border-slate-200/80">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-20">
          <div className="animate-fade-up space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
              New season · Free delivery over ₹999
            </span>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl" data-testid="hero-title">
              Everyday essentials,
              <br />
              <span className="text-slate-500">delivered to your door.</span>
            </h1>
            <p className="max-w-lg text-lg text-slate-600">
              Browse a curated catalogue with live prices and stock. Add to cart, check out in three clicks and track every order.
            </p>
            <form onSubmit={onSearch} className="flex max-w-lg items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
              <Search className="ml-3 size-5 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search headphones, sneakers, mugs…"
                aria-label="Search catalogue"
                data-testid="hero-search-input"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="submit"
                data-testid="hero-search-button"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition-[background-color,transform] hover:bg-slate-700 active:scale-[0.98]"
              >
                Search <ArrowRight className="size-4" />
              </button>
            </form>
            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2"><Truck className="size-4" /> Cash on delivery</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Secure checkout</span>
            </div>
          </div>
          <div className="relative hidden h-[460px] lg:block" aria-hidden>
            <img src={HERO_ASSETS[0]} alt="" className="absolute right-0 top-0 h-[360px] w-[62%] rounded-3xl object-cover shadow-xl" />
            <img src={HERO_ASSETS[1]} alt="" className="absolute bottom-0 left-0 h-[240px] w-[48%] rounded-3xl border-4 border-white object-cover shadow-xl" />
            <img src={HERO_ASSETS[2]} alt="" className="absolute bottom-6 right-10 h-[150px] w-[30%] rounded-2xl border-4 border-white object-cover shadow-lg" />
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Shop the catalogue</h2>
            <p className="mt-1 text-sm text-slate-500" data-testid="catalogue-result-count">
              {data ? `${data.total} product${data.total === 1 ? "" : "s"}` : "Loading products…"}
              {q && ` matching “${q}”`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Sort</span>
            <Select value={sort} onValueChange={(v: string) => setParam({ sort: v === "newest" ? "" : v })}>
              <SelectTrigger className="w-48 rounded-full bg-white" data-testid="sort-select">
                <SelectValue placeholder={SORTS[sort] ?? "Newest"}>{SORTS[sort] ?? "Newest"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORTS).map(([value, label]) => (
                  <SelectItem key={value} value={value} data-testid={`sort-option-${value}`}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {[{ id: "", name: "All", product_count: 0 }, ...(categories ?? [])].map((c) => (
            <button
              key={c.id || "all"}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setParam({ cat: c.id })}
              data-testid={`category-pill-${c.id ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "all"}`}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,color,border-color] duration-200",
                cat === c.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
              )}
            >
              {c.name}
              {c.id && <span className="ml-1.5 text-xs opacity-60">{c.product_count}</span>}
            </button>
          ))}
          {q && (
            <button
              type="button"
              onClick={() => setParam({ q: "" })}
              data-testid="clear-search-button"
              className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              Clear search “{q}” ✕
            </button>
          )}
        </div>

        <div className="mt-8">
          {!data ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/6] animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center" data-testid="catalogue-empty-state">
              <PackageSearch className="size-10 text-slate-300" />
              <p className="font-medium">No products found</p>
              <p className="text-sm text-slate-500">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6" data-testid="product-grid">
              {data.items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>

        {data && data.pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination" data-testid="pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
              data-testid="pagination-prev"
              className="grid size-10 place-items-center rounded-full border bg-white transition-colors hover:bg-slate-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goPage(p)}
                data-testid={`pagination-page-${p}`}
                className={cn(
                  "size-10 rounded-full text-sm font-medium transition-colors",
                  p === page ? "bg-slate-900 text-white" : "border bg-white hover:bg-slate-100",
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= data.pages}
              onClick={() => goPage(page + 1)}
              data-testid="pagination-next"
              className="grid size-10 place-items-center rounded-full border bg-white transition-colors hover:bg-slate-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
