"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, CircleCheck, CircleX, ClipboardCheck, FileX2, ShieldCheck } from "lucide-react";
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
          The journey as a grid of step cards (4 across from 1400px, where every title fits on one line; 2 below; 1 on phones):
          the drawing of the moment on top, then the number and what happens. The eighth cell
          is the way in, so the grid closes even (4 + 4) instead of leaving a gap.
        */}
        <ol ref={timeline} className="how-steps grid gap-4 sm:grid-cols-2 min-[75rem]:grid-cols-4">
          {h.steps.map(([title, d], i) => (
            // Keyed by position, not title: a language switch must keep the same nodes, or the new ones stay hidden by the reveal.
            <li key={i} data-step className="group flex flex-col rounded-xl border border-line bg-surface pad-card shadow-sheet transition-[border-color,box-shadow,translate] duration-300 hover:border-accent/30 hover:shadow-[0_18px_34px_-20px_rgb(var(--accent-rgb)/0.4)] motion-safe:hover:-translate-y-1">
              <div className="how-art overflow-clip rounded-lg bg-sunk/60 px-10 py-2">
                <SpotArt name={SPOTS[i]} className="mx-auto h-auto w-full max-w-[150px] transition-transform duration-500 ease-out motion-safe:group-hover:-rotate-1 motion-safe:group-hover:scale-[1.03]" />
              </div>
              <div className="mt-4 flex min-w-0 items-center gap-2.5">
                <span className="how-num relative grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface transition-colors duration-300 group-hover:border-accent group-hover:bg-accent">
                  <span className="display-serif text-[15px] leading-none font-semibold text-accent transition-colors duration-300 group-hover:text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                  <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-copper" aria-hidden="true" />
                </span>
                <h2 className="display-serif text-[16.5px] leading-6 font-semibold whitespace-nowrap min-[87.5rem]:text-[18px]">{title}</h2>
              </div>
              <p className="how-text mt-2.5 text-[14.5px] leading-[22px] text-muted">{d}</p>
            </li>
          ))}
          <li className="flex flex-col justify-center gap-4 rounded-xl border border-accent bg-accent pad-card text-accent-ink on-dark">
            <h2 className="display-serif text-[22px] leading-7 font-semibold">{t.landing.panelTitle}</h2>
            <ButtonLink href="/acceso" variant="inverse" size="lg" className="self-start">
              {h.cta}
              <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
            <Link href="/preguntas-frecuentes" className="text-[14.5px] font-medium text-accent-ink/85 underline-offset-4 hover:underline">
              {h.faqLink} →
            </Link>
          </li>
        </ol>

        {/*
          Two lists that mean opposite things, so they look different: what to prepare (green
          ticks on a white card with a green edge) and what not to upload (soft crosses on the
          sunk ground, closing with why).
        */}
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-4 border-l-[3px] border-l-ok">
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
          <Card className="flex flex-col gap-4 bg-sunk shadow-none">
            <h2 className="flex items-center gap-3 display-tight text-[18px] font-semibold">
              <IconTile icon={FileX2} tone="neutral" size="sm" />
              {h.noNeedTitle}
            </h2>
            <ul className="flex flex-col gap-2.5 text-[14.5px] text-muted">
              {NO_NEED_TO_UPLOAD.map((x) => (
                <li key={x.es} className="flex items-start gap-2.5">
                  <CircleX size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-muted/70" aria-hidden="true" />
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

      </div>
    </PublicShell>
  );
}
