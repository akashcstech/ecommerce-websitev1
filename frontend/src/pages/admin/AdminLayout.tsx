import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { FolderTree, LayoutDashboard, Loader2, LogOut, Package, ShoppingCart, Store, Users } from "lucide-react";
import Footer from "@/components/Footer";
import { useMe } from "@/hooks/useShop";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, id: "dashboard", end: true },
  { to: "/admin/products", label: "Products", icon: Package, id: "products", end: false },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, id: "categories", end: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, id: "orders", end: false },
  { to: "/admin/customers", label: "Customers", icon: Users, id: "customers", end: false },
];

export default function AdminLayout() {
  const { me, isLoading } = useMe();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-slate-400" /></div>;
  }
  if (!me || !me.is_admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span className="grid size-7 place-items-center rounded-md bg-amber-500 font-heading text-xs font-bold text-slate-950">B</span>
          <span className="font-heading font-semibold">Bazaarline Admin</span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-slate-400 sm:inline" data-testid="admin-user-email">{me.email}</span>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white" data-testid="admin-view-store-link">
              <Store className="size-4" /> Store
            </Link>
            <button
              type="button"
              onClick={() => void endSession("/admin/login")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              data-testid="admin-logout-button"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col" aria-label="Admin">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.id}`}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white hover:text-slate-900",
                )
              }
            >
              <l.icon className="size-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1 pb-10">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
