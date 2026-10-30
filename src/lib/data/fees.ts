import { asItems, asText } from "@/lib/questionnaire/progress";
import type { Expediente, Firm } from "./types";

/** "60", "60,50" or "1.200,00" → 60, 60.5, 1200. Empty or invalid → null. */
export function parseEuros(v: string): number | null {
  const s = v.trim().replace(/\s|€/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export const fmtEuros = (n: number, locale: string) => n.toLocaleString(locale, { style: "currency", currency: "EUR" });

export interface FeeLine {
  key: "base" | "perProperty" | "selfEmployed";
  qty: number;
  amount: number;
}

/**
 * The fee for one case from the firm's rates: the base fee, plus the per-property
 * rate for each rented property, plus the self-employment rate if the client had
 * an activity. Null while the firm has not set a base fee.
 */
export function feeFor(e: Expediente, firm: Firm): { lines: FeeLine[]; total: number } | null {
  const base = parseEuros(firm.fees.base);
  if (base === null) return null;
  const lines: FeeLine[] = [{ key: "base", qty: 1, amount: base }];
  const rented = asText(e.answers.tiene_inm) === "si" ? asItems(e.answers.inm).filter((i) => asText(i.alquilado) === "si").length : 0;
  const per = parseEuros(firm.fees.perProperty);
  if (rented && per) lines.push({ key: "perProperty", qty: rented, amount: per * rented });
  const self = parseEuros(firm.fees.selfEmployed);
  if (asText(e.answers.actividad) === "si" && self) lines.push({ key: "selfEmployed", qty: 1, amount: self });
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}
