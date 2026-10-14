import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Downloads main.txt — generated live by GET /api/main-txt from the real project files.
export default function DownloadMainButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  const onClick = () => {
    setBusy(true);
    toast.success("main.txt is downloading", {
      description: "Folder structure + every source file, freshly generated.",
    });
    window.setTimeout(() => setBusy(false), 1500);
  };

  return (
    <a
      href="/api/main-txt"
      download="main.txt"
      onClick={onClick}
      data-testid="download-main-txt-button"
      className={cn(
        "group inline-flex items-center gap-3 rounded-full bg-amber-500 px-6 py-3 font-heading text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-[background-color,transform,box-shadow] duration-200 hover:bg-amber-400 hover:shadow-amber-400/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        className,
      )}
    >
      <FileText className="size-5" aria-hidden />
      Download main.txt
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
      )}
    </a>
  );
}
