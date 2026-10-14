import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-28 text-center" data-testid="not-found-page">
      <p className="font-mono text-sm text-slate-500">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className={buttonVariants({ className: "rounded-full" })}>Back to shop</Link>
    </div>
  );
}
