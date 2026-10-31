"use client";

import { FEATURES } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REVIEW_SLUG, SCHEMA, SIGN_SLUG, STEP_SLUGS, sectionBySlug } from "@/lib/questionnaire/schema";
import { progressOf, sectionState } from "@/lib/questionnaire/progress";
import { signingDone } from "@/lib/data/legal";
import { SignStep } from "./sign-step";
import type { AnswerValue, Path } from "@/lib/questionnaire/types";
import { actions, openTasks, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { SaveFailed, SaveStatus } from "@/components/ui/save-status";
import { QuestionnaireForm } from "@/components/questionnaire/field-list";
import { StepsNav } from "@/components/questionnaire/steps-nav";
import { ReviewBlock } from "@/components/questionnaire/review-block";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Notice } from "@/components/ui/primitives";
import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import { IconTile, SECTION_ICON } from "@/components/ui/icons";
import { useClientExp } from "./client-shell";
import { SectionTasks } from "./client-tasks";
import { SectionGuide } from "@/components/questionnaire/section-guide";

/** C3 · Cuestionario: one step per route, saved on every change. */
/** Scrolls to a question and highlights it for a moment: unanswered questions carry no marker, so this shows which one. */
function land(anchor: string) {
  const el = document.getElementById(anchor);
  if (!el) return;
  el.scrollIntoView({ block: "start" });
  el.dataset.flash = "";
  setTimeout(() => delete el.dataset.flash, 1800);
}

export function Questionnaire({ slug }: { slug: string }) {
  const exp = useClientExp();
  const { firm } = useAppState();
  const signDone = FEATURES.signing ? signingDone(exp, firm) : undefined;
  const { t, tr, status } = useI18n();
  const router = useRouter();
  const [toast, setToast] = useState("");
  const idx = STEP_SLUGS.indexOf(slug);
  const section = sectionBySlug(slug);
  const isSign = slug === SIGN_SLUG;
  const title = section ? tr(section.title) : isSign ? t.sign.title : t.q.review;
  const stepName = (s: string) => {
    const sec = sectionBySlug(s);
    return sec ? tr(sec.short) : s === SIGN_SLUG ? t.sign.short : t.q.review;
  };
  const go = (s: string) => {
    const [step, anchor] = s.split("#");
    router.push(`/declaracion/${step}${anchor ? `#${anchor}` : ""}`);
    if (!anchor) window.scrollTo(0, 0);
    else if (step === slug) land(anchor);
  };

  // A request link ("#q-<field>[-<item>]") lands on the exact question once the step has rendered.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("q-")) return;
    const timer = setTimeout(() => land(hash), 50);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Saved against the case's answers as they are at that moment (see actions.setAnswer).
  const onChange = (path: Path, value: AnswerValue | undefined) => actions.setAnswer(exp.id, path, value);
  const onUpdate = (path: Path, fn: (cur: AnswerValue | undefined) => AnswerValue | undefined) => actions.updateAnswer(exp.id, path, fn);
  const send = () => {
    actions.sendToGestoria(exp.id);
    window.scrollTo(0, 0);
  };

  return (
    <div className="grid items-start gap-6 min-[960px]:grid-cols-[320px_minmax(0,1fr)]">
      <PageTitle>{section ? tr(section.short) : isSign ? t.sign.short : t.q.review}</PageTitle>
      <StepsNav answers={exp.answers} current={slug} onSelect={go} footer={<SaveStatus idle={t.q.autosave} />} signDone={signDone} requested={new Set(openTasks(exp).map((x) => x.target?.section).filter((x): x is string => !!x))} />
      <section className="min-w-0 rounded-xl border border-line bg-surface shadow-sheet">
        {/* Sheet head: where the client is, the save status, the step's title */}
        <header className="flex flex-col gap-1 border-b border-line px-4 pt-6 pb-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <span className="t-eyebrow text-[12.5px] text-accent">
              {section ? t.q.sectionOf(SCHEMA.indexOf(section) + 1, SCHEMA.length) : isSign ? t.sign.short : t.q.review}
            </span>
            <SaveStatus idle={t.q.autosave} className="max-[959px]:hidden" />
          </div>
          {/* The tile takes the section's state: green once complete, terracotta while half done, navy before. */}
          <div className="flex items-center gap-3">
            <IconTile icon={SECTION_ICON[slug] ?? ClipboardCheck} tone={section ? ({ done: "ok", partial: "copper", empty: "accent" } as const)[sectionState(progressOf(section.fields, exp.answers))] : "accent"} />
            <h1 className="display-serif text-[clamp(24px,2.4vw,28px)] leading-tight font-semibold">{title}</h1>
          </div>
        </header>
        <div className="px-4 pt-6 pb-8 sm:px-8 lg:px-10">
        <SaveFailed className="mb-5" />
        {/* "Your gestoría has it" once, where the client resends; Home shows it too. Not repeated on every section. */}
        {exp.status !== "borrador" && !section && !isSign && (
          <Notice tone="info" className="mb-5" title={t.home.sentTitle}>{t.home.sentBody(status(exp.status))}</Notice>
        )}

        {isSign ? (
          <>
            <div className="mt-4">
              <SignStep exp={exp} />
            </div>
          </>
        ) : section ? (
          <>
            {/* The section's intro spans the sheet, like the questions under it. */}
            {section.intro && <p className="mb-2 text-ink/80">{tr(section.intro)}</p>}
            <p className="mb-6 text-[14px] text-ink/80">{t.q.reqNote}</p>
            <SectionTasks exp={exp} section={section.slug} />
            <SectionGuide exp={exp} slug={section.slug} onGo={land} />
            {FEATURES.prefill && exp.prefill?.sections.includes(section.slug) && (
              exp.prefill.confirmed.includes(section.slug) ? (
                <Notice tone="ok" className="mb-5">{t.years.confirmed}</Notice>
              ) : (
                <Notice className="mb-5">
                  <span className="flex flex-wrap items-center justify-between gap-3">
                    {t.years.banner(exp.ejercicio - 1)}
                    <Button size="sm" variant="primary" onClick={() => actions.confirmPrefill(exp.id, section.slug)}>
                      {t.years.same}
                    </Button>
                  </span>
                </Notice>
              )
            )}
            <QuestionnaireForm fields={section.fields} answers={exp.answers} onChange={onChange} onUpdate={onUpdate} notify={setToast} idBase={section.id} exp={exp} section={section.slug} />
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <p className="max-w-[52ch] flex-1 text-muted">{t.q.reviewIntro}</p>
            </div>
            <ReviewBlock answers={exp.answers} sent={exp.status !== "borrador"} onGo={go} onSend={send} signDone={signDone} />
          </>
        )}
        </div>
        {/* Sheet foot: the previous and next steps by name */}
        {slug !== REVIEW_SLUG && (
          // From 960px the foot sticks to the bottom of the window, so Back / Next never need a long scroll.
          // Solid white with a top rule and an upward shadow (no translucency: the DS rules out glass effects).
          <footer data-sticky-foot className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-line bg-surface px-4 py-4 sm:px-8 min-[960px]:sticky min-[960px]:bottom-0 min-[960px]:shadow-[0_-10px_24px_-14px_var(--shadow)] lg:px-10">
            {idx > 0 ? (
              <Button size="lg" onClick={() => go(STEP_SLUGS[idx - 1])}>
                <ArrowLeft size={17} aria-hidden="true" />
                {stepName(STEP_SLUGS[idx - 1])}
              </Button>
            ) : <span />}
            <Button size="lg" variant="primary" onClick={() => go(STEP_SLUGS[idx + 1])}>
              {t.q.goOn(stepName(STEP_SLUGS[idx + 1]))}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </footer>
        )}
      </section>
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-30 w-max max-w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm text-bg shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
