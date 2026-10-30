"use client";

import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, Eyebrow } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

/** P8 · Preguntas frecuentes: native <details>, one open at a time per group. */
export function FaqPage() {
  const { t } = useI18n();
  const f = t.pub.faq;
  return (
    <PublicShell>
      <PageTitle>{f.title}</PageTitle>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 sm:px-8">
        <div>
          <Eyebrow>{f.eyebrow}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,36px)] font-semibold">{f.title}</h1>
          <p className="mt-2 max-w-[62ch] text-[16px] text-muted">{f.intro}</p>
        </div>
        <Group id="clientes" title={f.clientsTitle} items={f.clients} />
        <Group id="gestorias" title={f.firmsTitle} items={f.firms} />
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5">
          <span className="text-[15px] font-medium">{f.more}</span>
          <ButtonLink href="/contacto" size="sm">{f.contact}</ButtonLink>
        </div>
      </div>
    </PublicShell>
  );
}

function Group({ id, title, items }: { id: string; title: string; items: [string, string][] }) {
  return (
    <section aria-labelledby={`faq-${id}`} className="flex flex-col gap-3">
      <h2 id={`faq-${id}`} className="display-tight text-[19px] font-semibold">{title}</h2>
      <div className="overflow-clip rounded-xl border border-line bg-surface">
        {items.map(([q, a]) => (
          <details key={q} name={`faq-${id}`} className="accordion group border-t border-line first:border-t-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium transition-colors hover:bg-sunk [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown size={18} className="shrink-0 text-muted motion-safe:transition-[rotate] motion-safe:duration-200 motion-safe:ease-out group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="max-w-[80ch] px-5 pt-3.5 pb-5 text-[14.5px] leading-relaxed text-muted">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
