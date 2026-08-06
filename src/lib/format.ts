import type { Money } from "@/types/models";

/** Nigerian Naira, no decimals. Only for values the backend hasn't already formatted. */
export function formatNaira(amount: number | null | undefined): string {
  const n = typeof amount === "number" ? amount : 0;
  return "\u20A6" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

/** Renders a MoneyDto. The backend already formats it \u2014 never recompute this client-side. */
export function formatMoney(money: Money | null | undefined): string {
  return money?.formatted ?? "\u20A60";
}

/** Converts a whole-naira admin form input into the kobo integer the backend expects. */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Converts a kobo integer into whole naira, for pre-filling an admin form input. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
