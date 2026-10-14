import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleCheckBig, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/Badges";
import RequireCustomer from "@/components/RequireCustomer";
import { apiGet, apiPost } from "@/lib/api";
import { errMsg, fmtDate, inr, shortId } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Placed", "Shipped", "Delivered"] as const;

function OrderView() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    retry: false,
  });
  const cancel = useMutation({
    mutationFn: () => apiPost<Order>(`/orders/${id}/cancel`),
    onSuccess: (o) => {
      qc.setQueryData(["orders", id], o);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order cancelled. Stock has been released.");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />;
  const order = isError ? undefined : data;
  if (!order) {
    return <p className="py-20 text-center text-slate-500" data-testid="order-not-found">Order not found.</p>;
  }
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="space-y-6">
      {params.get("placed") && order.status === "Placed" && (
        <div className="flex animate-fade-up items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900" data-testid="order-success-banner">
          <CircleCheckBig className="size-6" />
          <div>
            <p className="font-semibold">Thank you! Your order has been placed.</p>
            <p className="text-sm">We'll update the status here as it moves along.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm text-slate-500">Order</p>
          <p className="font-mono text-xl font-semibold" data-testid="order-detail-id">{shortId(order.id)}</p>
          <p className="mt-1 text-sm text-slate-500">{fmtDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} testId="order-detail-status" />
          {order.status === "Placed" && (
            <Button
              variant="outline"
              className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm("Cancel this order?")) cancel.mutate();
              }}
              data-testid="cancel-order-button"
            >
              {cancel.isPending && <Loader2 className="size-4 animate-spin" />}
              Cancel order
            </Button>
          )}
        </div>
      </div>

      {order.status !== "Cancelled" && (
        <ol className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-6" data-testid="order-progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 transition-colors",
                  i <= stepIndex ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-400",
                )}
              >
                {i <= stepIndex ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-sm font-medium", i <= stepIndex ? "text-slate-900" : "text-slate-400")}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-semibold">Items</h2>
          <ul className="divide-y" data-testid="order-detail-items">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 py-3">
                <img src={getAssetImageUrl(it.image_url)} alt="" className="size-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${it.product_id}`} className="font-medium hover:underline">{it.name}</Link>
                  <p className="text-sm text-slate-500">Qty {it.quantity} × {inr(it.unit_price)}</p>
                </div>
                <span className="font-semibold tabular-nums">{inr(it.unit_price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-4 font-heading text-xl font-semibold">
            <span>Total</span>
            <span className="tabular-nums" data-testid="order-detail-total">{inr(order.total)}</span>
          </div>
        </section>
        <section className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery address</p>
            <p className="mt-1 whitespace-pre-line" data-testid="order-detail-address">{order.delivery_address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment</p>
            <p className="mt-1" data-testid="order-detail-payment">
              {order.payment_method === "cod" ? "Cash on delivery" : `Card •••• ${order.card_last4}`} · <span className="capitalize">{order.payment_status}</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900" data-testid="back-to-orders-link">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <RequireCustomer>
        <OrderView />
      </RequireCustomer>
    </div>
  );
}
