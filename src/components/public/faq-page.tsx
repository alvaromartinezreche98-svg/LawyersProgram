"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, Eyebrow } from "@/components/ui/primitives";
import { PLATFORM_SITE } from "@/lib/site";
import { PublicShell } from "./public-shell";

/** P8 · Preguntas frecuentes: native <details>, one open at a time per group. */
export function FaqPage() {
  const { t } = useI18n();
  const f = t.pub.faq;
  return (
    <PublicShell>
      <PageTitle>{f.title}</PageTitle>
      <div className="mx-auto flex w-full max-w-page flex-col gap-10 px-4 py-12 sm:px-8">
        <div>
          <Eyebrow>{f.eyebrow}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,36px)] font-semibold">{f.title}</h1>
          <p className="mt-2 max-w-[62ch] text-[16px] text-muted">{f.intro}</p>
        </div>
        <Group id="clientes" title={f.clientsTitle} items={f.clients} />
        {/* Questions from gestorías about PreRenta belong on PreRenta's domain, not on a gestoría's */}
        {PLATFORM_SITE && <Group id="gestorias" title={f.firmsTitle} items={f.firms} />}
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
      {/* One card per question: open cards gain a brand edge, so the open answer is easy to find. */}
      <div className="flex flex-col gap-2.5">
        {items.map(([q, a]) => (
          <details
            key={q}
            name={`faq-${id}`}
            className="accordion group rounded-lg border border-line bg-surface shadow-sheet transition-[border-color,box-shadow] duration-200 hover:border-line-strong open:border-accent/35 open:shadow-[inset_3px_0_0_var(--accent)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-[15.5px] font-medium [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-icon-soft text-icon" aria-hidden="true">
                  <HelpCircle size={17} strokeWidth={2.1} />
                </span>
                {q}
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors group-open:border-accent group-open:bg-accent group-open:text-accent-ink" aria-hidden="true">
                <ChevronDown size={16} className="motion-safe:transition-[rotate] motion-safe:duration-200 motion-safe:ease-out group-open:rotate-180" />
              </span>
            </summary>
            <div className="max-w-[80ch] px-5 pb-5 pl-[4.25rem] text-[14.5px] leading-relaxed text-muted">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
