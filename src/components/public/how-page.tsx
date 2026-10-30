"use client";

import Link from "next/link";
import { ArrowRight, Check, FileCheck2, FileSignature, ListChecks, Mail, MessageCircle, QrCode, Upload, type LucideIcon } from "lucide-react";
import { NO_NEED_TO_UPLOAD } from "@/lib/questionnaire/schema";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { ButtonLink, Card, Eyebrow } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

const STEP_ICONS: LucideIcon[] = [QrCode, Mail, ListChecks, Upload, FileSignature, MessageCircle, FileCheck2];

/** P2 · Cómo funciona: the taxpayer's journey, step by step. */
export function HowPage() {
  const { t, tr } = useI18n();
  const h = t.pub.how;
  return (
    <PublicShell>
      <PageTitle>{h.title}</PageTitle>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 sm:px-8">
        <div>
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,36px)] font-semibold">{h.title}</h1>
          <p className="mt-2 max-w-[62ch] text-[16px] text-muted">{h.intro}</p>
        </div>

        <ol className="flex flex-col gap-3">
          {h.steps.map(([title, d], i) => (
            <li key={title} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 rounded-xl border border-line bg-surface p-5">
              <IconTile icon={STEP_ICONS[i]} size="lg" />
              <div>
                <span className="font-mono text-[12px] tracking-wide text-muted uppercase">{t.access.step(i + 1)}</span>
                <h2 className="display-tight text-[17px] font-semibold">{title}</h2>
                <p className="mt-1 max-w-[70ch] text-[14.5px] text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grid items-start gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3 p-5 sm:p-6">
            <h2 className="display-tight text-[17px] font-semibold">{h.haveTitle}</h2>
            <ul className="flex flex-col gap-2 text-[14.5px]">
              {h.have.map((x) => (
                <li key={x} className="flex items-start gap-2.5">
                  <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-3 bg-sunk p-5 sm:p-6">
            <h2 className="display-tight text-[17px] font-semibold">{h.noNeedTitle}</h2>
            <ul className="list-disc ps-5 text-[14.5px] text-muted">
              {NO_NEED_TO_UPLOAD.map((x) => (
                <li key={x.es}>{tr(x)}</li>
              ))}
            </ul>
            <p className="text-[13px] text-muted">{h.noNeedFoot}</p>
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
