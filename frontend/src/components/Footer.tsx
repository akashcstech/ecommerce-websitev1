import { Link } from "react-router-dom";
import DownloadMainButton from "@/components/DownloadMainButton";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#0B1120] text-slate-100" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-heading text-2xl font-semibold tracking-tight">Bazaarline</p>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            Everyday essentials, honest prices and real-time stock. Order in a few clicks, pay on delivery or by card.
          </p>
        </div>
        <nav className="space-y-3 text-sm" aria-label="Shop">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Shop</p>
          <Link to="/" className="block text-slate-300 transition-colors hover:text-sky-400" data-testid="footer-link-shop">All products</Link>
          <Link to="/orders" className="block text-slate-300 transition-colors hover:text-sky-400" data-testid="footer-link-orders">My orders</Link>
          <Link to="/profile" className="block text-slate-300 transition-colors hover:text-sky-400" data-testid="footer-link-profile">My profile</Link>
        </nav>
        <nav className="space-y-3 text-sm" aria-label="Store">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Store</p>
          <Link to="/admin/login" className="block text-slate-300 transition-colors hover:text-sky-400" data-testid="footer-link-admin">Admin login</Link>
          <span className="block text-slate-400">Cash on delivery available</span>
          <span className="block text-slate-400">Simulated card payments</span>
        </nav>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-heading text-lg font-semibold">Get the full source code</p>
            <p className="text-sm text-slate-400" data-testid="download-main-txt-hint">
              main.txt contains the root folder structure, then every file as FILE NAME → COPYPASTE → CODE -END.
            </p>
          </div>
          <DownloadMainButton />
        </div>
        <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Bazaarline. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
