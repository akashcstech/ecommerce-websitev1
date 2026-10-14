import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiDelete, apiPatch } from "@/lib/api";
import { errMsg, inr } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { Cart } from "@/lib/types";
import { useCart } from "@/hooks/useShop";

export default function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: cart } = useCart();

  const update = useMutation({
    mutationFn: (v: { id: string; quantity: number }) => apiPatch<Cart>(`/cart/items/${v.id}`, { quantity: v.quantity }),
    onSuccess: (c) => qc.setQueryData(["cart"], c),
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<Cart>(`/cart/items/${id}`),
    onSuccess: (c) => {
      qc.setQueryData(["cart"], c);
      toast.success("Removed from cart");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const items = cart?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" data-testid="cart-drawer">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-heading text-xl">Your cart</SheetTitle>
          <SheetDescription data-testid="cart-item-count">
            {cart?.count ?? 0} item{(cart?.count ?? 0) === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center" data-testid="cart-empty-state">
              <ShoppingBag className="size-10 text-slate-300" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Browse the catalogue and add something you love.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((it) => (
                <li key={it.id} className="flex gap-4 py-4" data-testid={`cart-item-${it.product_id}`}>
                  <img src={getAssetImageUrl(it.product.image_url)} alt={it.product.name} className="size-20 rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${it.product_id}`}
                        onClick={() => onOpenChange(false)}
                        className="line-clamp-2 text-sm font-medium hover:underline"
                      >
                        {it.product.name}
                      </Link>
                      <button
                        type="button"
                        aria-label="Remove item"
                        data-testid={`cart-remove-${it.product_id}`}
                        onClick={() => remove.mutate(it.id)}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          data-testid={`cart-decrease-${it.product_id}`}
                          disabled={it.quantity <= 1 || update.isPending}
                          onClick={() => update.mutate({ id: it.id, quantity: it.quantity - 1 })}
                          className="p-2 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums" data-testid={`cart-qty-${it.product_id}`}>
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          data-testid={`cart-increase-${it.product_id}`}
                          disabled={it.quantity >= it.product.stock || update.isPending}
                          onClick={() => update.mutate({ id: it.id, quantity: it.quantity + 1 })}
                          className="p-2 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{inr(it.line_total)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 border-t bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-heading text-xl font-semibold tabular-nums" data-testid="cart-total">
              {inr(cart?.total ?? 0)}
            </span>
          </div>
          {items.length > 0 ? (
            <Button
              className="h-11 w-full rounded-full text-base"
              data-testid="checkout-button"
              onClick={() => {
                onOpenChange(false);
                navigate("/checkout");
              }}
            >
              Checkout
            </Button>
          ) : (
            <Link to="/" onClick={() => onOpenChange(false)} className={buttonVariants({ variant: "outline", className: "h-11 w-full rounded-full" })}>
              Continue shopping
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
