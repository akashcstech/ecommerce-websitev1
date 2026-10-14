import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useMe } from "@/hooks/useShop";

// Customer-only area: guests go to /login, admins get pointed to the admin panel.
export default function RequireCustomer({ children }: { children: ReactNode }) {
  const { me, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center" data-testid="auth-loading">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (me.is_admin) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center" data-testid="admin-not-customer">
        <h1 className="text-2xl font-semibold">This page is for customers</h1>
        <p className="text-muted-foreground">You are signed in as an administrator.</p>
        <Link to="/admin" className={buttonVariants({ className: "rounded-full" })}>Go to admin panel</Link>
      </div>
    );
  }
  return <>{children}</>;
}
