import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartDrawer from "@/components/CartDrawer";
import { useCart, useMe } from "@/hooks/useShop";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { me } = useMe();
  const { data: cart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const navigate = useNavigate();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  };

  const count = cart?.count ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-900 font-heading text-sm font-bold text-white">B</span>
          <span className="hidden font-heading text-xl font-semibold tracking-tight sm:block">Bazaarline</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Shop", id: "shop" },
            { to: "/orders", label: "Orders", id: "orders" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              data-testid={`nav-link-${l.id}`}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="relative ml-auto hidden w-full max-w-xs sm:block" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            data-testid="nav-search-input"
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {me?.is_admin ? (
            <Link to="/admin" className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })} data-testid="nav-admin-panel-link">
              <LayoutDashboard className="size-4" /> Admin panel
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="Open cart"
              data-testid="cart-toggle-button"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute -right-0.5 -top-0.5 grid min-w-5 animate-pop place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-slate-950"
                  data-testid="cart-count-badge"
                >
                  {count}
                </span>
              )}
            </Button>
          )}

          {me ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:bg-slate-50"
                data-testid="user-menu-trigger"
              >
                <span className="grid size-7 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {me.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate sm:inline">{me.name.split(" ")[0]}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{me.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!me.is_admin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="user-menu-profile">
                      <UserIcon className="size-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/orders")} data-testid="user-menu-orders">
                      <Package className="size-4" /> My orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => void endSession("/")} data-testid="user-menu-logout">
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full" })} data-testid="nav-login-link">
                Log in
              </Link>
              <Link to="/register" className={buttonVariants({ size: "sm", className: "rounded-full px-4" })} data-testid="nav-register-link">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
