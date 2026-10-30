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

/** Topic hues (globals.css) plus the semantic tones. */
export type Tone = "accent" | "info" | "warn" | "ok" | "neutral" | "copper" | "blue" | "teal" | "green" | "amber" | "plum" | "rose";
const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  neutral: "bg-sunk text-muted",
  copper: "bg-copper-soft text-copper-text",
  blue: "bg-blue-soft text-blue",
  teal: "bg-teal-soft text-teal",
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  plum: "bg-plum-soft text-plum",
  rose: "bg-rose-soft text-rose",
};
/** The tile classes of a tone (soft ground, coloured ink). */
export const TONE_TILE = TONE;
/** Just the icon colour of a tone, for icons drawn without a tile. */
export const TONE_TEXT: Record<Tone, string> = Object.fromEntries(Object.entries(TONE).map(([k, v]) => [k, v.split(" ")[1]])) as Record<Tone, string>;

/** Hues to cycle through for lists of features or steps. */
export const HUES: Tone[] = ["blue", "teal", "amber", "plum", "rose", "green"];

/** One hue per questionnaire step, keyed by section slug, so a section keeps its colour everywhere. */
export const SECTION_TONE: Record<string, Tone> = {
  "datos-personales": "blue",
  firma: "plum",
  "unidad-familiar": "rose",
  "asignacion-tributaria": "green",
  trabajo: "teal",
  inmuebles: "amber",
  "actividad-economica": "plum",
  "ventas-y-ganancias": "green",
  deducciones: "blue",
  observaciones: "teal",
  revisar: "accent",
};

/** One hue per destination (client portal and gestoría panel), by the route's first segment. */
const ROUTE_TONE: Record<string, Tone> = {
  inicio: "blue",
  declaracion: "teal",
  documentos: "amber",
  mensajes: "plum",
  resultado: "green",
  pago: "green",
  cita: "rose",
  historial: "copper",
  perfil: "blue",
  expedientes: "blue",
  panel: "plum",
  clientes: "teal",
  citas: "rose",
  cobros: "green",
  ajustes: "neutral",
};
export const routeTone = (href: string): Tone => ROUTE_TONE[href.split("/")[1] ?? ""] ?? "accent";

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
