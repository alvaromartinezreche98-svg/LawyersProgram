"use client";

import { actions, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtClock } from "@/lib/format";
import { useEffect, useState } from "react";
import { Check, CircleAlert, RotateCw } from "lucide-react";
import { Button, Notice, cx } from "./primitives";

/**
 * Save status (design system › Feedback): says what happened. "Guardado a las
 * 21:04" only after the write succeeded; a failure is red with "Reintentar".
 */
export function SaveStatus({ idle, className }: { idle: string; className?: string }) {
  const { save } = useAppState();
  const { t, locale } = useI18n();
  const base = "inline-flex shrink-0 flex-row items-center gap-1.5 whitespace-nowrap text-[13px] leading-[18px]";
  if (save.status === "failed")
    return (
      <span role="alert" className={cx(base, "font-medium text-bad", className)}>
        <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
        {t.sync.notSaved}
        <button type="button" onClick={actions.retrySave} className="underline underline-offset-2 hover:text-ink">{t.sync.retry}</button>
      </span>
    );
  // API mode: another session saved this section first; its answers were kept where both changed.
  if (save.status === "merged")
    return (
      <span role="status" className={cx(base, "font-medium text-warn", className)}>
        <CircleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
        {t.sync.merged}
      </span>
    );
  return (
    <span role="status" className={cx(base, "text-muted", className)}>
      {save.status === "saving" ? (
        <span className="size-3.5 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin" aria-hidden="true" />
      ) : save.status === "saved" && save.at ? (
        <Check size={14} strokeWidth={2.4} className="text-ok" aria-hidden="true" />
      ) : null}
      {save.status === "saving" ? t.sync.saving : save.status === "saved" && save.at ? t.sync.saved(fmtClock(save.at, locale)) : idle}
    </span>
  );
}

/**
 * The client's save status as a floating pill, bottom right, just above the questionnaire's sticky
 * foot (so it never covers "Anterior" / "Siguiente"; above the phone tab bar). It shows while saving and fades out 3 s after
 * "Guardado a las 21:04"; a failure or a merge stays until resolved. Each state slides in:
 * a spinner while saving, a green tick that pops, red with "Reintentar" on a failure.
 */
export function SaveToast({ idle }: { idle: string }) {
  const { save } = useAppState();
  const { t, locale } = useI18n();
  const failed = save.status === "failed";
  const merged = save.status === "merged";
  const saving = save.status === "saving";
  const saved = save.status === "saved" && !!save.at;
  // Hidden until the first save; a success fades after 3 s, the rest stay.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (save.status === "idle" || (save.status === "saved" && !save.at)) return;
    const raf = requestAnimationFrame(() => setShown(true));
    if (save.status !== "saved") return () => cancelAnimationFrame(raf);
    const hide = setTimeout(() => setShown(false), 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hide);
    };
  }, [save.status, save.at]);
  const text = failed ? t.sync.notSaved : merged ? t.sync.merged : saving ? t.sync.saving : saved ? t.sync.saved(fmtClock(save.at!, locale)) : idle;
  return (
    <div
      role={failed ? "alert" : "status"}
      aria-hidden={!shown}
      className={cx(
        // above the sticky foot (≈81px) from 960px, plus the frame's 12px gap from 1280px; above the tab bar on phones
        "fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 md:right-6 md:bottom-[100px] xl:right-12 xl:bottom-[108px]",
        "transition-[opacity,translate] duration-300 ease-out",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        "flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-full border bg-surface/95 py-2 pr-4 pl-2.5 text-[13.5px] font-medium shadow-[0_10px_15px_-3px_rgb(var(--accent-rgb)/0.14),0_4px_6px_-4px_rgb(var(--accent-rgb)/0.12)] backdrop-blur-sm transition-colors duration-300",
        failed ? "border-bad/30 text-bad" : merged ? "border-copper text-warn" : "border-line text-ink",
      )}
    >
      {/* keyed by state, so every change slides in */}
      <span key={save.status} className="flex min-w-0 items-center gap-2 motion-safe:animate-[toast-in_220ms_ease-out]">
        <span className={cx("grid size-6 shrink-0 place-items-center rounded-full", failed ? "bg-bad-soft" : merged ? "bg-warn-soft" : saved ? "bg-ok-soft text-ok" : "bg-sunk text-muted")} aria-hidden="true">
          {saving ? (
            <span className="size-3.5 rounded-full border-2 border-line-strong/40 border-t-accent motion-safe:animate-spin" />
          ) : failed || merged ? (
            <CircleAlert size={14} strokeWidth={2.4} />
          ) : saved ? (
            <Check size={14} strokeWidth={2.6} className="motion-safe:animate-[tick-pop_320ms_cubic-bezier(.34,1.56,.64,1)]" />
          ) : (
            <Check size={14} strokeWidth={2.4} />
          )}
        </span>
        <span className="truncate">{text}</span>
        {failed && (
          <button type="button" onClick={actions.retrySave} className="ml-1 shrink-0 cursor-pointer font-semibold underline underline-offset-2 hover:text-ink">
            {t.sync.retry}
          </button>
        )}
      </span>
    </div>
  );
}

/** Shown at every width when the last save failed, with a retry. */
export function SaveFailed({ className }: { className?: string }) {
  const { save } = useAppState();
  const { t } = useI18n();
  if (save.status !== "failed") return null;
  return (
    <Notice
      tone="bad"
      className={className}
      title={t.sync.failedTitle}
      actions={
        <Button size="sm" onClick={actions.retrySave}>
          <RotateCw size={14} aria-hidden="true" />
          {t.sync.retry}
        </Button>
      }
    >
      {t.sync.failedBody}
    </Notice>
  );
}
