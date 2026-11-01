"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Building2, CircleCheck, KeyRound, Landmark, Plus, UserRound, X } from "lucide-react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { actions, clientName, useAppState } from "@/lib/data/store";
import { nextPath } from "@/lib/data/use-sign-in-redirect";
import { useI18n } from "@/lib/i18n/use-i18n";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { FEATURES } from "@/lib/features";
import { CLERK_ENABLED, DEMO_LOGIN } from "@/lib/auth/config";
import { ClerkAccess } from "@/components/auth/clerk-access";
import { PublicShell } from "@/components/public/public-shell";
import { PageTitle } from "@/components/ui/app-shell";
import s from "./access-screen.module.scss";
import { Button, Eyebrow, Loading, cx } from "@/components/ui/primitives";
import { FieldIcon } from "@/components/ui/field-icon";
import { IconTile } from "@/components/ui/icons";

type Role = "cliente" | "gestoria";

/**
 * The one entry page, on "/" and "/acceso" (design system › Access): led by
 * the gestoría behind this domain, with sign-in on the right. With Clerk the
 * sign-in is Clerk's; without it the panel is the demo entry (invitation code,
 * sample cases, gestoría panel), marked as such.
 */
/** The demo shortcut into the PreRenta team's area; not in the sitemap, kept off until it is wanted. */
const SHOW_ADMIN_ENTRY = false;

export function AccessScreen() {
  return CLERK_ENABLED ? <ClerkAccess render={(gate, banner) => <DemoAccess gate={gate} banner={banner} />} /> : <DemoAccess />;
}

/**
 * The access page. `gate` replaces the demo panel (Clerk sign-in, loading,
 * errors); `banner` sits above it when the demo panel is shown after a Clerk sign-in.
 */
function DemoAccess({ gate, banner }: { gate?: ReactNode; banner?: ReactNode }) {
  const { ready, exps, firm } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Role>("cliente");
  const [samplesOpen, setSamplesOpen] = useState(false);
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
      setSamplesOpen(true);
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
    <PublicShell bare>
      <PageTitle>{firmName}</PageTitle>
      {/*
        Entry page (design system › Access): one screen, no scroll. On phones intro → sign-in;
        from 1280px one large card holds the story and, on a tinted side, the sign-in.
      */}
      <div className={s.home}>
        <div className={s.frame}>
          <header className={s.intro}>
            <Eyebrow>{t.landing.eyebrow(EJERCICIO)}</Eyebrow>
            <HeroTitle parts={t.landing.title} />
            {/* From 1280px here; on phones and tablets it moves under the sign-in (below), so the sign-in sits right under the headline */}
            <p className={cx("hero-rise", s.lede, s.ledeWide)} style={{ "--d": "420ms" } as CSSProperties}>{t.landing.intro}</p>
            {/* Who prepares the return, set like the head of a tax form. */}
            <dl className={cx("ledger hero-rise", s.ledger)} style={{ "--d": "500ms" } as CSSProperties}>
              {firm.name.trim() && (
                <div>
                  <dt>{t.landing.ledgerFirm}</dt>
                  <dd>{firmName}</dd>
                </div>
              )}
              <div>
                <dt>{t.landing.ledgerYear}</dt>
                <dd className="figures">{EJERCICIO}</dd>
              </div>
            </dl>
          </header>

          <div className={s.access}>
            {gate ?? (
              <>
                {banner}
                <SignInPanel firmName={firmName} ready={ready} tab={tab} setTab={setTab} onGestoria={enterGestoria} />
                {/* Demo aids live in their own card under the sign-in, never inside the real path. */}
                {DEMO_LOGIN && ready && (
                  <DemoCard
                    clients={clients}
                    open={samplesOpen}
                    setOpen={setSamplesOpen}
                    adding={adding}
                    setAdding={setAdding}
                    name={name}
                    setName={setName}
                    email={email}
                    setEmail={setEmail}
                    onClient={enterClient}
                    onAdmin={() => {
                      actions.loginAdmin();
                      router.push("/admin/gestorias");
                    }}
                    onCreate={create}
                  />
                )}
              </>
            )}
          </div>
          {/* Phones and tablets: the page's promise, after the sign-in */}
          <p className={cx(s.lede, s.ledeNarrow)}>{t.landing.intro}</p>
        </div>
      </div>
    </PublicShell>
  );
}

type Case = ReturnType<typeof useAppState>["exps"][string];

/**
 * The entry panel without Clerk. It opens on the client's path (most visitors):
 * the invitation code, the same /invitacion/<code> route the link and QR open.
 * The other role is a separate button under it that switches the panel, so each
 * path stands on its own instead of sharing tabs. With Clerk on, the `gate`
 * replaces this panel entirely.
 */
function SignInPanel(p: { firmName: string; ready: boolean; tab: Role; setTab: (t: Role) => void; onGestoria: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const [code, setCode] = useState("");
  const other = p.tab === "cliente"
    ? { id: "gestoria" as const, icon: Building2, label: t.landing.roleFirm, hint: t.landing.roleFirmHint }
    : { id: "cliente" as const, icon: UserRound, label: t.landing.roleClient, hint: t.landing.roleClientHint };

  const openCode = (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (c) router.push(`/invitacion/${encodeURIComponent(c)}`);
  };

  return (
    <>
    <section aria-labelledby="signin-title" className={s.panel}>
      <div className={s.panelHead}>
        <p className="eyebrow-tag">{p.tab === "cliente" ? t.landing.roleClient : t.landing.roleFirm}</p>
        <h2 id="signin-title" className={s.panelTitle}>{t.landing.panelTitle}</h2>
      </div>

      <div className={s.panelBody}>
        {!p.ready ? (
          <Loading label={t.landing.loading} />
        ) : p.tab === "cliente" ? (
          <>
            <p className={s.lead}>{t.landing.clientLead(p.firmName)}</p>
            <form onSubmit={openCode} className={s.codeForm}>
              <label htmlFor="inv-code" className={s.label}>{t.landing.codeLabel}</label>
              <div className={s.codeRow}>
                {/* A key at the start says what goes here; a tick once something is typed. */}
                <span className={s.codeField}>
                  <KeyRound size={18} strokeWidth={2} className={s.codeKey} aria-hidden="true" />
                  <input id="inv-code" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} className="field" />
                  {code.trim() && <CircleCheck size={18} strokeWidth={2.2} className={s.codeTick} aria-hidden="true" />}
                </span>
                <Button type="submit" variant="primary" className={s.codeSubmit}>
                  {t.landing.codeSubmit}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className={s.lead}>{t.landing.firmLead(p.firmName)}</p>
            <Button variant="primary" size="lg" onClick={p.onGestoria} className={s.codeSubmit}>
              {t.landing.firmEnter}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </section>

    {/* The other role: a quieter card of its own under the sign-in, not part of it. */}
    <button type="button" onClick={() => p.setTab(other.id)} className={s.switchRole}>
      <span className={s.switchIcon} aria-hidden="true"><other.icon size={17} strokeWidth={2} /></span>
      <span className={s.switchText}>
        <b>{other.label}</b>
        <span>{other.hint}</span>
      </span>
      <ArrowRight size={16} className={s.switchArrow} aria-hidden="true" />
    </button>
    </>
  );
}

/** Demo build only: a quiet card that opens the sample cases and a new test client in a dialog. */
function DemoCard(p: {
  clients: Case[];
  open: boolean;
  setOpen: (v: boolean) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onClient: (id: string) => void;
  onCreate: (e: FormEvent) => void;
  onAdmin: () => void;
}) {
  const { t } = useI18n();
  const { p: pt } = usePlatformText();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (p.open && !d.open) {
      d.showModal();
      d.focus(); // focus the dialog itself, not its close button (no ring on a mouse open; Tab goes on into it)
    }
    if (!p.open && d.open) d.close();
  }, [p.open]);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => p.setOpen(true)} className={cx(s.switchRole, s.demoTrigger)}>
        <span className={s.switchIcon} aria-hidden="true"><span className={s.demoTag}>{t.landing.demoTag}</span></span>
        <span className={s.switchText}>
          <b>{t.landing.samples}</b>
          <span>{t.landing.samplesHint}</span>
        </span>
        <ArrowRight size={16} className={s.switchArrow} aria-hidden="true" />
      </button>
      {/* A click on the backdrop (the dialog itself, outside its content) or Escape closes it. */}
      <dialog ref={dialog} tabIndex={-1} aria-labelledby="demo-title" className={s.demoDialog} onClose={() => p.setOpen(false)} onClick={(e) => e.target === e.currentTarget && p.setOpen(false)}>
        <div className={s.demoHead}>
          <span className={s.switchIcon} aria-hidden="true"><span className={s.demoTag}>{t.landing.demoTag}</span></span>
          <span className={s.demoTitle}>
            <span id="demo-title">{t.landing.samples}</span>
            <span className={s.demoHint}>{t.landing.samplesHint}</span>
          </span>
          <button type="button" onClick={() => p.setOpen(false)} aria-label={t.common.close} className={s.demoClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ul className={s.cases}>
          {p.clients.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => p.onClient(e.id)} className={s.case}>
                <span className={s.caseName}>{clientName(e) || t.common.unnamedClient}</span>
                <ArrowRight size={15} className={s.caseArrow} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className={s.demoFoot}>
          {p.adding ? (
            <form onSubmit={p.onCreate} className={s.newForm}>
              <b className={s.newTitle}>{t.access.newClient}</b>
              <label className="sr-only" htmlFor="nc-name">{t.access.name}</label>
              <input id="nc-name" required autoFocus value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder={t.access.name} autoComplete="name" className="field" />
              <label className="sr-only" htmlFor="nc-email">{t.access.email}</label>
              <FieldIcon kind="email"><input id="nc-email" type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} placeholder={t.access.email} autoComplete="email" className="field" /></FieldIcon>
              <Button type="submit" variant="primary">{t.access.create}</Button>
            </form>
          ) : (
            <span className={s.demoActions}>
              <button type="button" onClick={() => p.setAdding(true)} className={s.textBtn}>
                <Plus size={15} aria-hidden="true" />
                {t.access.newClient}
              </button>
              <button type="button" onClick={() => actions.resetDemo()} className={s.textBtn}>
                {t.access.reset}
              </button>
            </span>
          )}
          {/* The PreRenta team's own area (X1–X4), apart from the gestoría and its clients. Hidden for now: set SHOW_ADMIN_ENTRY to bring it back. */}
          {SHOW_ADMIN_ENTRY && FEATURES.platformAdmin && (
            <button type="button" onClick={p.onAdmin} className={s.adminRow}>
              <IconTile icon={Landmark} size="sm" />
              <span>
                <b>{pt.access.admin}</b>
                <span>{pt.access.adminHint}</span>
              </span>
              <ArrowRight size={15} className={s.caseArrow} aria-hidden="true" />
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}

/**
 * The landing headline: the words rise in one after another, then the closing
 * phrase ("con la ayuda de su gestoría") fades in, underlined in terracotta.
 * It is inline, so a long phrase wraps like any text. Screen readers get the
 * sentence once; reduced motion shows it still.
 */
function HeroTitle({ parts: [lead, mark] }: { parts: [string, string] }) {
  const words = lead.split(/\s+/).filter(Boolean);
  return (
    <h1 aria-label={`${lead} ${mark}`} className={s.title}>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="hero-word" style={{ "--d": `${i * 60}ms` } as CSSProperties}>
              {w}
            </span>{" "}
          </Fragment>
        ))}
        <span className={cx("hero-rise", s.mark)} style={{ "--d": `${words.length * 60 + 80}ms` } as CSSProperties}>
          {mark}
        </span>
      </span>
    </h1>
  );
}
