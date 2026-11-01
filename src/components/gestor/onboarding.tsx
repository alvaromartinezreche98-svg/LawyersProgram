"use client";

import Link from "next/link";
import { ArrowRight, Building2, Check, FileSignature, Landmark, QrCode, Users, type LucideIcon } from "lucide-react";
import type { Expediente, Firm } from "@/lib/data/types";
import type { SectionState } from "@/lib/questionnaire/progress";
import { useAppState } from "@/lib/data/store";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { ButtonLink, Notice, Pill, cx } from "@/components/ui/primitives";
import { SegMeter } from "@/components/ui/progress";
import { PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";

type StepId = "firm" | "legal" | "team" | "qr" | "payout";

/** What each step needs; payout waits for the back end, so it is never counted as pending work. */
const STEPS: { id: StepId; icon: LucideIcon; href: string; done: (f: Firm, cases: Expediente[]) => boolean | null }[] = [
  { id: "firm", icon: Building2, href: "/ajustes/despacho", done: (f) => !!(f.name.trim() && f.cif.trim() && (f.phone.trim() || f.email.trim())) },
  { id: "legal", icon: FileSignature, href: "/ajustes/documentos", done: (f) => !!(f.docs.privacy && f.docs.mandate) },
  { id: "team", icon: Users, href: "/ajustes/equipo", done: (f) => f.team.some((m) => m.role === "gestor") },
  // The QR is ready on Clientes; the step counts as done once a client has come in with it.
  { id: "qr", icon: QrCode, href: "/clientes", done: (_, cases) => cases.length > 0 },
  { id: "payout", icon: Landmark, href: "/ajustes/honorarios", done: () => null },
];

/**
 * All five steps count, so the figure matches the list ("2 of 5"). `ready`:
 * every step that can be done today is done (payout waits for the back end).
 */
export function onboardingProgress(firm: Firm, cases: Expediente[]) {
  const st = STEPS.map((s) => s.done(firm, cases));
  return { done: st.filter(Boolean).length, total: st.length, ready: !st.includes(false) };
}

/** A8 · Puesta en marcha: the first-run checklist of a new gestoría, each step opening its settings page. */
export function Onboarding() {
  const { p } = usePlatformText();
  const { firm, exps } = useAppState();
  const o = p.onboarding;
  const cases = Object.values(exps);
  const { done, total, ready } = onboardingProgress(firm, cases);
  const states = STEPS.map((s) => s.done(firm, cases));

  return (
    <>
      <PageTitle>{o.title}</PageTitle>
      <TopBar crumbs={[{ label: o.title }]} />
      <div className="flex flex-col gap-5 px-4 py-5 max-sm:gap-4 max-sm:py-4 sm:px-6">
        <PageHead eyebrow={o.eyebrow} title={o.title} intro={o.intro} />
        {/* Progress on one line: the count, then the five segments */}
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[13.5px] text-muted">{o.progress(done, total)}</span>
          <div className="min-w-0 flex-1"><SegMeter states={states.map((x): SectionState => (x ? "done" : "empty"))} /></div>
        </div>
        {ready && (
          <Notice tone="ok" actions={<ButtonLink href="/expedientes" size="sm" variant="primary">{o.goCases}</ButtonLink>}>{o.allDone}</Notice>
        )}
        <ol className="flex flex-col overflow-clip rounded-lg border border-line bg-surface">
          {STEPS.map((s, i) => {
            const st = states[i];
            const [title, body] = o.steps[s.id];
            // The first step still open is "you are here": terracotta, like the next step everywhere else.
            const next = st === false && states.findIndex((x) => x === false) === i;
            return (
              <li key={s.id} className="border-t border-line first:border-t-0">
                {/* The step's icon, then its title with its state beside it, the line of explanation under them */}
                <Link href={s.href} className={cx("grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-4 py-4 transition-colors hover:bg-hover max-sm:gap-x-3 max-sm:px-3 max-sm:py-3 sm:items-center sm:px-5", next && "bg-copper-soft/60 shadow-[inset_3px_0_0_var(--copper)]")}>
                  <span className="relative max-sm:mt-0.5">
                    <IconTile icon={s.icon} size="sm" tone={next ? "copper" : "accent"} className="max-sm:size-7" />
                    {st && <span className="absolute -right-1.5 -bottom-1.5 grid size-[18px] place-items-center rounded-full border-2 border-surface bg-ok text-surface"><Check size={10} strokeWidth={3.5} aria-hidden="true" /></span>}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <b className="block text-[15px] leading-5 font-semibold max-sm:text-[14px]">{i + 1}. {title}</b>
                      {/* Only the highlighted row is "next"; the other open steps are plainly "to do". */}
                      <span className="shrink-0">{st === null ? <Pill>{p.soon}</Pill> : st ? <Pill tone="ok">{o.done}</Pill> : next ? <Pill tone="copper">{o.next}</Pill> : <Pill>{o.todo}</Pill>}</span>
                    </span>
                    <span className="mt-0.5 block text-[13.5px] text-muted max-sm:text-[12.5px] max-sm:leading-[18px]">{body}</span>
                  </span>
                  <ArrowRight size={16} className="self-center text-muted max-sm:hidden" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
