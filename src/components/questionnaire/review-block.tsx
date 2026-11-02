"use client";

import type { Answers } from "@/lib/questionnaire/types";
import { NO_NEED_TO_UPLOAD, SCHEMA, SIGN_SLUG } from "@/lib/questionnaire/schema";
import { firstOpenAnchor, overall, progressOf, sectionState } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ArrowRight } from "lucide-react";
import { Button, Pill, cx } from "@/components/ui/primitives";

/** Last step: what is still open, what not to upload, and the send button. API mode: `hasUnsent` false after a send hides the button (nothing to resend); `pending` disables it while sending. */
export function ReviewBlock({ answers, sent, onGo, onSend, signDone, pending, hasUnsent }: { answers: Answers; sent: boolean; onGo: (slug: string) => void; onSend?: () => void; signDone?: boolean; pending?: boolean; hasUnsent?: boolean }) {
  const { t, tr } = useI18n();
  const tt = overall(answers);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {signDone !== undefined && (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg border border-line px-3 py-2.5">
            <span>{t.sign.short}</span>
            {signDone ? (
              <Pill tone="ok">{t.sign.state.signed}</Pill>
            ) : (
              <button type="button" onClick={() => onGo(SIGN_SLUG)} className="font-semibold text-accent">
                {t.sign.sign}
              </button>
            )}
          </div>
        )}
        {SCHEMA.map((s, i) => {
          const p = progressOf(s.fields, answers);
          const st = sectionState(p);
          return (
            <div key={s.slug} className={cx("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg border px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]", st === "done" ? "border-line" : "border-line shadow-[inset_3px_0_0_var(--copper)]")}>
              <span>
                {i + 1}. {tr(s.title)}
              </span>
              <span className={cx("hidden text-[13px] sm:inline", st === "done" ? "font-mono text-muted" : "font-medium text-copper-text")}>
                {st === "done" ? (p.total ? `${p.done}/${p.total}` : "") : t.q.leftN(p.total - p.done)}
              </span>
              {st === "done" ? (
                <Pill tone="ok">{t.sectionState.done}</Pill>
              ) : (
                // Straight to the first question still open, not just to the top of the section.
                <Button size="sm" variant="primary" onClick={() => onGo(`${s.slug}#${firstOpenAnchor(s.fields, answers) ?? ""}`)}>
                  {/* phones: arrow only, so the section name keeps the line */}
                  <span className="max-sm:sr-only">{st === "partial" ? t.q.finish : t.q.start}</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-line bg-sunk pad-tile text-sm">
        <h3 className="mb-1.5 font-bold">{t.q.noNeedTitle}</h3>
        <ul className="list-disc pl-5 text-muted">
          {NO_NEED_TO_UPLOAD.map((x) => (
            <li key={x.es}>{tr(x)}</li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-muted">{t.q.noNeedFoot}</p>
      </div>
      {onSend && !(sent && hasUnsent === false) && (
        <div className="flex flex-col items-start gap-3">
          {tt.pending > 0 && <p className="text-[13px] text-muted">{t.q.pendingSend(tt.pending)}</p>}
          <Button variant="primary" size="lg" onClick={onSend} loading={pending}>
            {sent ? t.q.resend : t.q.send}
          </Button>
        </div>
      )}
    </div>
  );
}
