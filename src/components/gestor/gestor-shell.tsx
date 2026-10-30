"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Menu, Search, CalendarDays, Check, ChevronDown, Languages, Contact, Inbox, LayoutDashboard, LogOut, Settings, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/icons";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { actions, unreadFor, useAppState } from "@/lib/data/store";
import { HTML_LANG, LANGS } from "@/lib/i18n";
import { useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Badge, Brand, Loading, cx } from "@/components/ui/primitives";
import { useSignInRedirect } from "@/lib/data/use-sign-in-redirect";
import { useRemoteInbox } from "@/lib/api/use-remote";
import { QuickSearch, useQuickSearchKey } from "./quick-search";

/** Gestoría panel frame: left sidebar (drawer on mobile) + content panel. */
export function GestorShell({ children }: { children: ReactNode }) {
  const { ready, session } = useAppState();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const openSearch = useCallback(() => { setOpen(false); setSearching(true); }, []);
  useQuickSearchKey(openSearch);
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
    <div className={cx("gestor-shell min-h-dvh lg:grid lg:h-dvh lg:overflow-hidden print:block print:h-auto print:overflow-visible", compact ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[256px_minmax(0,1fr)]")}>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden print:hidden">
        <button type="button" aria-label={t.side.menu} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg border border-line transition-colors hover:bg-sunk active:bg-sunk">
          <Menu size={18} strokeWidth={1.9} aria-hidden="true" />
        </button>
        <Brand />
        <button type="button" aria-label={t.extra.search.open} onClick={openSearch} className="ml-auto grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <Search size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-[var(--scrim)] lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-[272px] bg-chrome motion-safe:transition-[translate] motion-safe:duration-250 motion-safe:ease-out lg:sticky lg:top-0 lg:z-40 lg:h-dvh lg:w-auto lg:translate-x-0 lg:bg-transparent lg:py-3 lg:pl-3 print:hidden",
          open ? "translate-x-0 shadow-card" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={() => setOpen(false)} onSearch={openSearch} compact={compact} />
      </aside>

      <div className="min-w-0 lg:h-dvh lg:p-3 print:h-auto print:p-0">
        <QuickSearch open={searching} onClose={() => setSearching(false)} />
        <div className="min-h-[calc(100dvh-56px)] bg-surface lg:relative lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:rounded-[14px] lg:border lg:border-line lg:shadow-sheet print:h-auto print:overflow-visible print:border-0 print:shadow-none">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate, onSearch, compact }: { onNavigate: () => void; onSearch: () => void; compact: boolean }) {
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
    <nav aria-label={t.side.main} className="flex h-full flex-col bg-chrome text-chrome-ink [--focus:#a9c8ff] lg:overflow-hidden lg:rounded-[14px] lg:shadow-sheet">
      {/* Who is signed in: the gestoría, at the top. */}
      <div className={cx("mx-3 flex items-center gap-3 border-b border-chrome-line px-2 pt-4 pb-4", compact && "lg:mx-2 lg:justify-center lg:px-0")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-chrome-ink text-[13px] font-bold text-chrome shadow-[inset_0_-3px_0_var(--copper)]" title={compact ? firmName : undefined} aria-hidden={!compact}>
          {firmName[0].toUpperCase()}
        </span>
        <span className={cx("min-w-0 flex-1", compact && "lg:sr-only")}>
          <span className="block truncate text-[14.5px] font-semibold">{firmName}</span>
          <span className="block truncate text-[11.5px] text-chrome-muted">PreRenta · {t.common.taxYear(EJERCICIO)}</span>
        </span>
        <button type="button" aria-label={t.side.closeMenu} onClick={onNavigate} className="px-2 text-xl text-chrome-muted lg:hidden">
          ×
        </button>
      </div>

      <div className={cx("flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 pb-3", compact && "lg:px-2")}>
        <button type="button" onClick={onSearch} title={compact ? `${t.extra.search.open} · Ctrl K` : undefined} className={cx("mb-3 flex h-9 items-center gap-2.5 rounded-lg border border-chrome-line bg-chrome-hover px-2.5 text-left text-[13.5px] text-chrome-muted transition-colors hover:bg-chrome-active hover:text-chrome-ink", compact && "lg:justify-center lg:px-0")}>
          <Search size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          <span className={cx("flex-1", compact && "lg:sr-only")}>{t.extra.search.open}</span>
          <kbd className={cx("rounded border border-chrome-line px-1 font-mono text-[10.5px]", compact && "lg:hidden")}>Ctrl K</kbd>
        </button>
        <ul className="flex flex-col gap-1.5">
          <li>
            <Link href="/expedientes" onClick={onNavigate} title={compact ? t.nav.cases : undefined} aria-current={inCases ? "page" : undefined} className={cx(item(inCases), "relative")}>
              <IconTile icon={Inbox} size="xs" tone={inCases ? "copperSolid" : "chrome"} />
              {label(t.nav.cases)}
              <span className={cx(compact && "lg:absolute lg:-top-1 lg:right-1")}><Badge n={unread} /></span>
            </Link>
          </li>
          {live.map(([LiveIcon, text, href]) => (
            <li key={href}>
              <Link href={href} onClick={onNavigate} title={compact ? text : undefined} aria-current={path.startsWith(href) ? "page" : undefined} className={item(path.startsWith(href))}>
                <IconTile icon={LiveIcon} size="xs" tone={path.startsWith(href) ? "copperSolid" : "chrome"} />
                {label(text)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Account: settings, language and sign-out, under a divider. */}
        <ul className="mt-auto flex flex-col gap-1.5 border-t border-chrome-line pt-4">
          {FEATURES.firmSettings && (
            <li>
              <Link href="/ajustes/despacho" onClick={onNavigate} title={compact ? t.side.settings : undefined} aria-current={inSettings ? "page" : undefined} className={item(inSettings)}>
                <IconTile icon={Settings} size="xs" tone={inSettings ? "copperSolid" : "chrome"} />
                {label(t.side.settings)}
              </Link>
            </li>
          )}
          <li>
            <span className={cx(item(false), "cursor-default opacity-60 hover:bg-transparent hover:text-chrome-muted")} aria-disabled="true" title={compact ? `${t.side.invite} · ${t.side.soon}` : undefined}>
              <IconTile icon={UserPlus} size="xs" tone="chrome" />
              <span className={cx("flex-1 leading-[18px]", compact && "lg:sr-only")}>
                {t.side.invite}{" "}
                <span className="ml-0.5 inline-block rounded-sm bg-chrome-tile px-1.5 align-[1px] text-[10.5px] leading-4 font-medium tracking-wide text-chrome-muted">{t.side.soon}</span>
              </span>
            </span>
          </li>
          <li>
            <LangMenu compact={compact} item={item} />
          </li>
          <li>
            <button type="button" onClick={signOut} title={compact ? t.common.signOut : "Alt ⇧ Q"} className={cx(item(false), "w-full text-left")}>
              <IconTile icon={LogOut} size="xs" tone="chrome" />
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
        <IconTile icon={Languages} size="xs" tone="chrome" />
        <span className={cx("flex-1", compact && "lg:sr-only")}>{t.common.language}</span>
        <span className={cx("text-[13px] font-normal text-chrome-muted", compact && "lg:hidden")}>{cur.label}</span>
        <ChevronDown size={14} className={cx("shrink-0 text-chrome-muted transition-transform", open && "rotate-180", compact && "lg:hidden")} aria-hidden="true" />
      </button>
      {open && (
        <ul role="group" aria-label={t.common.language} className={cx("mt-0.5 mb-1 ml-10 flex flex-col gap-0.5", compact && "lg:ml-0")}>
          {LANGS.map((l) => {
            const on = l.id === lang;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => actions.setLang(l.id)}
                  title={compact ? l.label : undefined}
                  className={cx("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] transition", on ? "bg-chrome-active font-semibold text-chrome-ink" : "text-chrome-muted hover:bg-chrome-hover hover:text-chrome-ink", compact && "lg:justify-center lg:px-0")}
                >
                  <span className={cx("flex-1", compact && "lg:hidden")}>{l.label}</span>
                  <span className={cx("hidden text-[11.5px] font-semibold", compact && "lg:inline")}>{l.short}</span>
                  {on && <Check size={14} className={cx("shrink-0 text-chrome-mark", compact && "lg:hidden")} aria-hidden="true" />}
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
  cx("flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 text-[14.5px] transition-colors", on ? "bg-chrome-active font-semibold text-chrome-ink shadow-[inset_3px_0_0_var(--chrome-mark)]" : "font-medium text-chrome-muted hover:bg-chrome-hover hover:text-chrome-ink");


/** Sticky header inside the content panel: breadcrumbs on the left, actions on the right. */
export function TopBar({ crumbs, right }: { crumbs: { label: string; href?: string }[]; right?: ReactNode }) {
  return (
    <div className="sticky top-14 z-10 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-4 py-2 sm:px-6 lg:top-0 lg:rounded-t-[14px]">
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
