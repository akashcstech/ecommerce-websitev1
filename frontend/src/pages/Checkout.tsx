import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CreditCard, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RequireCustomer from "@/components/RequireCustomer";
import { useCart, useMe } from "@/hooks/useShop";
import { apiPost } from "@/lib/api";
import { errMsg, inr } from "@/lib/format";
import { getAssetImageUrl } from "@/lib/assets";
import type { CheckoutInput, Order, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

function CheckoutForm() {
  const { me } = useMe();
  const { data: cart, isLoading } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [address, setAddress] = useState(me?.address ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [card, setCard] = useState({ holder: me?.name ?? "", number: "", expiry: "", cvv: "" });

  const place = useMutation({
    mutationFn: (body: CheckoutInput) => apiPost<Order>("/orders/checkout", body),
    onSuccess: (order) => {
      qc.setQueryData(["cart"], { items: [], total: 0, count: 0 });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Order placed successfully!");
      navigate(`/orders/${order.id}?placed=1`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 10) {
      toast.error("Please enter a complete delivery address (at least 10 characters)");
      return;
    }
    place.mutate({
      delivery_address: address.trim(),
      payment_method: method,
      card: method === "card" ? card : null,
    });
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  if (isLoading) {
    return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="size-6 animate-spin text-slate-400" /></div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-24 text-center" data-testid="checkout-empty-state">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-slate-500">Add a few products before checking out.</p>
        <Link to="/" className={buttonVariants({ className: "rounded-full" })}>Browse products</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">1. Delivery address</h2>
          <div className="space-y-2">
            <Label htmlFor="address">Full address</Label>
            <Textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House no, street, area, city, PIN code"
              data-testid="checkout-address-input"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">2. Payment method</h2>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {([
              { id: "cod", label: "Cash on delivery", desc: "Pay when it arrives", icon: Banknote },
              { id: "card", label: "Card (simulated)", desc: "Instant test payment", icon: CreditCard },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => setMethod(m.id)}
                data-testid={`payment-method-${m.id}`}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200",
                  method === m.id ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-400",
                )}
              >
                <m.icon className="mt-0.5 size-5" />
                <span>
                  <span className="block font-medium">{m.label}</span>
                  <span className="block text-sm text-slate-500">{m.desc}</span>
                </span>
              </button>
            ))}
          </div>

          {method === "card" && (
            <div className="grid animate-fade-up gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:grid-cols-2" data-testid="card-form">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="holder">Name on card</Label>
                <Input id="holder" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} data-testid="card-holder-input" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cardnum">Card number</Label>
                <Input
                  id="cardnum"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                  className="font-mono"
                  data-testid="card-number-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                <Input id="expiry" placeholder="12/29" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} className="font-mono" data-testid="card-expiry-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" type="password" inputMode="numeric" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="font-mono" data-testid="card-cvv-input" />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 sm:col-span-2">
                <Lock className="size-3" /> Simulated payment — no real charge, card details are never stored. Cards ending in 0000 are declined.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-semibold">Order summary</h2>
        <ul className="divide-y" data-testid="checkout-items">
          {cart.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <img src={getAssetImageUrl(it.product.image_url)} alt="" className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.product.name}</p>
                <p className="text-xs text-slate-500">Qty {it.quantity} × {inr(it.product.price)}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{inr(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{inr(cart.total)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="text-green-700">Free</span></div>
          <div className="flex justify-between pt-2 font-heading text-xl font-semibold">
            <span>Total</span>
            <span className="tabular-nums" data-testid="checkout-total">{inr(cart.total)}</span>
          </div>
        </div>
        <Button type="submit" className="h-12 w-full rounded-full text-base" disabled={place.isPending} data-testid="place-order-button">
          {place.isPending && <Loader2 className="size-4 animate-spin" />}
          {method === "card" ? `Pay ${inr(cart.total)} & place order` : "Place order"}
        </Button>
      </aside>
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Checkout</h1>
      <RequireCustomer>
        <CheckoutForm />
      </RequireCustomer>
    </div>
  );
}
