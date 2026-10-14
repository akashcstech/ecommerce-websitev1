import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderTree, IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import { StatusBadge } from "@/components/Badges";
import { apiGet } from "@/lib/api";
import { fmtDate, inr, shortId } from "@/lib/format";
import type { AdminStats, Order } from "@/lib/types";

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<AdminStats>("/admin/stats") });
  const orders = useQuery({ queryKey: ["admin", "orders", ""], queryFn: () => apiGet<Order[]>("/admin/orders") });
  const s = stats.isError ? undefined : stats.data;

  const cards = [
    { label: "Revenue", value: s ? inr(s.revenue) : "—", icon: IndianRupee, id: "revenue", accent: true },
    { label: "Orders", value: s?.orders ?? "—", icon: ShoppingCart, id: "orders" },
    { label: "Products", value: s?.products ?? "—", icon: Package, id: "products" },
    { label: "Customers", value: s?.customers ?? "—", icon: Users, id: "customers" },
    { label: "Categories", value: s?.categories ?? "—", icon: FolderTree, id: "categories" },
    { label: "Out of stock", value: s?.out_of_stock ?? "—", icon: AlertTriangle, id: "out-of-stock" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-500">
          {s ? `${s.placed_orders} order${s.placed_orders === 1 ? "" : "s"} waiting to ship.` : "Store overview"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={`animate-fade-up rounded-2xl border p-5 ${c.accent ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
            style={{ animationDelay: `${i * 40}ms` }}
            data-testid={`stat-${c.id}`}
          >
            <c.icon className={`size-5 ${c.accent ? "text-amber-400" : "text-slate-400"}`} />
            <p className={`mt-4 text-sm ${c.accent ? "text-slate-400" : "text-slate-500"}`}>{c.label}</p>
            <p className="font-heading text-3xl font-semibold tabular-nums" data-testid={`stat-${c.id}-value`}>{c.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-sky-700 hover:underline" data-testid="dashboard-view-all-orders">View all</Link>
        </div>
        <ul className="divide-y">
          {(orders.isError ? [] : (orders.data ?? [])).slice(0, 5).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="font-mono font-semibold">{shortId(o.id)}</span>
              <span className="text-slate-600">{o.user_name}</span>
              <span className="text-slate-400">{fmtDate(o.created_at)}</span>
              <span className="ml-auto font-semibold tabular-nums">{inr(o.total)}</span>
              <StatusBadge status={o.status} />
            </li>
          ))}
          {orders.data?.length === 0 && <li className="py-6 text-center text-slate-500">No orders yet.</li>}
        </ul>
      </section>
    </div>
  );
}
