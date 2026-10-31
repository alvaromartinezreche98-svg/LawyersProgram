"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronsLeft, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { IconTile } from "./icons";
import { Tooltip } from "./tooltip";
import { cx } from "./primitives";

/**
 * Shared pieces of the two app sidebars (gestoría: navy, `dark`; client: light blue, `light`).
 * Rows are an icon tile and a label; the current page gets a soft ground, a terracotta tile and
 * a short terracotta bar. Folded, a row is its tile alone, with the label for screen readers
 * and as a tooltip to the right.
 */
export type SideTheme = "dark" | "light";
export const SIDE_W = { open: 268, folded: 84 } as const;

export const sideRowCls = (on: boolean, theme: SideTheme, folded = false) =>
  cx(
    "relative flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-1.5 whitespace-nowrap transition-colors duration-150",
    folded && "justify-center px-0",
    theme === "dark"
      ? cx("text-[14.5px]", on ? "bg-chrome-active font-semibold text-chrome-ink" : "font-medium text-chrome-muted hover:bg-chrome-hover hover:text-chrome-ink")
      : cx("text-[15px]", on ? "bg-surface font-semibold text-accent shadow-sm" : "font-medium text-accent/80 hover:bg-surface/70 hover:text-accent"),
    // the current page: a short terracotta bar set inside the row (hidden when folded, where the tile says it)
    on && !folded && "before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-copper",
  );

/** The row's icon on a small tile: terracotta on the current page. */
export function SideIcon({ icon, on, theme }: { icon: LucideIcon; on: boolean; theme: SideTheme }) {
  return <IconTile icon={icon} size="xs" tone={on ? "copperSolid" : theme === "dark" ? "chrome" : "accent"} className={!on && theme === "light" ? "bg-surface" : undefined} />;
}

/** A label that hides (for sight only) when the sidebar is folded. */
export function SideLabel({ children, folded }: { children: ReactNode; folded: boolean }) {
  return <span className={cx("min-w-0 flex-1 truncate", folded && "sr-only")}>{children}</span>;
}

/** One navigation row: icon, label, an optional trailing badge (on the icon's corner when folded). */
export function SideLink({ href, icon, label, on, theme, folded, onClick, trailing }: {
  href: string;
  icon: LucideIcon;
  label: string;
  on: boolean;
  theme: SideTheme;
  folded: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <Tooltip text={label} side="right" plain disabled={!folded}>
      <Link href={href} onClick={onClick} aria-current={on ? "page" : undefined} className={sideRowCls(on, theme, folded)}>
        <SideIcon icon={icon} on={on} theme={theme} />
        <SideLabel folded={folded}>{label}</SideLabel>
        {trailing && <span className={cx("shrink-0", folded && "absolute -top-1 right-1.5")}>{trailing}</span>}
      </Link>
    </Tooltip>
  );
}

/** Wraps any sidebar control so it shows its name as a tooltip while folded. */
export function SideTip({ label, folded, children }: { label: string; folded: boolean; children: ReactNode }) {
  return (
    <Tooltip text={label} side="right" plain disabled={!folded}>
      {children}
    </Tooltip>
  );
}

/**
 * The fold button: a small round button with a double chevron, set inside the sidebar's header
 * (under the emblem when folded). It sits on a faint ring; on hover it fills softly and the
 * chevrons nudge the way they will move the sidebar. `dark` for the navy sidebar.
 */
export function SideFoldButton({ folded, onToggle, theme, className }: { folded: boolean; onToggle: () => void; theme: SideTheme; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!folded}
      aria-label={folded ? t.side.expand : t.side.collapse}
      title={folded ? t.side.expand : t.side.collapse}
      className={cx(
        "group/fold grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        theme === "dark"
          ? "border-white/15 bg-white/[0.06] text-chrome-muted hover:border-white/30 hover:bg-white/[0.14] hover:text-white"
          : "border-accent/15 bg-surface/70 text-accent/60 hover:border-accent/30 hover:bg-surface hover:text-accent hover:shadow-[0_2px_6px_rgb(var(--accent-rgb)/0.14)]",
        className,
      )}
    >
      <ChevronsLeft
        size={15}
        strokeWidth={2.2}
        aria-hidden="true"
        className={cx(
          "motion-safe:transition-transform motion-safe:duration-300",
          folded ? "rotate-180 motion-safe:group-hover/fold:translate-x-0.5" : "motion-safe:group-hover/fold:-translate-x-0.5",
        )}
      />
    </button>
  );
}

/**
 * Whether a sidebar is folded: a per-browser preference per panel, read after mount so it never
 * fails without storage. `null` until the person has chosen, so a panel can pick its own default.
 */
export function useSideFold(key: string): [boolean | null, (v: boolean) => void] {
  const storeKey = `prerenta:sidebar:${key}`;
  const [folded, setFolded] = useState<boolean | null>(null);
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storeKey);
    } catch {}
    if (stored !== "folded" && stored !== "open") return;
    const raf = requestAnimationFrame(() => setFolded(stored === "folded"));
    return () => cancelAnimationFrame(raf);
  }, [storeKey]);
  const set = (v: boolean) => {
    setFolded(v);
    try {
      localStorage.setItem(storeKey, v ? "folded" : "open");
    } catch {}
  };
  return [folded, set];
}
