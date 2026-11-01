"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, ClipboardList, Eye, Info, PencilLine, Send, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Status } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { IconTile } from "./icons";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";
const BTN: Record<Variant, string> = {
  primary: "btn-fx-primary border-accent bg-accent text-accent-ink hover:border-accent-hover hover:bg-accent-hover",
  secondary: "btn-fx-soft border-transparent bg-accent-soft text-accent hover:bg-accent-soft-hover",
  // White on a navy band (footer, contact column).
  inverse: "btn-fx-inverse border-white bg-white text-accent hover:border-accent-soft hover:bg-accent-soft",
  // Secondary action next to a primary one: white with a real edge.
  outline: "border-line-strong bg-surface text-ink shadow-sm hover:border-accent hover:text-accent",
  ghost: "border-transparent bg-transparent text-accent hover:bg-accent-soft",
  danger: "border-transparent bg-transparent text-bad hover:bg-bad-soft",
};
const SIZE: Record<Size, string> = {
  sm: "h-(--control-h-sm) px-3 text-[13px]",
  md: "h-(--control-h) px-4 text-[14px]",
  lg: "h-(--control-h-lg) px-5 text-[15px]",
};
const btnClass = (variant: Variant, size: Size, extra?: string) =>
  cx(
    // Hover and press feedback come from .btn-fx (globals.css), shared with hand-made buttons.
    "btn-fx inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
    SIZE[size],
    BTN[variant],
    extra,
  );

/**
 * Variants: primary, secondary (tonal), ghost (text), danger (destructive), inverse (on the navy band).
 * `loading` keeps the label, adds a spinner, sets aria-busy and blocks a second press.
 */
export function Button({ variant = "secondary", size = "md", className, loading, disabled, children, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type="button" className={btnClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...p}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "secondary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btnClass(variant, size, className)} {...p} />;
}

/* ---------- Surfaces ---------- */

/** Card padding, one of the box insets (globals.css): `card` by default, `lg` for a page's lead card, `none` when a table or list runs edge to edge. */
const CARD_PAD = { card: "pad-card", lg: "pad-card-lg", tile: "pad-tile", none: "" } as const;

export function Card({ className, pad = "card", ...p }: ComponentProps<"div"> & { pad?: keyof typeof CARD_PAD }) {
  return <div className={cx("min-w-0 rounded-xl border border-line bg-surface shadow-sheet", CARD_PAD[pad], className)} {...p} />;
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <h3 className="display-tight mb-4 flex items-baseline justify-between gap-2 text-[15px] font-semibold">
      <span>{children}</span>
      {aside != null && <small className="font-sans text-xs font-normal tracking-normal text-muted">{aside}</small>}
    </h3>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="t-eyebrow text-accent">{children}</p>;
}

export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cx("h-1.5 overflow-clip rounded-sm bg-line", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i className="block h-full bg-accent motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Tags, status, notices ---------- */

type Tone = "neutral" | "info" | "warn" | "ok" | "bad" | "accent" | "copper";
const TONE: Record<Tone, string> = {
  neutral: "border-line bg-sunk text-muted",
  info: "border-info/25 bg-info-soft text-info",
  warn: "border-warn/25 bg-warn-soft text-warn",
  ok: "border-ok/25 bg-ok-soft text-ok",
  bad: "border-bad/25 bg-bad-soft text-bad",
  accent: "border-accent/20 bg-accent-soft text-accent",
  /** Only for what the gestoría asked of the client. */
  copper: "border-copper/30 bg-copper-soft text-copper-text",
};

/** Compact label for states and counts. Pair colour with text (and an icon where it helps). */
export function Pill({ tone = "neutral", icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    // One fixed height and padding for every status/identity label, with or without an icon, so they line up in tables.
    <span className={cx("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-sm border px-2 align-middle text-[12px] leading-none font-medium whitespace-nowrap", TONE[tone], className)}>
      {Icon && <Icon size={12} strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </span>
  );
}

const STATUS: Record<Status, { tone: Tone; icon: LucideIcon }> = {
  borrador: { tone: "neutral", icon: PencilLine },
  enviado: { tone: "info", icon: Send },
  revision: { tone: "info", icon: Eye },
  listo: { tone: "ok", icon: CircleCheck },
};
export function StatusPill({ status }: { status: Status }) {
  const { status: label } = useI18n();
  return (
    <Pill tone={STATUS[status].tone} icon={STATUS[status].icon}>
      {label(status)}
    </Pill>
  );
}

type NoticeTone = "info" | "ok" | "bad" | "warn" | "copper";
const NOTICE_ICON: Record<NoticeTone, LucideIcon> = { info: Info, ok: CircleCheck, bad: CircleAlert, warn: TriangleAlert, copper: ClipboardList };

const NOTICE_BG: Record<NoticeTone, string> = { info: "border border-line bg-surface shadow-[inset_3px_0_0_var(--accent)]", ok: "bg-ok-soft", bad: "bg-bad-soft", warn: "bg-warn-soft", copper: "bg-copper-soft" };
const NOTICE_FG: Record<NoticeTone, string> = { info: "text-accent", ok: "text-ok", bad: "text-bad", warn: "text-warn", copper: "text-copper-text" };

/**
 * Alert (design system › Feedback): chosen by meaning, an icon and, when it
 * helps, a bold title, so colour is never the only signal. Failures are role=alert.
 */
export function Notice({ tone = "info", icon = true, title, actions, children, className }: { tone?: NoticeTone; icon?: boolean; title?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = NOTICE_ICON[tone];
  return (
    <div role={tone === "bad" ? "alert" : undefined} className={cx("grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md px-4 py-3 text-[14.5px] text-ink", NOTICE_BG[tone], !icon && "grid-cols-1", className)}>
      {icon && <Icon size={18} strokeWidth={2} className={cx("mt-px shrink-0", NOTICE_FG[tone])} aria-hidden="true" />}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(!!title && "text-ink/85")}>{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Unread count: copper, the gestoría's colour (navigation only). */
export function Badge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="figures inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-copper px-1.5 text-[11px] font-semibold text-surface">{n}</span>;
}

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <p role="status" className="flex items-center gap-2.5 py-10 text-[14px] text-muted">
      <span className="size-4 motion-safe:animate-spin motion-reduce:animate-pulse rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
      {label ?? t.common.loading}
    </p>
  );
}

/**
 * Empty state (design system › Feedback): why it is empty and what fills it, in a dashed frame.
 * `inset` when it already sits inside a bordered box (a card, a table): that box is the frame.
 */
/** `center`: a whole page with nothing to show yet; larger mark, centred, room for an action under the text. */
export function EmptyState({ icon: Icon, title, children, tone = "neutral", inset, center }: { icon: LucideIcon; title: string; children?: ReactNode; tone?: "neutral" | "ok"; inset?: boolean; center?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-2 text-muted", center ? "items-center px-6 py-12 text-center sm:py-16" : "items-start p-6", !inset && "rounded-xl border border-dashed border-line-strong")}>
      <IconTile icon={Icon} tone={tone === "ok" ? "ok" : "accent"} size={center ? "lg" : "md"} className={center ? "mb-2" : undefined} />
      <p className={cx("font-semibold text-ink", center ? "text-[17px]" : "text-[15px]")}>{title}</p>
      {children && <div className={cx("max-w-[52ch] text-[14px]", center && "flex flex-col items-center gap-4")}>{children}</div>}
    </div>
  );
}

export function Brand({ sub }: { sub?: string }) {
  return (
    <span className="flex items-baseline gap-2.5">
      <b className="display-tight text-[19px] font-semibold">
        Pre<span className="text-copper-text">Renta</span>
      </b>
      {sub && <span className="t-label hidden font-normal sm:inline">{sub}</span>}
    </span>
  );
}

export { cx };
