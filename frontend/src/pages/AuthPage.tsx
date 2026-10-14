import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { errMsg } from "@/lib/format";
import { queryClient } from "@/lib/queryClient";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";

export type AuthMode = "login" | "register" | "admin";

const COPY: Record<AuthMode, { title: string; sub: string; cta: string; endpoint: string }> = {
  login: { title: "Welcome back", sub: "Log in to see your cart and orders.", cta: "Log in", endpoint: "/auth/login" },
  register: { title: "Create your account", sub: "It takes less than a minute.", cta: "Create account", endpoint: "/auth/register" },
  admin: { title: "Admin sign in", sub: "Staff access to catalogue, orders and customers.", cta: "Sign in to admin", endpoint: "/auth/admin/login" },
};

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const copy = COPY[mode];

  const submit = useMutation({
    mutationFn: () =>
      apiPost<User>(copy.endpoint, mode === "register" ? form : { email: form.email, password: form.password }),
    onSuccess: (user) => {
      beginSession();
      queryClient.setQueryData(["me"], user);
      toast.success(mode === "register" ? `Welcome, ${user.name.split(" ")[0]}!` : "Logged in");
      navigate(mode === "admin" ? "/admin" : (params.get("next") ?? "/"), { replace: true });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid-texture">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden space-y-6 lg:block">
          {mode === "admin" ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <ShieldCheck className="size-3.5" /> Staff only
              </span>
              <h1 className="text-5xl font-semibold leading-tight">Run the store from one place.</h1>
              <p className="max-w-md text-lg text-slate-600">Update prices and stock, move orders from Placed to Delivered, and manage customer accounts.</p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-semibold leading-tight">
                Shop smarter.
                <br />
                <span className="text-slate-500">Order in three clicks.</span>
              </h1>
              <ul className="space-y-3 text-slate-700">
                <li>✓ Your cart is saved to your account</li>
                <li>✓ Live price and stock on every product</li>
                <li>✓ Track and cancel orders anytime while Placed</li>
              </ul>
            </>
          )}
        </div>

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            submit.mutate();
          }}
          className="mx-auto w-full max-w-md animate-fade-up space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-md"
          data-testid={`${mode}-form`}
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{copy.title}</h2>
            <p className="text-sm text-slate-500">{copy.sub}</p>
          </div>

          {mode === "register" && (
            <>
              <Field id="name" label="Full name">
                <Input id="name" required value={form.name} onChange={set("name")} autoComplete="name" data-testid="register-name-input" />
              </Field>
              <Field id="phone" label="Phone">
                <Input id="phone" required value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="98765 43210" data-testid="register-phone-input" />
              </Field>
            </>
          )}
          <Field id="email" label="Email">
            <Input id="email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" data-testid={`${mode}-email-input`} />
          </Field>
          <Field id="password" label={mode === "register" ? "Password (min 6 characters)" : "Password"}>
            <Input
              id="password"
              type="password"
              required
              minLength={mode === "register" ? 6 : 1}
              value={form.password}
              onChange={set("password")}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              data-testid={`${mode}-password-input`}
            />
          </Field>

          <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={submit.isPending} data-testid={`${mode}-submit-button`}>
            {submit.isPending && <Loader2 className="size-4 animate-spin" />}
            {copy.cta}
          </Button>

          {mode === "login" && (
            <p className="text-center text-sm text-slate-600">
              New here? <Link to={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next") ?? "")}` : ""}`} className="font-medium text-sky-700 hover:underline" data-testid="go-register-link">Create an account</Link>
            </p>
          )}
          {mode === "register" && (
            <p className="text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="font-medium text-sky-700 hover:underline" data-testid="go-login-link">Log in</Link>
            </p>
          )}
          {mode === "admin" ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500" data-testid="admin-credentials-hint">
              Demo admin: admin@store.com / admin123
            </p>
          ) : (
            <p className="text-center text-xs text-slate-500">
              Store staff? <Link to="/admin/login" className="text-sky-700 hover:underline" data-testid="go-admin-login-link">Admin login</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
