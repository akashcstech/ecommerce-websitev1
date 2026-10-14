import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/Badges";
import { apiGet, apiPatch } from "@/lib/api";
import { errMsg, fmtDate, inr, shortId } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [viewing, setViewing] = useState<Order | null>(null);

  const list = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: () => apiGet<Order[]>(`/admin/orders${filter ? `?status=${filter}` : ""}`),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: OrderStatus }) => apiPatch<Order>(`/admin/orders/${v.id}/status`, { status: v.status }),
    onSuccess: (o) => {
      toast.success(`Order ${shortId(o.id)} → ${o.status}`);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const orders = list.isError ? [] : (list.data ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="text-slate-500">Move orders through Placed → Shipped → Delivered, or cancel them.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s)}
            data-testid={`admin-orders-filter-${(s || "all").toLowerCase()}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400",
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} data-testid={`admin-order-row-${o.id}`}>
                <TableCell className="font-mono font-semibold">{shortId(o.id)}</TableCell>
                <TableCell>
                  <p className="font-medium">{o.user_name}</p>
                  <p className="text-xs text-slate-500">{o.user_email}</p>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{fmtDate(o.created_at)}</TableCell>
                <TableCell className="text-sm">
                  {o.payment_method === "cod" ? "COD" : `Card •••• ${o.card_last4}`}
                  <span className="block text-xs capitalize text-slate-500">{o.payment_status}</span>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{inr(o.total)}</TableCell>
                <TableCell>
                  {o.status === "Cancelled" ? (
                    <StatusBadge status="Cancelled" testId={`admin-order-status-${o.id}`} />
                  ) : (
                    <Select value={o.status} onValueChange={(v: string) => setStatus.mutate({ id: o.id, status: v as OrderStatus })}>
                      <SelectTrigger className="h-8 w-36" data-testid={`admin-order-status-select-${o.id}`}>
                        <SelectValue placeholder={o.status}>{o.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} data-testid={`admin-order-status-option-${s.toLowerCase()}`}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => setViewing(o)} aria-label="View order" data-testid={`admin-view-order-${o.id}`}>
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-slate-500" data-testid="admin-orders-empty">No orders.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="admin-order-dialog">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono">{shortId(viewing.id)}</span>
                  <StatusBadge status={viewing.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <ul className="divide-y">
                  {viewing.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 py-2">
                      <img src={getAssetImageUrl(it.image_url)} alt="" className="size-10 rounded-lg object-cover" />
                      <span className="flex-1">{it.name} × {it.quantity}</span>
                      <span className="tabular-nums">{inr(it.unit_price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{inr(viewing.total)}</span></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deliver to</p>
                  <p>{viewing.user_name} · {viewing.user_email}</p>
                  <p className="text-slate-600">{viewing.delivery_address}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
