"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  FileText,
  Inbox,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Plus,
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
import { Button, Card, Eyebrow, Loading, Notice, StatusPill, cx } from "@/components/ui/primitives";

const field = "h-(--control-h) w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] outline-hidden transition-colors hover:border-muted focus:border-focus focus:ring-1 focus:ring-focus disabled:bg-sunk disabled:text-muted";
const GESTOR_ICONS: LucideIcon[] = [Inbox, FileText, MessageCircle];
const AVATAR = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-warn-soft text-warn", "bg-ok-soft text-ok"];
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
                <h1 className="display-serif mt-2 mb-4 max-w-[20ch] text-[clamp(28px,3.4vw,40px)] leading-[1.15] font-semibold">{t.landing.title(firmName)}</h1>
                <p className="max-w-[56ch] text-[16px] leading-relaxed text-muted">{t.landing.intro}</p>
                <p className="mt-4 max-w-[56ch] text-[14px] leading-relaxed text-muted">{t.landing.invited}</p>
              </div>
              <ol className="flex flex-col gap-4">
                {t.access.steps.map(([title, d], i) => (
                  <li key={title} className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3">
                    <span className="grid size-8 place-items-center rounded-full border-[1.5px] border-accent text-[14px] font-semibold text-accent" aria-hidden="true">{i + 1}</span>
                    <span>
                      <b className="block text-[16px] font-semibold">{title}</b>
                      <span className="text-[14.5px] text-muted">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Notice tone="info" title={t.access.chips[3]}>{t.access.privacy}</Notice>
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
        {/* The demo picker is fenced off so nobody mistakes it for the product's sign-in. */}
        <Card className="relative flex flex-col gap-4 border-2 border-dashed border-line-strong p-6 shadow-none sm:p-7">
          <span className="absolute -top-3 left-5 rounded-sm border border-line-strong bg-bg px-2 text-[11.5px] font-semibold tracking-wide text-muted uppercase">{t.access.protoOnly}</span>
          <h2 className="display-tight text-[20px] font-semibold">{t.access.signIn}</h2>
          <div role="tablist" aria-label={t.access.kind} className="grid grid-cols-2 rounded-md border border-line bg-sunk p-1">
            {(["cliente", "gestoria"] as const).map((k) => {
              const Icon = k === "cliente" ? UserRound : Building2;
              return (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("flex h-(--control-h-sm) items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors", tab === k ? "bg-accent text-accent-ink" : "text-muted hover:text-ink")}>
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  {k === "cliente" ? t.access.tabClient : t.access.tabGestoria}
                </button>
              );
            })}
          </div>

          {!ready ? (
            <Loading label={t.access.checking} />
          ) : tab === "cliente" ? (
            <>
              <p className="text-sm text-muted">{t.access.pick}</p>
              <ul className="-mr-1 flex max-h-[min(300px,36dvh)] flex-col gap-2 overflow-y-auto pr-1">
                {clients.map((e, i) => {
                  const n = clientName(e) || t.common.unnamedClient;
                  return (
                    <li key={e.id}>
                      <button type="button" onClick={() => enterClient(e.id)} className="group flex w-full items-center gap-3 rounded-lg border border-line bg-sunk px-3 py-2.5 text-left transition hover:border-line-strong hover:bg-surface">
                        <span className={cx("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold", AVATAR[i % AVATAR.length])}>{initials(n)}</span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[14.5px]">{n}</b>
                          <span className="text-xs text-muted">{t.access.pct(overall(e.answers).pct, !!e.example)}</span>
                        </span>
                        <StatusPill status={e.status} />
                        <ChevronRight size={16} className="shrink-0 text-muted transition-colors motion-safe:transition-[color,translate] motion-safe:duration-150 motion-safe:ease-out group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {adding ? (
                <form onSubmit={create} className="flex flex-col gap-2.5 border-t border-line pt-4">
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
                <button type="button" onClick={() => setAdding(true)} className="flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line-strong py-2.5 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent-soft">
                  <Plus size={16} aria-hidden="true" />
                  {t.access.newClient}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted">{t.access.gestoriaBody}</p>
              <ul className="flex flex-col gap-2">
                {t.access.gestoriaItems.map((g, i) => (
                  <li key={g} className="flex items-center gap-3 rounded-lg border border-line bg-sunk px-3 py-2.5 text-[14px]">
                    <IconTile icon={GESTOR_ICONS[i]} size="sm" tone={i === 0 ? "accent" : i === 1 ? "warn" : "info"} />
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
          <p className="flex gap-2 border-t border-line pt-3 text-[12.5px] text-muted">
            <Info size={15} className="mt-px shrink-0" aria-hidden="true" />
            <span>
              {t.access.footer}{" "}
              <button type="button" className="font-semibold text-accent" onClick={() => actions.resetDemo()}>
                {t.access.reset}
              </button>
            </span>
          </p>
        </Card>
        </div>
        )}

      </div>
    </PublicShell>
  );
}
