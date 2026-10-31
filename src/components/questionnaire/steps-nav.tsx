"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, CircleAlert, PenLine, Send } from "lucide-react";
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
  const done = sections.map((s) => s.st).filter((x) => x === "done").length;
  const idx = SCHEMA.findIndex((s) => s.slug === current);
  const cur = sections[idx];
  const curName = cur ? cur.short : current === SIGN_SLUG ? t.sign.short : t.q.review;
  const stateText = (s: (typeof sections)[number]) =>
    requested?.has(s.slug) ? t.q.requested : s.st === "done" ? t.sectionState.done : s.st === "partial" ? t.q.leftN(s.p.total - s.p.done) : t.sectionState.empty;

  const go = (slug: string) => {
    setOpen(false);
    onSelect(slug);
  };
  // The state sits on the same line as the name in every language: a short count
  // badge ("8") or an alert icon, with the full words for screen readers and on hover.
  const badge = (s: (typeof sections)[number]) => {
    const text = stateText(s);
    if (requested?.has(s.slug))
      return (
        <span title={text} className="inline-flex size-[22px] items-center justify-center rounded-full bg-copper-soft text-copper-text">
          <CircleAlert size={14} aria-hidden="true" />
          <span className="sr-only">{text}</span>
        </span>
      );
    if (s.st === "partial")
      return (
        <span title={text} className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-copper-soft px-1.5 text-[12.5px] font-semibold text-copper-text tabular-nums">
          <span aria-hidden="true">{s.p.total - s.p.done}</span>
          <span className="sr-only">{text}</span>
        </span>
      );
    return <span className="sr-only">{text}</span>;
  };
  const row = (slug: string, name: string, dot: ReactNode, state?: ReactNode) => (
    <li key={slug}>
      <button
        type="button"
        aria-current={slug === current ? "step" : undefined}
        onClick={() => go(slug)}
        className={cx("grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-3 text-left text-[14.5px] leading-5 transition-colors", slug === current ? "bg-accent-soft font-semibold text-accent shadow-[inset_3px_0_0_var(--accent)]" : "hover:bg-sunk")}
      >
        {dot}
        <span className="min-w-0 truncate">{name}</span>
        {state}
      </button>
    </li>
  );

  return (
    <nav aria-label={t.q.stepsLabel} className="min-w-0 rounded-xl border border-line bg-surface p-3 shadow-sheet max-[959px]:sticky max-[959px]:top-0 max-[959px]:z-10 max-[959px]:-mx-4 max-[959px]:rounded-none max-[959px]:border-x-0 max-[959px]:border-t-0 max-[959px]:px-4 min-[960px]:sticky min-[960px]:top-[calc(var(--app-header,64px)+1.5rem)] min-[960px]:p-4">
      {/* Phone bar */}
      <div className="flex flex-col gap-2.5 min-[960px]:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="t-eyebrow min-w-0 truncate text-muted">{idx >= 0 ? t.q.sectionOf(idx + 1, SCHEMA.length) : curName}</span>
          {footer}
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-(--control-h) w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-left text-[15px] font-medium">
          <span className="min-w-0 truncate">
            {curName}
            {cur && requested?.has(cur.slug) && <span className="text-copper-text"> · {t.q.requested.toLowerCase()}</span>}
          </span>
          <ChevronDown size={18} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        <LineMeter done={done} total={SCHEMA.length} />
      </div>

      {/* Desktop header */}
      <div className="mb-3 hidden flex-col gap-2 min-[960px]:flex">
        <div className="flex items-center justify-between gap-2">
          <span className="t-eyebrow whitespace-nowrap text-muted">{t.home.yourReturn}</span>
          <span className="text-[13px] whitespace-nowrap text-muted">{t.q.doneShort(done, SCHEMA.length)}</span>
        </div>
        <LineMeter done={done} total={SCHEMA.length} />
      </div>

      <div className={cx("max-[959px]:mt-2 max-[959px]:max-h-[60dvh] max-[959px]:overflow-y-auto", open ? "block" : "max-[959px]:hidden")}>
        <ol className="flex flex-col gap-0.5">
          {/* done = green check · in progress = terracotta half-filled with what is left · not started = grey number */}
          {/* Signing comes right after personal details (sitemap C3), in the same order as the steps */}
          {sections.flatMap((s, i) => [
            row(s.slug, s.short, <StepDot n={i + 1} state={s.st as SectionState} />, badge(s)),
            ...(i === 0 && signDone !== undefined ? [row(SIGN_SLUG, t.sign.short, <StepDot state={signDone ? "done" : "none"} icon={PenLine} tone="accent" />)] : []),
          ])}
        </ol>
        <ul className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
          {row(REVIEW_SLUG, t.q.review, <StepDot state="none" icon={Send} tone="accent" />)}
        </ul>
      </div>
    </nav>
  );
}

/** One continuous bar for the sections done; each section's own state is in the list below it. */
function LineMeter({ done, total }: { done: number; total: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-sunk" aria-hidden="true">
      <div className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
    </div>
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
