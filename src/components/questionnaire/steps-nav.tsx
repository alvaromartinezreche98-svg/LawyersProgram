"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, CircleAlert, PenLine, Send } from "lucide-react";
import type { Answers } from "@/lib/questionnaire/types";
import { REVIEW_SLUG, SCHEMA, SIGN_SLUG } from "@/lib/questionnaire/schema";
import { progressOf, sectionState, type SectionState } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "@/components/ui/primitives";
import { SegMeter, StepDot } from "@/components/ui/progress";

/**
 * The questionnaire's steps (design system › Progress), as a bar above the form so the
 * form has the full width: "Su declaración · 6 de 9 completos", a picker with the current
 * section that opens the full list (sections 1–9 with their state, signing, "Revisar y
 * enviar"), and from 960px a horizontal stepper with every step as a dot. On phones it is
 * a compact sticky bar (section, picker, one progress line).
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
  const box = useRef<HTMLElement>(null);
  // The section list closes on Escape or a click outside it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
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
        className={cx(
          "grid min-h-11 w-full cursor-pointer grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2 text-left text-[14.5px] leading-5 transition-colors",
          // current: navy fill, white text (its dot keeps a white ring so it still reads)
          slug === current ? "bg-accent font-semibold text-accent-ink shadow-sm [&>span:first-child]:ring-2 [&>span:first-child]:ring-white/70" : "text-ink hover:bg-sunk",
        )}
      >
        {dot}
        <span className="min-w-0 truncate">{name}</span>
        {state}
      </button>
    </li>
  );

  // Every step in order, for the horizontal stepper: the nine sections, signing after the first, then the review.
  const steps = [
    ...sections.flatMap((s, i) => [
      { slug: s.slug, name: s.short, dot: <StepDot n={i + 1} state={s.st as SectionState} />, done: s.st === "done", flag: requested?.has(s.slug) },
      ...(i === 0 && signDone !== undefined ? [{ slug: SIGN_SLUG, name: t.sign.short, dot: <StepDot state={signDone ? "done" : "none"} icon={PenLine} tone="accent" />, done: !!signDone, flag: false }] : []),
    ]),
    { slug: REVIEW_SLUG, name: t.q.review, dot: <StepDot state="none" icon={Send} tone="accent" />, done: false, flag: false },
  ];

  const stepIdx = Math.max(0, steps.findIndex((x) => x.slug === current));

  return (
    <nav ref={box} aria-label={t.q.stepsLabel} className="relative min-w-0 rounded-xl border border-line bg-surface p-3 shadow-sheet max-[959px]:sticky max-[959px]:top-0 max-[959px]:z-10 max-[959px]:-mx-4 max-[959px]:rounded-none max-[959px]:border-x-0 max-[959px]:border-t-0 max-[959px]:px-4 min-[960px]:px-5 min-[960px]:py-4">
      {/* Head: where the client is, the progress in words, and the section picker */}
      <div className="flex flex-col gap-2.5 min-[960px]:flex-row min-[960px]:items-center min-[960px]:gap-5">
        <div className="flex min-w-0 items-center justify-between gap-3 min-[960px]:flex-1 min-[960px]:justify-start">
          <span className="t-eyebrow min-w-0 truncate text-muted">
            <span className="min-[960px]:hidden">{idx >= 0 ? t.q.sectionOf(idx + 1, SCHEMA.length) : curName}</span>
            <span className="max-[959px]:hidden">{t.home.yourReturn}</span>
          </span>
          <span className="text-[13px] whitespace-nowrap text-muted max-[959px]:hidden">{t.q.doneShort(done, SCHEMA.length)}</span>
          {footer}
        </div>
        {/* The picker: the current step, "Paso 1 de 11" and a thin progress line, then a chevron */}
        <button type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)} className={cx("flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-surface py-2 pr-3 pl-3.5 text-left shadow-[var(--field-shadow)] transition-[border-color,box-shadow] hover:border-accent min-[960px]:w-[22rem] min-[960px]:shrink-0", open ? "border-accent shadow-[0_0_0_3px_rgb(var(--accent-rgb)/0.12)]" : "border-line-strong")}>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[14.5px] font-semibold text-ink">
                {curName}
                {cur && requested?.has(cur.slug) && <span className="font-medium text-copper-text"> · {t.q.requested.toLowerCase()}</span>}
              </span>
              <span className="shrink-0 text-[12px] font-medium text-muted tabular-nums">{t.q.stepOf(stepIdx + 1, steps.length)}</span>
            </span>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-sunk" aria-hidden="true">
              <span className="block h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </span>
          </span>
          <ChevronDown size={18} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {/* Phones: one line of progress. From 960px: a horizontal stepper, every step a dot joined by a line (green up to where it is done). */}
      <div className="mt-2.5 min-[960px]:hidden">
        <LineMeter done={done} total={SCHEMA.length} />
      </div>
      <ol className="mt-4 hidden items-center min-[960px]:flex">
        {steps.map((x, i) => (
          <li key={x.slug} className={cx("flex items-center", i < steps.length - 1 && "flex-1")}>
            <button
              type="button"
              onClick={() => go(x.slug)}
              aria-current={x.slug === current ? "step" : undefined}
              title={x.name}
              className={cx("relative grid cursor-pointer place-items-center rounded-full p-1 transition-transform hover:scale-110", x.slug === current && "ring-2 ring-accent ring-offset-2 ring-offset-surface")}
            >
              {x.dot}
              {x.flag && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-copper" aria-hidden="true" />}
              <span className="sr-only">{x.name}</span>
            </button>
            {i < steps.length - 1 && <i className={cx("mx-1 h-0.5 flex-1 rounded-full", x.done ? "bg-ok" : "bg-line")} aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {/* The full list: under the picker on phones, a floating panel from 960px */}
      {open && (
        <div className="flex flex-col overflow-hidden max-[959px]:mt-2 max-[959px]:max-h-[60dvh] min-[960px]:absolute min-[960px]:top-[76px] min-[960px]:right-5 min-[960px]:z-30 min-[960px]:max-h-[min(72dvh,600px)] min-[960px]:w-[22rem] min-[960px]:rounded-2xl min-[960px]:border min-[960px]:border-line min-[960px]:bg-surface min-[960px]:shadow-[0_25px_50px_-12px_rgb(var(--accent-rgb)/0.28)] motion-safe:min-[960px]:animate-[toast-in_160ms_ease-out]">
          {/* The steps scroll on their own (a hairline scrollbar); "Revisar y enviar" stays at the foot */}
          <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2 [scrollbar-color:var(--line)_transparent] [scrollbar-width:thin]">
            {/* done = green check · in progress = terracotta half-filled with what is left · not started = grey number */}
            {/* Signing comes right after personal details (sitemap C3), in the same order as the steps */}
            {sections.flatMap((s, i) => [
              row(s.slug, s.short, <StepDot n={i + 1} state={s.st as SectionState} />, badge(s)),
              ...(i === 0 && signDone !== undefined ? [row(SIGN_SLUG, t.sign.short, <StepDot state={signDone ? "done" : "none"} icon={PenLine} tone="accent" />)] : []),
            ])}
          </ol>
          <ul className="shrink-0 border-t border-line bg-sunk/60 p-2">
            {row(REVIEW_SLUG, t.q.review, <StepDot state="none" icon={Send} tone="accent" />)}
          </ul>
        </div>
      )}
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
