"use client";

import type { ReactNode } from "react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "@/components/ui/primitives";

/*
 * Workspace page structure (design system › Navigation, .pr-pagehead, .pr-chip).
 * Every gestoría page is: TopBar (breadcrumbs) → PageHead → toolbar (Chips,
 * search, selects) → content (table, panels or EmptyState). Titles in the
 * workspace are sans; the only serif is the client's name on the case page.
 */

/**
 * Page title (24/30 sans), an optional one-line intro, and the page's actions on the right.
 * Every page carries the campaign tag ("Renta 2026") unless it passes its own.
 */
export function PageHead({ title, intro, eyebrow, actions }: { title: string; intro?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  const { t } = useI18n();
  eyebrow ??= t.list.eyebrow(EJERCICIO);
  // Phones: two columns; the eyebrow tight over the title on the left, the page's actions on the
  // right, centred on that pair (the intro, if any, runs full width below).
  // From sm: the title block on the left and the actions at its foot on the right, as before.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-3">
      <div className="flex min-w-0 flex-col items-start gap-1 sm:block">
        {eyebrow && <p className="eyebrow-tag sm:mb-2">{eyebrow}</p>}
        <h1 className="min-w-0 text-[22px] leading-7 font-semibold tracking-[-0.01em] sm:text-[24px] sm:leading-[30px]">{title}</h1>
        {intro && <p className="max-w-[68ch] text-[14px] leading-[21px] text-muted max-sm:hidden sm:mt-1">{intro}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 sm:flex-wrap">{actions}</div>}
      {/* phones: the intro under both columns, full width */}
      {intro && <p className="col-span-2 text-[13.5px] leading-5 text-muted sm:hidden">{intro}</p>}
    </div>
  );
}

/** A set of mutually exclusive views (at most five). */
/** `scroll`: on phones the views stay on one slim line that snaps sideways, clipped at the page gutter. */
export function Chips({ label, scroll, children }: { label: string; scroll?: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-wrap gap-2", scroll && "no-scrollbar max-sm:basis-full max-sm:snap-x max-sm:snap-mandatory max-sm:flex-nowrap max-sm:gap-1.5 max-sm:overflow-x-auto max-sm:[&>*]:h-9 max-sm:[&>*]:shrink-0 max-sm:[&>*]:snap-start max-sm:[&>*]:px-3 max-sm:[&>*]:text-[13px]")}>
      {children}
    </div>
  );
}

/** One view: a toggle button with its count, as tall as a field so a toolbar lines up. `alert` paints the count copper (needs the gestoría). */
export function Chip({ on, count, alert, onClick, children }: { on: boolean; count?: number; alert?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "inline-flex h-(--control-h) items-center gap-2 rounded-md border px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors",
        on ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-surface text-ink hover:bg-hover",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cx("figures min-w-5 rounded-sm px-1 text-center text-[12px] font-semibold", on ? "bg-accent-ink/15" : alert && count ? "bg-copper text-accent-ink" : "bg-sunk text-muted")}>{count}</span>
      )}
    </button>
  );
}
