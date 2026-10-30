"use client";

import Link from "next/link";
import { ArrowRight, Bell, Camera, ClipboardList, FileSignature, Inbox, LayoutGrid, ListChecks, MessageCircle, QrCode, ThumbsUp, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile, HUES } from "@/components/ui/icons";
import { ChatArt, ReturnArt } from "@/components/ui/illustrations";
import { ButtonLink, Eyebrow } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

const CLIENT_ICONS: LucideIcon[] = [ListChecks, Camera, MessageCircle, FileSignature];
const GESTOR_ICONS: LucideIcon[] = [Inbox, LayoutGrid, QrCode, Bell, ThumbsUp, ClipboardList];

/** P1 · Home: what PreRenta is, for clients and for gestorías. */
export function PublicHome() {
  const { t } = useI18n();
  const h = t.pub.home;
  return (
    <PublicShell>
      <PageTitle>{h.title}</PageTitle>

      <section className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-12 sm:px-8 md:grid-cols-[minmax(0,1fr)_320px] md:py-16 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="display-serif max-w-[20ch] text-[clamp(30px,4vw,44px)] leading-[1.1] font-semibold">{h.h1}</h1>
          <p className="max-w-[60ch] text-[16px] text-muted">{h.lead}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/acceso" variant="primary" size="lg">
              {h.ctaClient}
              <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/contacto?tipo=gestoria" size="lg">
              {h.ctaGestoria}
            </ButtonLink>
          </div>
          <p className="text-[13.5px] text-muted">{h.invited}</p>
        </div>
        <ReturnArt className="mx-auto w-[240px] md:w-full" />
      </section>

      <section aria-labelledby="how" className="border-y border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-12 sm:px-8">
          <h2 id="how" className="display-tight text-[clamp(22px,2.4vw,28px)] font-semibold">{h.howTitle}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {t.access.steps.map(([title, d], i) => (
              <li key={title} className="flex flex-col gap-2 rounded-xl border border-line bg-bg p-5">
                <span className="font-mono text-[12px] tracking-wide text-muted uppercase">{t.access.step(i + 1)}</span>
                <b className="text-[16px] font-semibold">{title}</b>
                <span className="text-[14px] text-muted">{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="clients" className="mx-auto grid w-full max-w-[1200px] items-start gap-10 px-4 py-12 sm:px-8 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 id="clients" className="display-tight text-[clamp(22px,2.4vw,28px)] font-semibold">{h.clientsTitle}</h2>
          <ul className="flex flex-col gap-4">
            {h.clients.map(([title, d], i) => (
              <li key={title} className="flex items-start gap-3.5">
                <IconTile icon={CLIENT_ICONS[i]} size="sm" tone={HUES[i % HUES.length]} />
                <span>
                  <b className="block text-[15px] font-semibold">{title}</b>
                  <span className="text-[14px] text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ChatArt className="mx-auto hidden w-full max-w-[360px] md:block" />
      </section>

      <section aria-labelledby="gestorias" className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-12 sm:px-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>{h.gestoriasEyebrow}</Eyebrow>
            <h2 id="gestorias" className="display-tight text-[clamp(22px,2.4vw,28px)] font-semibold">{h.gestoriasTitle}</h2>
            <p className="max-w-[64ch] text-muted">{h.gestoriasLead}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {h.gestorias.map(([title, d], i) => (
              <li key={title} className="flex flex-col gap-2 rounded-xl border border-line bg-bg p-5">
                <IconTile icon={GESTOR_ICONS[i]} size="sm" tone={HUES[(i + 3) % HUES.length]} />
                <b className="text-[15px] font-semibold">{title}</b>
                <span className="text-[14px] text-muted">{d}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/contacto?tipo=gestoria" variant="primary">
              {h.ctaGestoria}
            </ButtonLink>
            <Link href="/acceso" className="text-[14px] font-medium text-accent hover:underline">
              {h.gestoriaSignIn}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-8">
        <p className="text-[14px] text-muted">{h.langs}</p>
      </section>
    </PublicShell>
  );
}
