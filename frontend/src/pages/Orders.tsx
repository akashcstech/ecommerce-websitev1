import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badges";
import RequireCustomer from "@/components/RequireCustomer";
import { apiGet } from "@/lib/api";
import { fmtDate, inr, shortId } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Order } from "@/lib/types";

function OrderList() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["orders"], queryFn: () => apiGet<Order[]>("/orders") });
  const orders = isError ? [] : (data ?? []);

  if (isLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>;
  }
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center" data-testid="orders-empty-state">
        <Package className="size-10 text-slate-300" />
        <p className="font-medium">No orders yet</p>
        <Link to="/" className={buttonVariants({ className: "rounded-full" })}>Start shopping</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3" data-testid="orders-list">
      {orders.map((o, i) => (
        <li key={o.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <Link
            to={`/orders/${o.id}`}
            className="card-lift flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            data-testid={`order-row-${o.id}`}
          >
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it) => (
                <img key={it.id} src={getAssetImageUrl(it.image_url)} alt="" className="size-12 rounded-xl border-2 border-white object-cover" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{shortId(o.id)}</span>
                <StatusBadge status={o.status} testId={`order-status-${o.id}`} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {fmtDate(o.created_at)} · {o.items.reduce((s, it) => s + it.quantity, 0)} items · {o.payment_method === "cod" ? "Cash on delivery" : `Card •••• ${o.card_last4}`}
              </p>
            </div>
            <span className="font-heading text-lg font-semibold tabular-nums">{inr(o.total)}</span>
            <ChevronRight className="size-5 text-slate-400" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Orders() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">My orders</h1>
      <RequireCustomer>
        <OrderList />
      </RequireCustomer>
    </div>
  );
}
