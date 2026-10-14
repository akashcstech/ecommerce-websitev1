import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CreditCard, Loader2, Lock, ShoppingBag } from "lucide-react";
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

/* ─── Order Confirmed Popup Modal ─────────────────────────────────────────── */
function OrderSuccessModal({
  open,
  order,
  onView,
  onShop,
}: {
  open: boolean;
  order: Order | null;
  onView: () => void;
  onShop: () => void;
}) {
  if (!open || !order) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      data-testid="order-success-modal"
    >
      {/* Background card with emerald gradient matching user image */}
      <div
        className="relative flex w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-[36px] px-8 py-10 text-white shadow-2xl animate-in zoom-in-95 duration-200"
        style={{
          background: "linear-gradient(165deg, #00966d 0%, #00875a 50%, #006e48 100%)",
        }}
      >
        {/* Floating confetti dots and capsules matching reference design */}
        {/* Top/Around Sprinkles */}
        <span className="absolute left-[48%] top-[10%] size-2.5 rounded-full bg-[#86efac] opacity-90" />
        <span className="absolute left-[22%] top-[18%] size-3 rounded-full bg-[#facc15] shadow-sm animate-pulse" />
        <span className="absolute right-[22%] top-[16%] h-2 w-7 rotate-[25deg] rounded-full bg-[#c084fc] opacity-85" />
        <span className="absolute right-[12%] top-[28%] size-3 rounded-full bg-[#fde047] opacity-90" />
        <span className="absolute left-[10%] top-[30%] h-2 w-8 -rotate-[35deg] rounded-full bg-[#38bdf8] opacity-85" />
        <span className="absolute left-[15%] top-[42%] size-2.5 rounded-full bg-[#fb7185] opacity-90" />
        <span className="absolute right-[14%] top-[38%] h-2 w-7 -rotate-[15deg] rounded-full bg-[#f472b6] opacity-85" />
        <span className="absolute left-[30%] top-[47%] size-2 rounded-full bg-[#facc15] opacity-80" />
        <span className="absolute right-[28%] top-[47%] size-2.5 rounded-full bg-[#86efac] opacity-90" />

        {/* Center Rosette Badge */}
        <div className="relative mb-6 mt-3 flex size-28 items-center justify-center">
          <svg viewBox="0 0 96 96" className="absolute inset-0 size-full drop-shadow-xl" fill="none">
            <path
              d="M48 4c2.4 0 4.6 1.4 5.7 3.5l2.5 4.7a6.4 6.4 0 0 0 5 3.3l5.3.5c2.4.2 4.4 1.8 5.1 4.1l1.5 5.1a6.4 6.4 0 0 0 3.6 4.3l4.8 2.2c2.2 1 3.4 3.3 3 5.7l-.9 5.3a6.4 6.4 0 0 0 1.6 5.5l3.6 3.9c1.6 1.8 1.8 4.4.4 6.4l-3 4.4a6.4 6.4 0 0 0-.7 5.7l1.8 5.1c.8 2.3-.1 4.8-2.1 6.1l-4.5 3a6.4 6.4 0 0 0-2.8 5.2l-.1 5.3c0 2.4-1.6 4.5-3.9 5.2l-5.1 1.5a6.4 6.4 0 0 0-4.3 3.6l-2.2 4.8c-1 2.2-3.3 3.4-5.7 3l-5.3-.9a6.4 6.4 0 0 0-5.5 1.6l-3.9 3.6c-1.8 1.6-4.4 1.8-6.4.4l-4.4-3a6.4 6.4 0 0 0-5.7-.7l-5.1 1.8c-2.3.8-4.8-.1-6.1-2.1l-3-4.5a6.4 6.4 0 0 0-5.2-2.8l-5.3-.1c-2.4 0-4.5-1.6-5.2-3.9l-1.5-5.1a6.4 6.4 0 0 0-3.6-4.3l-4.8-2.2c-2.2-1-3.4-3.3-3-5.7l.9-5.3a6.4 6.4 0 0 0-1.6-5.5l-3.6-3.9c-1.6-1.8-1.8-4.4-.4-6.4l3-4.4a6.4 6.4 0 0 0 .7-5.7l-1.8-5.1c-.8-2.3.1-4.8 2.1-6.1l4.5-3a6.4 6.4 0 0 0 2.8-5.2l.1-5.3c0-2.4 1.6-4.5 3.9-5.2l5.1-1.5a6.4 6.4 0 0 0 4.3-3.6l2.2-4.8c1-2.2 3.3-3.4 5.7-3l5.3.9a6.4 6.4 0 0 0 5.5-1.6l3.9-3.6C43.6 4.2 46.2 4 48 4Z"
              fill="white"
            />
          </svg>
          <span className="relative z-10 text-4xl font-black" style={{ color: "#00875a" }}>
            %
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Order Confirmed!
          </h2>
          <p className="text-base font-semibold text-emerald-100">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-sm font-medium text-white/85">
            Total {inr(order.total)} • Free delivery applied 🎉
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col gap-3">
          <Button
            onClick={onShop}
            className="h-12 w-full rounded-2xl bg-white text-base font-bold shadow-lg transition-transform hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
            style={{ color: "#00875a" }}
            data-testid="order-success-shop-btn"
          >
            <ShoppingBag className="mr-2 size-5" />
            Continue Shopping
          </Button>
          <button
            type="button"
            onClick={onView}
            className="py-1 text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline transition-colors"
            data-testid="order-success-view-btn"
          >
            View my order →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Checkout Form ──────────────────────────────────────────────────────── */
function CheckoutForm() {
  const { me } = useMe();
  const { data: cart, isLoading } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [address, setAddress] = useState(me?.address ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [card, setCard] = useState({ holder: me?.name ?? "", number: "", expiry: "", cvv: "" });
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const place = useMutation({
    mutationFn: (body: CheckoutInput) => apiPost<Order>("/orders/checkout", body),
    onSuccess: (order) => {
      // Invalidate queries in background
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      // Set success order to immediately show the popup!
      setSuccessOrder(order);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const handleShop = () => {
    qc.setQueryData(["cart"], { items: [], total: 0, count: 0 });
    qc.invalidateQueries({ queryKey: ["cart"] });
    navigate("/");
  };

  const handleViewOrder = () => {
    qc.setQueryData(["cart"], { items: [], total: 0, count: 0 });
    qc.invalidateQueries({ queryKey: ["cart"] });
    if (successOrder) {
      navigate(`/orders/${successOrder.id}?placed=1`);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 10) {
      toast.error("Please enter a complete delivery address (at least 10 characters)");
      document.getElementById("address")?.focus();
      return;
    }
    if (method === "card") {
      if (!card.holder.trim()) {
        toast.error("Please enter the name on your card");
        document.getElementById("holder")?.focus();
        return;
      }
      const rawNumber = card.number.replace(/\s+/g, "");
      if (rawNumber.length < 12) {
        toast.error("Please enter a valid card number");
        document.getElementById("cardnum")?.focus();
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
        toast.error("Please enter a valid card expiry (MM/YY)");
        document.getElementById("expiry")?.focus();
        return;
      }
      if (!/^\d{3,4}$/.test(card.cvv)) {
        toast.error("Please enter a valid CVV (3 or 4 digits)");
        document.getElementById("cvv")?.focus();
        return;
      }
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

  // If order was placed, display the success popup immediately!
  if (successOrder) {
    return (
      <div className="relative min-h-[50vh] flex items-center justify-center">
        <OrderSuccessModal
          open={true}
          order={successOrder}
          onView={handleViewOrder}
          onShop={handleShop}
        />
      </div>
    );
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

  const addressEmpty = address.trim().length < 10;
  const addressMissing = addressEmpty;

  return (
    <>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">

          {/* Delivery address */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">1. Delivery address</h2>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                Full address
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, area, city, PIN code"
                data-testid="checkout-address-input"
                className={cn(
                  "transition-colors",
                  addressEmpty && address.length > 0
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                )}
              />
              {addressEmpty && address.length > 0 && (
                <p className="text-xs text-red-500">Please enter a complete delivery address (min 10 characters).</p>
              )}
            </div>
          </section>

          {/* Payment method */}
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
                  <Label htmlFor="holder" className="flex items-center gap-1">Name on card <span className="text-red-500">*</span></Label>
                  <Input id="holder" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} data-testid="card-holder-input" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cardnum" className="flex items-center gap-1">Card number <span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="expiry" className="flex items-center gap-1">Expiry (MM/YY) <span className="text-red-500">*</span></Label>
                  <Input id="expiry" placeholder="12/29" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} className="font-mono" data-testid="card-expiry-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="flex items-center gap-1">CVV <span className="text-red-500">*</span></Label>
                  <Input id="cvv" type="password" inputMode="numeric" placeholder="123" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="font-mono" data-testid="card-cvv-input" />
                </div>
                <p className="flex items-center gap-1.5 text-xs text-slate-500 sm:col-span-2">
                  <Lock className="size-3" /> Simulated payment — no real charge, card details are never stored. Cards ending in 0000 are declined.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Order summary */}
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

          {addressMissing && (
            <p className="text-xs text-red-500 text-center">
              Please enter a delivery address to continue.
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-full text-base"
            disabled={place.isPending}
            data-testid="place-order-button"
          >
            {place.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {method === "card" ? `Pay ${inr(cart.total)} & place order` : "Place order"}
          </Button>
        </aside>
      </form>

      {/* Success popup */}
      <OrderSuccessModal
        open={successOrder !== null}
        order={successOrder}
        onView={handleViewOrder}
        onShop={handleShop}
      />
    </>
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
