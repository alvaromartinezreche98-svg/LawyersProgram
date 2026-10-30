import {
  BriefcaseBusiness,
  ClipboardCheck,
  FileSignature,
  HandHeart,
  House,
  MessageSquareText,
  ReceiptText,
  Store,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cx } from "./primitives";

/** One icon per questionnaire step, keyed by section slug. */
export const SECTION_ICON: Record<string, LucideIcon> = {
  "datos-personales": UserRound,
  firma: FileSignature,
  "unidad-familiar": Users,
  "asignacion-tributaria": HandHeart,
  trabajo: BriefcaseBusiness,
  inmuebles: House,
  "actividad-economica": Store,
  "ventas-y-ganancias": TrendingUp,
  deducciones: ReceiptText,
  observaciones: MessageSquareText,
  revisar: ClipboardCheck,
};

type Tone = "accent" | "info" | "warn" | "ok" | "neutral" | "copper";
const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-sunk text-muted",
  copper: "bg-copper-soft text-copper-text",
};

/** An icon on a soft rounded tile. */
export function IconTile({ icon: Icon, tone = "accent", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = size === "sm" ? "size-8 rounded-lg" : size === "lg" ? "size-12 rounded-2xl" : "size-10 rounded-xl";
  const px = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  return (
    <span className={cx("grid shrink-0 place-items-center", box, TONE[tone], className)}>
      <Icon size={px} strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
}
