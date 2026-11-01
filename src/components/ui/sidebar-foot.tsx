"use client";

import { useState } from "react";
import { Check, ChevronDown, Languages, LogOut } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";
import { actions } from "@/lib/data/store";
import { IconTile } from "./icons";
import { useHtmlLang } from "./lang-switch";
import { cx } from "./primitives";

/**
 * The foot of every sidebar (gestoría, PreRenta team, client): the language and sign-out,
 * the same in each. `dark` is the navy workspace sidebar, `light` the client's light-blue one.
 */
type Theme = "dark" | "light";

const LANG: Record<Theme, { box: string; row: string; tile: "chrome" | "accent"; tileCls?: string; muted: string; on: string; off: string; check: string }> = {
  dark: {
    box: "border-chrome-line bg-chrome-hover",
    row: "hover:bg-chrome-active",
    tile: "chrome",
    muted: "text-chrome-muted",
    on: "bg-chrome-active font-semibold text-chrome-ink",
    off: "text-chrome-muted hover:bg-chrome-hover hover:text-chrome-ink",
    check: "text-white",
  },
  light: {
    box: "border-accent/10 bg-surface/60",
    row: "hover:bg-surface",
    tile: "accent",
    tileCls: "bg-surface",
    muted: "text-accent/70",
    on: "bg-surface font-semibold text-accent shadow-sm",
    off: "text-accent/75 hover:bg-surface hover:text-accent",
    check: "text-copper",
  },
};

/** Language row: a setting, not a destination, so it sits in its own lighter box; shows the current language and opens the list in place (works folded too). */
export function LangMenu({ compact = false, item, theme = "dark" }: { compact?: boolean; item: (on: boolean) => string; theme?: Theme }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.id === lang)!;
  const c = LANG[theme];
  useHtmlLang();
  return (
    <div className={cx("rounded-lg border p-1", c.box, compact && "lg:p-0.5")}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} title={compact ? `${t.common.language}: ${cur.label}` : undefined} className={cx(item(false), "min-h-10 w-full cursor-pointer text-left", c.row)}>
        <IconTile icon={Languages} size="xs" tone={c.tile} className={c.tileCls} />
        <span className={cx("flex-1", compact && "lg:sr-only")}>{t.common.language}</span>
        <span className={cx("text-[13px] font-normal", c.muted, compact && "lg:hidden")}>{cur.label}</span>
        <ChevronDown size={14} className={cx("shrink-0 transition-transform", c.muted, open && "rotate-180", compact && "lg:hidden")} aria-hidden="true" />
      </button>
      {open && (
        <ul role="group" aria-label={t.common.language} className={cx("mt-0.5 mb-0.5 ml-10 flex flex-col gap-0.5", compact && "lg:ml-0")}>
          {LANGS.map((l) => {
            const on = l.id === lang;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => actions.setLang(l.id)}
                  title={compact ? l.label : undefined}
                  className={cx("flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] transition", on ? c.on : c.off, compact && "lg:justify-center lg:px-0")}
                >
                  <span className={cx("flex-1", compact && "lg:hidden")}>{l.label}</span>
                  <span className={cx("hidden text-[11.5px] font-semibold", compact && "lg:inline")}>{l.short}</span>
                  {on && <Check size={14} className={cx("shrink-0", c.check, compact && "lg:hidden")} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const SIGN_OUT: Record<Theme, { btn: string; tile: string }> = {
  // terracotta tint on navy: lighter than the sidebar, warm, plainly the way out
  dark: { btn: "bg-chrome-hover text-chrome-ink hover:bg-chrome-hover", tile: "bg-chrome-mark text-chrome" },
  light: { btn: "bg-sunk text-copper-text hover:bg-hover", tile: "bg-copper text-accent-ink" },
};

/** Sign-out: its own tinted box under a hairline, with its icon on a terracotta tile. */
export function SignOutButton({ onClick, label, compact = false, title, theme = "dark" }: { onClick: () => void; label: string; compact?: boolean; title?: string; theme?: Theme }) {
  const c = SIGN_OUT[theme];
  return (
    <div className={cx("mt-1 border-t pt-2", theme === "dark" ? "border-chrome-line" : "border-accent/10")}>
      <button type="button" onClick={onClick} title={title ?? (compact ? label : undefined)} className={cx("flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-left text-[14px] font-semibold transition-colors", c.btn, compact && "lg:justify-center lg:px-0")}>
        <span className={cx("grid size-7 shrink-0 place-items-center rounded-md", c.tile)} aria-hidden="true">
          <LogOut size={14} strokeWidth={2.2} />
        </span>
        <span className={cx("flex-1", compact && "lg:sr-only")}>{label}</span>
      </button>
    </div>
  );
}
