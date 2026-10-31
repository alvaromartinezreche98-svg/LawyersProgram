"use client";

import { ArrowRight, Check } from "lucide-react";
import { usePlatform } from "@/lib/data/platform";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { FEATURES } from "@/lib/features";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, Eyebrow } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

/**
 * P4 · Precios. Prices are not decided yet, so no figure is made up: the plans
 * the PreRenta team enters in X3 show here; until then, "price to be
 * confirmed", what every plan includes, and the way to ask for a proposal.
 */
export function PricingPage() {
  const { p } = usePlatformText();
  const { plans } = usePlatform();
  const r = p.pricing;
  const named = plans.filter((x) => x.name.trim());

  return (
    <PublicShell>
      <PageTitle>{r.title}</PageTitle>
      <section className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pt-16 pb-10 sm:px-8 md:pt-20">
        <Eyebrow>{r.eyebrow}</Eyebrow>
        <h1 className="display-serif max-w-[24ch] text-[clamp(28px,3.6vw,40px)] leading-[1.12] font-semibold">{r.h1}</h1>
        <p className="max-w-[62ch] text-[16px] text-muted">{r.intro}</p>
      </section>

      <section className="mx-auto grid w-full max-w-page items-start gap-6 px-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
          {(named.length ? named : [null]).map((x, i) => (
            <li key={x?.id ?? i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-sheet first:border-t-[3px] first:border-t-copper">
              {x && <b className="text-[17px] font-semibold">{x.name}</b>}
              <p className="flex items-baseline gap-1.5">
                {x?.price ? (
                  <>
                    <span className="figures text-[32px] leading-none font-semibold">{x.price} €</span>
                    <span className="text-[14px] text-muted">{r.perMonth}</span>
                  </>
                ) : (
                  <span className="text-[20px] font-semibold text-copper-text">{r.tbd}</span>
                )}
              </p>
              {x?.cases && <p className="text-[14px] text-muted">{r.casesN(x.cases)}</p>}
              {x?.notes && <p className="text-[14px] whitespace-pre-line text-muted">{x.notes}</p>}
              <span className="mt-2 flex flex-wrap gap-2">
                <ButtonLink href="/demo" variant="primary">
                  {r.demo}
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
                {FEATURES.platformAdmin && <ButtonLink href="/alta-gestoria">{r.signup}</ButtonLink>}
              </span>
            </li>
          ))}
        </ul>

        <aside className="rounded-xl border border-line bg-surface p-6">
          <h2 className="mb-4 text-[16px] font-semibold">{r.included}</h2>
          <ul className="flex flex-col gap-3">
            {r.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[14.5px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
                {f}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </PublicShell>
  );
}
