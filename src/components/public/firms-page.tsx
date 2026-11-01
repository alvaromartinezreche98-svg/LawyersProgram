"use client";

import { ArrowRight, Bell, Check, CircleAlert, ClipboardList, FileSignature, Globe, LayoutGrid, ListChecks, MessageCircle, QrCode, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, Eyebrow, StatusPill, cx } from "@/components/ui/primitives";
import { SCHEMA } from "@/lib/questionnaire/schema";
import type { Status } from "@/lib/data/types";
import { PublicShell } from "./public-shell";
import { FeatureCarousel } from "./feature-carousel";

const FEATURE_ICONS: LucideIcon[] = [QrCode, ListChecks, Bell, ClipboardList, MessageCircle, LayoutGrid, FileSignature, Globe];

/** P3 · Para gestorías: what the platform does for a firm and how to start. */
export function FirmsPage() {
  const { t } = useI18n();
  const f = t.pub.firms;
  return (
    <PublicShell>
      <PageTitle>{f.title}</PageTitle>
      <section className="mx-auto grid w-full max-w-page items-center gap-10 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] md:py-24">
        <div className="flex min-w-0 flex-col gap-5">
          <Eyebrow>{f.eyebrow}</Eyebrow>
          <h1 className="display-serif max-w-[22ch] text-[clamp(28px,3.6vw,40px)] leading-[1.12] font-semibold">{f.h1}</h1>
          <p className="max-w-[60ch] text-[16px] text-muted">{f.intro}</p>
          <span className="flex flex-wrap gap-2">
            <ButtonLink href="/demo" variant="primary" size="lg">
              {t.extra.demo.send}
              <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/contacto?tipo=gestoria" size="lg">{f.cta}</ButtonLink>
          </span>
        </div>
        <PanelPreview />
      </section>

      <section className="overflow-hidden border-y border-line bg-surface">
        <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 py-14 sm:px-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>{f.featuresEyebrow}</Eyebrow>
            <h2 className="display-serif max-w-[26ch] text-[clamp(24px,2.6vw,32px)] leading-tight font-semibold">{f.featuresTitle}</h2>
          </div>
          <FeatureCarousel items={f.features} icons={FEATURE_ICONS} labels={f.carousel} />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-12 sm:px-8">
        <h2 className="display-tight text-center text-[clamp(22px,2.4vw,28px)] font-semibold">{f.startTitle}</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
          {f.start.map(([title, d], i) => (
            <li key={title} className="flex flex-col gap-2 rounded-xl border border-line bg-surface pad-card">
              <span className="font-mono text-[12px] tracking-wide text-muted uppercase">{t.access.step(i + 1)}</span>
              <b className="text-[16px] font-semibold">{title}</b>
              <span className="text-[14px] text-muted">{d}</span>
            </li>
          ))}
        </ol>
        <ButtonLink href="/demo" variant="primary" size="lg" className="self-center">
          {t.extra.demo.send}
          <ArrowRight size={18} aria-hidden="true" />
        </ButtonLink>
      </section>
    </PublicShell>
  );
}

/** Example cases shown in the hero preview (synthetic). */
const PREVIEW: { name: string; status: Status; pct: number; wait: "gestoria" | "cliente"; alert?: boolean }[] = [
  { name: "Marta Ferrer Gil", status: "enviado", pct: 92, wait: "gestoria", alert: true },
  { name: "Javier Ortega Lluch", status: "revision", pct: 100, wait: "cliente" },
  { name: "Sonia Martínez Soler", status: "borrador", pct: 60, wait: "cliente" },
];

/**
 * Hero visual: a small, static preview of the gestoría's case list built from
 * the product's own components, with the client's request and a finished case
 * floating over it. Decorative only (hidden from assistive technology).
 */
function PanelPreview() {
  const { t, tr, status } = useI18n();
  const invoices = SCHEMA.flatMap((s) => s.fields).flatMap(function walk(f): typeof f[] { return [f, ...(f.kids ?? []).flatMap(walk), ...(f.fields ?? []).flatMap(walk)]; }).find((f) => f.id === "doc_rep");
  return (
    <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-[400px] py-6 select-none md:block">
      <div className="rotate-[-1.5deg] rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <b className="text-[14px] font-semibold">{t.list.title}</b>
          <span className="rounded-full bg-copper-soft px-2 py-0.5 text-[11.5px] font-semibold text-copper-text">{t.list.wait.views.gestoria} · 1</span>
        </div>
        <ul>
          {PREVIEW.map((c) => (
            <li key={c.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-line px-4 py-3 first:border-t-0">
              <span className="min-w-0 truncate text-[13.5px] font-medium">{c.name}</span>
              <StatusPill status={c.status} />
              <span className="flex items-center gap-2">
                <span className="h-1 w-24 overflow-clip rounded-sm bg-line"><i className={cx("block h-full", c.pct === 100 ? "bg-ok" : "bg-accent")} style={{ width: `${c.pct}%` }} /></span>
                {c.alert && <CircleAlert size={13} className="text-bad" />}
              </span>
              <span className={cx("text-right text-[11.5px] font-medium", c.wait === "gestoria" ? "text-accent" : "text-muted")}>{t.list.wait.row[c.wait]}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The client's answer to a request, landing in the case */}
      <div className="absolute -bottom-2 -left-6 flex w-[240px] rotate-[1.5deg] flex-col gap-1 rounded-lg border border-copper/30 bg-copper-soft p-3 shadow-card">
        <span className="flex items-center gap-2 text-[11.5px] font-semibold text-copper-text">
          <span className="grid size-5 place-items-center rounded-full bg-copper text-[9px] text-surface">GT</span>
          {t.tasks.state.done}
        </span>
        <span className="text-[13px] leading-snug font-medium">{invoices ? tr(invoices.label) : ""}</span>
      </div>

      {/* A case ready to file */}
      <div className="absolute -top-1 -right-4 flex items-center gap-2 rounded-full border border-ok/25 bg-surface py-1.5 pr-3.5 pl-1.5 shadow-card">
        <span className="grid size-6 place-items-center rounded-full bg-ok text-surface"><Check size={14} strokeWidth={3} /></span>
        <span className="text-[12.5px] font-semibold text-ok">{status("listo")}</span>
      </div>
    </div>
  );
}
