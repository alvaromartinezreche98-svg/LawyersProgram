"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, CircleCheck, CircleMinus, ClipboardCheck, FileX2, ShieldCheck } from "lucide-react";
import { NO_NEED_TO_UPLOAD } from "@/lib/questionnaire/schema";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { SpotArt, type SpotName } from "@/components/ui/spot-art";
import { ButtonLink, Card, Eyebrow } from "@/components/ui/primitives";
import { IconTile } from "@/components/ui/icons";
import { PublicShell } from "./public-shell";

const SPOTS: SpotName[] = ["invite", "email", "questions", "upload", "sign", "review", "result"];

/**
 * Staged reveal: each step comes in as it scrolls into view (number, then text,
 * then drawing) and its spine draws down to the next. Marked by JS, so without
 * JS (or with reduced motion) everything simply shows.
 */
function useStepReveal() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = ref.current;
    if (!ol || !("IntersectionObserver" in window)) return;
    ol.dataset.reveal = "";
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.in = "";
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    ol.querySelectorAll("[data-step]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);
  return ref;
}

/** P2 · Cómo funciona: the taxpayer's journey, step by step. */
export function HowPage() {
  const timeline = useStepReveal();
  const { t, tr } = useI18n();
  const h = t.pub.how;
  return (
    <PublicShell>
      <PageTitle>{h.title}</PageTitle>
      <div className="mx-auto flex w-full max-w-page flex-col gap-10 px-4 py-12 sm:px-8">
        <div>
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,36px)] font-semibold">{h.title}</h1>
          <p className="mt-2 max-w-[62ch] text-[16px] text-muted">{h.intro}</p>
        </div>

        {/*
          The journey as an editorial timeline: a numbered spine on the left, the text,
          and a line drawing of the moment on a paper plate. Rows are separated by
          hairlines, not boxed, so it reads as one story.
        */}
        <ol ref={timeline} className="how-steps relative">
          {h.steps.map(([title, d], i) => (
            <li
              key={title}
              data-step
              className="group relative -mx-4 grid grid-cols-[48px_minmax(0,1fr)] gap-x-5 rounded-none border-t border-line px-4 py-5 transition-colors duration-300 first:border-t-0 first:pt-2 hover:bg-surface/70 sm:-mx-6 sm:grid-cols-[56px_minmax(0,1fr)_144px] sm:items-center sm:gap-x-8 sm:px-6"
            >
              {/* spine: draws down to the next step once this one is on screen */}
              {i < h.steps.length - 1 && <span className="how-spine absolute top-[3.25rem] bottom-[-1.25rem] left-[39px] w-px bg-line-strong/40 group-first:top-[2.5rem] sm:left-[51px]" aria-hidden="true" />}
              <span className="how-num relative z-[1] grid size-12 place-items-center self-start rounded-full border border-line bg-surface transition-[background-color,border-color,scale] duration-300 group-hover:border-accent group-hover:bg-accent motion-safe:group-hover:scale-105 sm:size-14">
                <span className="display-serif text-[20px] leading-none font-semibold text-accent transition-colors duration-300 group-hover:text-accent-ink sm:text-[22px]">{String(i + 1).padStart(2, "0")}</span>
                <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-bg bg-copper transition-transform duration-300 motion-safe:group-hover:scale-125" aria-hidden="true" />
              </span>
              <div className="how-text min-w-0 self-center">
                {/* the number beside it already says which step this is */}
                <h2 className="display-serif text-[20px] leading-7 font-semibold transition-[translate] duration-300 motion-safe:group-hover:translate-x-1">{title}</h2>
                <p className="mt-1.5 max-w-[56ch] text-[15px] leading-[23px] text-muted">{d}</p>
              </div>
              <div className="how-art col-start-2 mt-3 w-[128px] rounded-xl bg-surface ring-1 ring-line transition-[translate,rotate,box-shadow] duration-500 ease-out group-hover:shadow-[0_18px_34px_-18px_rgb(var(--accent-rgb)/0.45)] group-hover:ring-accent/25 sm:col-start-3 sm:mt-0 sm:w-full motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:-rotate-1">
                <SpotArt name={SPOTS[i]} className="h-auto w-full" />
              </div>
            </li>
          ))}
        </ol>

        {/*
          Two lists that mean opposite things, so they look different: what to prepare (green
          "ready" marks on a white card with a green edge) and what not to upload (muted marks
          on the sunk ground, closing with why).
        */}
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-4 border-l-[3px] border-l-ok p-5 sm:p-6">
            <h2 className="flex items-center gap-3 display-tight text-[18px] font-semibold">
              <IconTile icon={ClipboardCheck} tone="ok" size="sm" />
              {h.haveTitle}
            </h2>
            <ul className="flex flex-col gap-2.5 text-[14.5px]">
              {h.have.map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <CircleCheck size={17} strokeWidth={2.2} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-4 bg-sunk p-5 shadow-none sm:p-6">
            <h2 className="flex items-center gap-3 display-tight text-[18px] font-semibold">
              <IconTile icon={FileX2} tone="neutral" size="sm" />
              {h.noNeedTitle}
            </h2>
            <ul className="flex flex-col gap-2.5 text-[14.5px] text-muted">
              {NO_NEED_TO_UPLOAD.map((x) => (
                <li key={x.es} className="flex items-start gap-2.5">
                  <CircleMinus size={17} strokeWidth={2.2} className="mt-0.5 shrink-0 text-line-strong" aria-hidden="true" />
                  {tr(x)}
                </li>
              ))}
            </ul>
            <p className="mt-auto flex items-start gap-2 border-t border-line pt-3 text-[13.5px] text-ink/80">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              {h.noNeedFoot}
            </p>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/acceso" variant="primary" size="lg">
            {h.cta}
            <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
          <Link href="/preguntas-frecuentes" className="text-[14.5px] font-medium text-accent hover:underline">
            {h.faqLink} →
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
