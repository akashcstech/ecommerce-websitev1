import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Placed: "bg-amber-100 text-amber-900",
  Shipped: "bg-sky-100 text-sky-900",
  Delivered: "bg-green-100 text-green-900",
  Cancelled: "bg-red-100 text-red-900",
};

export function StatusBadge({ status, testId }: { status: OrderStatus; testId?: string }) {
  return (
    <span
      data-testid={testId}
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", STATUS_STYLES[status])}
    >
      {status}
    </span>
  );
}

export function StockBadge({ stock, testId }: { stock: number; testId?: string }) {
  const [label, style] =
    stock <= 0
      ? ["Out of stock", "bg-red-100 text-red-900"]
      : stock <= 5
        ? [`Only ${stock} left`, "bg-amber-100 text-amber-900"]
        : ["In stock", "bg-green-100 text-green-900"];
  return (
    <span data-testid={testId} className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", style)}>
      {label}
    </span>
  );
}
