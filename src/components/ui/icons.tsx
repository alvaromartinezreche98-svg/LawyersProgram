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

/**
 * Icon colour rule: every icon is in the firm's brand colour (navy ink on a
 * navy-soft tile, tokens --icon / --icon-soft in globals.css). Colour changes
 * only when the icon reports something:
 *   accent   brand: features, steps, sections, destinations (the default)
 *   ok/warn/info  a state (done, needs attention, in progress)
 *   copper   the gestoría asks the client for something
 *   neutral  empty, inactive or not available
 *   chrome   the same icons on the navy workspace sidebar
 *   copperSolid  the current destination in the workspace sidebar
 */
export type Tone = "accent" | "info" | "warn" | "ok" | "neutral" | "copper" | "chrome" | "copperSolid";
const TONE: Record<Tone, string> = {
  accent: "bg-icon-soft text-icon",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-sunk text-muted",
  copper: "bg-copper-soft text-copper-text",
  chrome: "bg-chrome-tile text-chrome-ink ring-0!",
  copperSolid: "bg-copper text-accent-ink ring-0!",
};
/** The tile classes of a tone (soft ground, coloured ink). */
export const TONE_TILE = TONE;

/** An icon on a soft rounded tile. */
export function IconTile({ icon: Icon, tone = "accent", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const box = size === "xs" ? "size-7 rounded-md" : size === "sm" ? "size-8 rounded-lg" : size === "lg" ? "size-12 rounded-xl" : "size-10 rounded-lg";
  const px = size === "xs" ? 15 : size === "sm" ? 17 : size === "lg" ? 25 : 21;
  return (
    <span className={cx("grid shrink-0 place-items-center ring-1 ring-current/15 ring-inset", box, TONE[tone], className)}>
      <Icon size={px} strokeWidth={2.1} aria-hidden="true" />
    </span>
  );
}
