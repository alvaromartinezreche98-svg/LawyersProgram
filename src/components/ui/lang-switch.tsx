"use client";

import { useEffect } from "react";
import { HTML_LANG, LANGS } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";
import { actions } from "@/lib/data/store";
import { cx } from "./primitives";

/** ES / EN toggle. Also keeps <html lang> and the tab title prefix in sync. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);
  return (
    <div role="group" aria-label={t.common.language} className={cx("flex h-(--control-h-sm) items-stretch rounded-md border border-line bg-sunk p-0.5", className)}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={lang === l.id}
          title={l.label}
          onClick={() => actions.setLang(l.id)}
          className={cx("flex items-center rounded-sm px-2.5 text-xs font-semibold tracking-wide transition-colors", lang === l.id ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
