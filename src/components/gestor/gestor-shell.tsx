"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, CalendarDays, Check, ChevronDown, Languages, Contact, Inbox, LayoutDashboard, LogOut, Settings, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { actions, unreadFor, useAppState } from "@/lib/data/store";
import { HTML_LANG, LANGS } from "@/lib/i18n";
import { useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Badge, Brand, Loading, cx } from "@/components/ui/primitives";
import { useSignInRedirect } from "@/lib/data/use-sign-in-redirect";
import { useRemoteInbox } from "@/lib/api/use-remote";

/** Gestoría panel frame: left sidebar (drawer on mobile) + content panel. */
export function GestorShell({ children }: { children: ReactNode }) {
  const { ready, session } = useAppState();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const allowed = session?.role === "gestoria";
  const signOut = useSignOut();
  useSignInRedirect(allowed);
  useRemoteInbox(allowed);
  // On a case page the sidebar folds to icons, to give the case more width.
  const compact = /^\/expedientes\/[^/]+$/.test(usePathname());

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  // Alt + Shift + Q signs out, as shown in the account menu.
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.altKey && e.shiftKey && e.code === "KeyQ" && signOut();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [signOut]);

  if (!ready || !allowed) return <Loading />;

  return (
    <div className={cx("gestor-shell min-h-dvh lg:grid lg:h-dvh lg:overflow-hidden", compact ? "lg:grid-cols-[64px_minmax(0,1fr)]" : "lg:grid-cols-[248px_minmax(0,1fr)]")}>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <button type="button" aria-label={t.side.menu} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg border border-line transition-colors hover:bg-sunk active:bg-sunk">
          <Menu size={18} strokeWidth={1.9} aria-hidden="true" />
        </button>
        <Brand />
      </div>

      {open && <div className="fixed inset-0 z-40 bg-[var(--scrim)] lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-[272px] bg-bg motion-safe:transition-[translate] motion-safe:duration-250 motion-safe:ease-out lg:sticky lg:top-0 lg:z-40 lg:h-dvh lg:w-auto lg:translate-x-0",
          open ? "translate-x-0 shadow-card" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={() => setOpen(false)} compact={compact} />
      </aside>

      <div className="min-w-0 lg:h-dvh lg:py-3 lg:pr-3">
        <div className="min-h-[calc(100dvh-56px)] bg-surface lg:relative lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:rounded-xl lg:border lg:border-line">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate, compact }: { onNavigate: () => void; compact: boolean }) {
  // Folded (desktop only): labels stay for screen readers and as tooltips; the drawer on phones is always full.
  const label = (text: string) => <span className={cx("flex-1", compact && "lg:sr-only")}>{text}</span>;
  const item = (on: boolean) => cx(itemCls(on), compact && "lg:justify-center lg:px-0");
  const { exps, firm } = useAppState();
  const { t } = useI18n();
  const signOut = useSignOut();
  const path = usePathname();
  const unread = Object.values(exps).filter((e) => unreadFor(e, "gestor") > 0).length;
  const inCases = path.startsWith("/expedientes");
  const inSettings = path.startsWith("/ajustes");
  const all: [LucideIcon, string, string, boolean][] = [
    [LayoutDashboard, t.side.board, "/panel", FEATURES.campaignBoard],
    [Contact, t.side.clients, "/clientes", true],
    [CalendarDays, t.side.appointments, "/citas", FEATURES.appointments],
    [Wallet, t.side.payments, "/cobros", FEATURES.payments],
  ];
  const live = all.filter((x) => x[3]);

  const firmName = firm.name.trim() || "Gestoría";

  return (
    <nav aria-label={t.side.main} className="flex h-full flex-col">
      {/* Who is signed in: the gestoría, at the top. */}
      <div className={cx("flex items-center gap-2.5 px-5 pt-5 pb-2", compact && "lg:justify-center lg:px-0")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-[13px] font-bold text-accent-ink" title={compact ? firmName : undefined} aria-hidden={!compact}>
          {firmName[0].toUpperCase()}
        </span>
        <span className={cx("min-w-0 flex-1", compact && "lg:sr-only")}>
          <span className="block truncate text-[14.5px] font-semibold">{firmName}</span>
          <span className="block truncate text-[11.5px] text-muted">PreRenta · {t.common.taxYear(EJERCICIO)}</span>
        </span>
        <button type="button" aria-label={t.side.closeMenu} onClick={onNavigate} className="px-2 text-xl text-muted lg:hidden">
          ×
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link href="/expedientes" onClick={onNavigate} title={compact ? t.nav.cases : undefined} aria-current={inCases ? "page" : undefined} className={cx(item(inCases), "relative")}>
              <Inbox size={16} strokeWidth={1.9} aria-hidden="true" />
              {label(t.nav.cases)}
              <span className={cx(compact && "lg:absolute lg:-top-1 lg:right-1")}><Badge n={unread} /></span>
            </Link>
          </li>
          {live.map(([LiveIcon, text, href]) => (
            <li key={href}>
              <Link href={href} onClick={onNavigate} title={compact ? text : undefined} aria-current={path.startsWith(href) ? "page" : undefined} className={item(path.startsWith(href))}>
                <LiveIcon size={16} strokeWidth={1.9} aria-hidden="true" />
                {label(text)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Account: settings, language and sign-out, under a divider. */}
        <ul className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
          {FEATURES.firmSettings && (
            <li>
              <Link href="/ajustes/despacho" onClick={onNavigate} title={compact ? t.side.settings : undefined} aria-current={inSettings ? "page" : undefined} className={item(inSettings)}>
                <Settings size={16} strokeWidth={1.9} aria-hidden="true" />
                {label(t.side.settings)}
              </Link>
            </li>
          )}
          <li>
            <span className={cx(item(false), "cursor-default opacity-55 hover:bg-transparent hover:shadow-none hover:ring-0")} aria-disabled="true" title={compact ? `${t.side.invite} · ${t.side.soon}` : undefined}>
              <UserPlus size={16} strokeWidth={1.9} aria-hidden="true" />
              {label(t.side.invite)}
              <span className={cx("rounded border border-line px-1.5 text-[10.5px] font-medium", compact && "lg:hidden")}>{t.side.soon}</span>
            </span>
          </li>
          <li>
            <LangMenu compact={compact} item={item} />
          </li>
          <li>
            <button type="button" onClick={signOut} title={compact ? t.common.signOut : "Alt ⇧ Q"} className={cx(item(false), "w-full text-left")}>
              <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
              {label(t.common.signOut)}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

/** Language row: shows the current language by name and opens the list in place (nothing to clip, works folded too). */
function LangMenu({ compact, item }: { compact: boolean; item: (on: boolean) => string }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.id === lang)!;
  // Keeps <html lang> in step, as the header language switch does elsewhere.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);
  return (
    <>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} title={compact ? `${t.common.language}: ${cur.label}` : undefined} className={cx(item(false), "w-full text-left")}>
        <Languages size={16} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
        <span className={cx("flex-1", compact && "lg:sr-only")}>{t.common.language}</span>
        <span className={cx("text-[13px] font-normal text-muted", compact && "lg:hidden")}>{cur.label}</span>
        <ChevronDown size={14} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180", compact && "lg:hidden")} aria-hidden="true" />
      </button>
      {open && (
        <ul role="group" aria-label={t.common.language} className={cx("mt-0.5 mb-1 ml-[26px] flex flex-col gap-0.5", compact && "lg:ml-0")}>
          {LANGS.map((l) => {
            const on = l.id === lang;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => actions.setLang(l.id)}
                  title={compact ? l.label : undefined}
                  className={cx("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] transition", on ? "bg-surface font-semibold text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-surface hover:text-ink hover:shadow-sm hover:ring-1 hover:ring-line", compact && "lg:justify-center lg:px-0")}
                >
                  <span className={cx("flex-1", compact && "lg:hidden")}>{l.label}</span>
                  <span className={cx("hidden text-[11.5px] font-semibold", compact && "lg:inline")}>{l.short}</span>
                  {on && <Check size={14} className={cx("shrink-0 text-accent", compact && "lg:hidden")} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const itemCls = (on: boolean) =>
  cx("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[14px] font-medium transition", on ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-surface hover:text-ink hover:shadow-sm hover:ring-1 hover:ring-line");


/** Sticky header inside the content panel: breadcrumbs on the left, actions on the right. */
export function TopBar({ crumbs, right }: { crumbs: { label: string; href?: string }[]; right?: ReactNode }) {
  return (
    <div className="sticky top-14 z-10 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-4 py-2 sm:px-6 lg:top-0 lg:rounded-t-xl">
      <ol className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-muted">›</span>}
            {c.href ? (
              <Link href={c.href} className="whitespace-nowrap text-muted hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-semibold">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
      {right}
    </div>
  );
}
