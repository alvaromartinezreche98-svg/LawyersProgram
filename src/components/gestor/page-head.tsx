import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/*
 * Workspace page structure (design system › Navigation, .pr-pagehead, .pr-chip).
 * Every gestoría page is: TopBar (breadcrumbs) → PageHead → toolbar (Chips,
 * search, selects) → content (table, panels or EmptyState). Titles in the
 * workspace are sans; the only serif is the client's name on the case page.
 */

/** Page title (24/30 sans), an optional one-line intro, and the page's actions on the right. */
export function PageHead({ title, intro, eyebrow, actions }: { title: string; intro?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold tracking-[.08em] text-muted uppercase">
            <span className="h-[3px] w-5 rounded-full bg-copper" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.01em]">{title}</h1>
        {intro && <p className="mt-1 max-w-[68ch] text-[14px] leading-[21px] text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A set of mutually exclusive views (at most five). */
export function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

/** One view: a toggle button with its count. `alert` paints the count copper (needs the gestoría). */
export function Chip({ on, count, alert, onClick, children }: { on: boolean; count?: number; alert?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "inline-flex h-(--control-h-sm) items-center gap-2 rounded-md border px-3 text-[14px] font-medium whitespace-nowrap transition-colors",
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
