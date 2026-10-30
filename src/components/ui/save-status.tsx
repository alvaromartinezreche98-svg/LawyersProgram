"use client";

import { actions, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtClock } from "@/lib/format";
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
