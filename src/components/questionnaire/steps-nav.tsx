"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, PenLine, Send } from "lucide-react";
import type { Answers } from "@/lib/questionnaire/types";
import { REVIEW_SLUG, SCHEMA, SIGN_SLUG } from "@/lib/questionnaire/schema";
import { progressOf, sectionState, type SectionState } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "@/components/ui/primitives";
import { SegMeter, StepDot } from "@/components/ui/progress";

/**
 * Left rail of the questionnaire (design system › Progress): sections counted
 * in words, a segmented meter, the nine sections numbered 1–9 with their state,
 * and signing / "Revisar y enviar" as actions under a rule. On phones it is a
 * compact sticky bar (section, save status, meter) that opens the full list.
 */
export function StepsNav({ answers, current, onSelect, footer, signDone, requested }: {
  answers: Answers;
  current: string;
  onSelect: (slug: string) => void;
  footer?: ReactNode;
  /** Whether the signing step is complete; undefined hides the step. */
  signDone?: boolean;
  /** Sections where the gestoría has an open request. */
  requested?: Set<string>;
}) {
  const { t, tr } = useI18n();
  const [open, setOpen] = useState(false);
  const sections = SCHEMA.map((s) => {
    const p = progressOf(s.fields, answers);
    return { slug: s.slug, short: tr(s.short), p, st: sectionState(p) };
  });
  const states = sections.map((s) => s.st);
  const done = states.filter((x) => x === "done").length;
  const idx = SCHEMA.findIndex((s) => s.slug === current);
  const cur = sections[idx];
  const curName = cur ? cur.short : current === SIGN_SLUG ? t.sign.short : t.q.review;
  const stateText = (s: (typeof sections)[number]) =>
    requested?.has(s.slug) ? t.q.requested : s.st === "done" ? t.sectionState.done : s.st === "partial" ? t.q.leftN(s.p.total - s.p.done) : t.sectionState.empty;

  const go = (slug: string) => {
    setOpen(false);
    onSelect(slug);
  };
  const row = (slug: string, name: string, dot: ReactNode, state?: ReactNode, request?: boolean) => (
    <li key={slug}>
      <button
        type="button"
        aria-current={slug === current ? "step" : undefined}
        onClick={() => go(slug)}
        className={cx("grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[14.5px] leading-5 transition-colors", slug === current ? "bg-accent-soft font-semibold" : "hover:bg-accent-soft")}
      >
        {dot}
        <span className="min-w-0 [overflow-wrap:normal] hyphens-auto">{name}</span>
        <span className={cx("text-right text-[12.5px] whitespace-nowrap", request ? "font-semibold text-copper-text" : "font-normal text-muted")}>{state}</span>
      </button>
    </li>
  );

  return (
    <nav aria-label={t.q.stepsLabel} className="min-w-0 rounded-xl border border-line bg-surface p-3 shadow-sheet max-[959px]:sticky max-[959px]:top-0 max-[959px]:z-10 max-[959px]:-mx-4 max-[959px]:rounded-none max-[959px]:border-x-0 max-[959px]:border-t-0 max-[959px]:px-4 min-[960px]:sticky min-[960px]:top-[calc(var(--app-header,64px)+1.5rem)] min-[960px]:p-4">
      {/* Phone bar */}
      <div className="flex flex-col gap-2.5 min-[960px]:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold tracking-[.04em] text-muted uppercase">{idx >= 0 ? t.q.sectionOf(idx + 1, SCHEMA.length) : curName}</span>
          {footer}
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-(--control-h) w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-left text-[15px] font-medium">
          <span className="min-w-0 truncate">
            {curName}
            {cur && requested?.has(cur.slug) && <span className="text-copper-text"> · {t.q.requested.toLowerCase()}</span>}
          </span>
          <ChevronDown size={18} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        <SegMeter states={states} />
      </div>

      {/* Desktop header */}
      <div className="mb-3 hidden flex-col gap-2 min-[960px]:flex">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold tracking-[.04em] text-muted uppercase">{t.home.yourReturn}</span>
          <span className="text-[13px] text-muted">{t.q.doneShort(done, SCHEMA.length)}</span>
        </div>
        <SegMeter states={states} />
      </div>

      <div className={cx("max-[959px]:mt-2 max-[959px]:max-h-[60dvh] max-[959px]:overflow-y-auto", open ? "block" : "max-[959px]:hidden")}>
        <ol className="flex flex-col gap-0.5">
          {sections.map((s, i) => row(s.slug, s.short, <StepDot n={i + 1} state={s.st as SectionState} />, stateText(s), requested?.has(s.slug)))}
        </ol>
        <ul className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
          {signDone !== undefined && row(SIGN_SLUG, t.sign.short, <StepDot state={signDone ? "done" : "none"} icon={PenLine} />, signDone ? t.sectionState.done : "")}
          {row(REVIEW_SLUG, t.q.review, <StepDot state="none" icon={Send} />)}
        </ul>
      </div>
    </nav>
  );
}

/** "6 de 9 apartados completos" with one meter segment per section (done, in progress, not started). */
export function SectionsProgress({ answers, className }: { answers: Answers; className?: string }) {
  const { t } = useI18n();
  const states = SCHEMA.map((s) => sectionState(progressOf(s.fields, answers)));
  return (
    <div className={className}>
      <p className="mb-1.5 text-[14px] text-muted">{t.q.sectionsDone(states.filter((x) => x === "done").length, states.length)}</p>
      <SegMeter states={states} />
    </div>
  );
}
