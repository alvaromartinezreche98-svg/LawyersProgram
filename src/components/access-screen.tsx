"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  FileText,
  Inbox,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { overall } from "@/lib/questionnaire/progress";
import { actions, clientName, useAppState } from "@/lib/data/store";
import { nextPath } from "@/lib/data/use-sign-in-redirect";
import { useI18n } from "@/lib/i18n/use-i18n";
import { CLERK_ENABLED } from "@/lib/auth/config";
import { ClerkAccess } from "@/components/auth/clerk-access";
import { PublicShell } from "@/components/public/public-shell";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, Eyebrow, Loading, StatusPill, cx } from "@/components/ui/primitives";

const field = "field";
const GESTOR_ICONS: LucideIcon[] = [Inbox, FileText, MessageCircle];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/**
 * The one entry page, on "/" and "/acceso" (design system › Access): led by
 * the gestoría behind this domain, with sign-in on the right. Without Clerk
 * the sign-in panel is the prototype's profile picker, fenced off.
 */
export function AccessScreen() {
  return CLERK_ENABLED ? <ClerkAccess render={(gate, banner) => <DemoAccess gate={gate} banner={banner} />} /> : <DemoAccess />;
}

/**
 * The access page. `gate` replaces the demo panel (Clerk sign-in, loading,
 * errors); `banner` sits above it when the demo picker is shown after a Clerk sign-in.
 */
function DemoAccess({ gate, banner }: { gate?: ReactNode; banner?: ReactNode }) {
  const { ready, exps, firm } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"cliente" | "gestoria">("cliente");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const firmName = firm.name.trim() || t.landing.yourFirm;
  const clients = Object.values(exps).sort((a, b) => clientName(a).localeCompare(clientName(b)));

  // Invitation links from G4: ?expediente=<id> opens that client's case, ?alta=1 (gestoría QR) opens the new-client form.
  const locked = !!gate;
  useEffect(() => {
    if (!ready || locked) return;
    const p = new URLSearchParams(window.location.search);
    const invited = p.get("expediente");
    if (invited) {
      router.replace(`/invitacion/${encodeURIComponent(invited)}`);
      return;
    }
    if (p.get("alta") !== "1") return;
    const raf = requestAnimationFrame(() => {
      setTab("cliente");
      setAdding(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [ready, locked, exps, router]);

  const enterClient = (id: string) => {
    actions.loginClient(id);
    router.push(nextPath("cliente") ?? "/inicio");
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    enterClient(actions.createClient(name.trim(), email.trim()));
  };
  const enterGestoria = () => {
    actions.loginGestoria();
    router.push(nextPath("gestoria") ?? "/expedientes");
  };

  return (
    <PublicShell>
      <PageTitle>{firmName}</PageTitle>
      {/* Design system › Access: intro, how it works, who sees the data, then sign-in; side by side from 880px. */}
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-8 px-4 py-10 sm:px-8 min-[880px]:grid-cols-[minmax(0,1fr)_420px] min-[880px]:gap-x-12">
        <section className="flex min-w-0 flex-col gap-8">
          <div className="grid items-center gap-8">
            <div className="flex min-w-0 flex-col gap-5">
              <div>
                <Eyebrow>{t.landing.eyebrow(EJERCICIO)}</Eyebrow>
                <HeroTitle text={t.landing.title(firmName)} firm={firmName} />
                <p className="hero-rise max-w-[56ch] text-[17px] leading-relaxed text-muted [--d:560ms]">{t.landing.intro}</p>
                <p className="hero-rise mt-4 max-w-[56ch] text-[14px] leading-relaxed text-muted [--d:640ms]">{t.landing.invited}</p>
              </div>
              <ol className="flex flex-col gap-4">
                {t.access.steps.map(([title, d], i) => (
                  <li key={title} style={{ "--d": `${760 + i * 140}ms` } as CSSProperties} className="hero-rise relative grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3">
                    {/* the three steps are one path: a line runs from each number to the next */}
                    {i < t.access.steps.length - 1 && <span className="absolute top-9 bottom-[-0.75rem] left-[15.5px] w-px bg-line-strong/40" aria-hidden="true" />}
                    <span className={cx("relative grid size-8 place-items-center rounded-full text-[14px] font-semibold", i === t.access.steps.length - 1 ? "bg-accent text-accent-ink" : "border-[1.5px] border-accent bg-surface text-accent")} aria-hidden="true">{i + 1}</span>
                    <span>
                      <b className="block text-[16px] font-semibold">{title}</b>
                      <span className="text-[14.5px] text-muted">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="flex gap-3.5 rounded-lg border border-line bg-surface p-4">
                <IconTile icon={ShieldCheck} size="sm" />
                <p className="text-[14px] leading-[21px] text-muted">
                  <b className="block text-[15px] font-semibold text-ink">{t.access.chips[3]}</b>
                  {t.access.privacy}
                </p>
              </div>
              {(firm.phone || firm.email || firm.address) && (
                <div className="flex flex-col gap-1.5 border-t border-line pt-4 text-[14px]">
                  <b className="font-semibold">{t.landing.contact(firmName)}</b>
                  <span className="flex flex-wrap gap-x-5 gap-y-1">
                    {firm.phone && <a href={`tel:${firm.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 text-accent hover:underline"><Phone size={15} aria-hidden="true" />{firm.phone}</a>}
                    {firm.email && <a href={`mailto:${firm.email}`} className="inline-flex items-center gap-1.5 text-accent hover:underline"><Mail size={15} aria-hidden="true" />{firm.email}</a>}
                    {firm.address && <span className="text-muted">{firm.address}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {gate ?? (
        <div className="flex min-w-0 flex-col gap-3">
        {banner}
        {/*
          Sign-in sheet. It reads as a paper form from the gestoría: a navy head with the
          title and a "prototype" stamp (so nobody mistakes the demo picker for the real
          sign-in), underline tabs, and plain rows separated by hairlines. A second sheet
          peeks out behind it.
        */}
        <div className="relative">
          <div className="absolute inset-x-3 -bottom-2 top-3 rounded-xl border border-line bg-paper-white" aria-hidden="true" />
          <section aria-labelledby="signin-title" className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_40px_-24px_rgb(28_37_48/0.45)]">
            <header className="relative overflow-hidden bg-[var(--band)] px-6 pt-6 pb-5 text-[var(--band-ink)] sm:px-7">
              {/* Monogram watermark: the firm's initial, oversized and quiet */}
              <span className="display-serif pointer-events-none absolute -top-6 -right-2 text-[150px] leading-none font-semibold text-white/[.06] select-none" aria-hidden="true">
                {firmName[0]?.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--band-copper)]/60 px-1.5 py-px text-[10.5px] font-semibold tracking-[.12em] text-[var(--band-copper)] uppercase">
                <span className="size-1.5 rounded-full bg-[var(--band-copper)]" aria-hidden="true" />
                {t.access.protoOnly}
              </span>
              <h2 id="signin-title" className="display-serif mt-3 text-[26px] leading-8 font-semibold">{t.access.signIn}</h2>
              <p className="mt-1 text-[14px] text-[var(--band-muted)]">{firmName} · {t.common.taxYear(EJERCICIO)}</p>
            </header>

            <div role="tablist" aria-label={t.access.kind} className="grid grid-cols-2 border-b border-line">
              {(["cliente", "gestoria"] as const).map((k) => {
                const Icon = k === "cliente" ? UserRound : Building2;
                const on = tab === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(k)}
                    className={cx(
                      "-mb-px flex h-[52px] items-center justify-center gap-2.5 border-b-[3px] text-[14.5px] font-semibold transition-colors",
                      on ? "border-copper text-ink" : "border-transparent text-muted hover:bg-hover hover:text-ink",
                    )}
                  >
                    <span className={cx("grid size-7 place-items-center rounded-md transition-colors", on ? "bg-accent text-accent-ink" : "bg-icon-soft text-icon")}>
                      <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    {k === "cliente" ? t.access.tabClient : t.access.tabGestoria}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 px-6 pt-5 pb-6 sm:px-7">
              {!ready ? (
                <Loading label={t.access.checking} />
              ) : tab === "cliente" ? (
                <>
                  <p className="text-[14px] text-muted">{t.access.pick}</p>
                  <ul className="-mx-6 flex max-h-[min(320px,40dvh)] flex-col overflow-y-auto border-y border-line sm:-mx-7">
                    {clients.map((e) => {
                      const n = clientName(e) || t.common.unnamedClient;
                      const pct = overall(e.answers).pct;
                      return (
                        <li key={e.id} className="border-t border-line first:border-t-0 [&>button]:px-6 sm:[&>button]:px-7">
                          <button
                            type="button"
                            onClick={() => enterClient(e.id)}
                            className="group relative flex w-full items-center gap-3.5 px-3 py-3 text-left transition-colors hover:bg-hover"
                          >
                            <span className="absolute inset-y-0 left-0 w-[3px] origin-center scale-y-0 bg-copper transition-transform duration-200 group-hover:scale-y-100" aria-hidden="true" />
                            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-[13px] font-semibold tracking-wide text-accent-ink">{initials(n)}</span>
                            {/* Name on its own line (never squeezed); progress, example and status on the line below */}
                            <span className="min-w-0 flex-1">
                              <b className="block truncate text-[15px] font-semibold">{n}</b>
                              <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                <span className="h-1 w-16 overflow-hidden rounded-full bg-line" aria-hidden="true">
                                  <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                                </span>
                                <span className="figures text-[12px] whitespace-nowrap text-muted">
                                  {pct} %{e.example ? ` · ${t.common.example.toLowerCase()}` : ""}
                                </span>
                                <StatusPill status={e.status} />
                              </span>
                            </span>
                            <ArrowRight size={16} className="shrink-0 text-muted transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {adding ? (
                    <form onSubmit={create} className="flex flex-col gap-2.5 rounded-lg bg-bg p-4">
                      <b className="text-sm">{t.access.newClient}</b>
                      <label className="sr-only" htmlFor="nc-name">
                        {t.access.name}
                      </label>
                      <input id="nc-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t.access.name} autoComplete="name" className={field} />
                      <label className="sr-only" htmlFor="nc-email">
                        {t.access.email}
                      </label>
                      <input id="nc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.access.email} autoComplete="email" className={field} />
                      <Button type="submit" variant="primary">
                        {t.access.create}
                      </Button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setAdding(true)} className="group flex items-center gap-3 rounded-md px-0 py-1 text-left text-[14.5px] font-semibold text-accent">
                      <span className="grid size-10 place-items-center rounded-md border-[1.5px] border-dashed border-line-strong transition-colors group-hover:border-accent group-hover:bg-accent-soft">
                        <Plus size={17} aria-hidden="true" />
                      </span>
                      <span className="underline-offset-4 group-hover:underline">{t.access.newClient}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[14px] text-muted">{t.access.gestoriaBody}</p>
                  <ul className="flex flex-col">
                    {t.access.gestoriaItems.map((g, i) => (
                      <li key={g} className="flex items-center gap-3.5 border-t border-line py-3 text-[14.5px] first:border-t-0">
                        <IconTile icon={GESTOR_ICONS[i]} size="sm" />
                        {g}
                      </li>
                    ))}
                  </ul>
                  <Button variant="primary" size="lg" onClick={enterGestoria}>
                    {t.access.enterGestoria}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </>
              )}
            </div>
            <p className="flex gap-2 border-t border-line bg-bg px-6 py-3.5 text-[12.5px] text-muted sm:px-7">
              <Info size={15} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                {t.access.footer}{" "}
                <button type="button" className="font-semibold text-accent underline-offset-4 hover:underline" onClick={() => actions.resetDemo()}>
                  {t.access.reset}
                </button>
              </span>
            </p>
          </section>
        </div>
        </div>
        )}

      </div>
    </PublicShell>
  );
}

/**
 * The landing headline, the first thing a visitor reads: the words rise in one
 * after another, then a copper rule draws under the gestoría's name, so the
 * idea (your tax return, done with your own gestoría) lands at a glance.
 * Screen readers get the sentence once; reduced motion shows it still.
 */
function HeroTitle({ text, firm }: { text: string; firm: string }) {
  const at = firm ? text.indexOf(firm) : -1;
  const before = at >= 0 ? text.slice(0, at) : text;
  const after = at >= 0 ? text.slice(at + firm.length) : "";
  const words = before.split(/(\s+)/).filter((w) => w.trim());
  return (
    <h1 aria-label={text} className="display-serif mt-3 mb-5 max-w-[16ch] text-[clamp(34px,4.6vw,56px)] leading-[1.06] font-semibold tracking-[-0.015em]">
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="hero-word" style={{ "--d": `${i * 70}ms` } as CSSProperties}>
              {w}
            </span>{" "}
          </Fragment>
        ))}
        {at >= 0 && (
          <span className="hero-word relative inline-block whitespace-nowrap text-accent" style={{ "--d": `${words.length * 70 + 60}ms` } as CSSProperties}>
            {firm}
            <span className="hero-rule absolute inset-x-0 -bottom-1 h-[0.09em] rounded-full bg-copper" style={{ "--d": `${words.length * 70 + 380}ms` } as CSSProperties} />
          </span>
        )}
        {after && <span className="hero-word" style={{ "--d": `${words.length * 70 + 120}ms` } as CSSProperties}>{after}</span>}
      </span>
    </h1>
  );
}
