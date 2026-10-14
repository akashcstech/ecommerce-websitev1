import { format } from "date-fns";
import { ApiError } from "./api";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const inr = (value: number) => inrFormatter.format(value);

export const fmtDate = (iso: string) => format(new Date(iso), "dd MMM yyyy, hh:mm a");

export const shortId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

// Turns FastAPI error bodies ({detail: string} or 422 {detail: [...]}) into a readable message.
export function errMsg(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail.length > 0) {
      const first = body.detail[0] as { msg?: string; loc?: unknown[] };
      const field = first.loc ? String(first.loc[first.loc.length - 1]).replace(/_/g, " ") : "";
      return field ? `${field}: ${first.msg ?? "invalid"}` : (first.msg ?? fallback);
    }
  }
  return fallback;
}
