"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Menu, Search, CalendarDays, Contact, Inbox, LayoutDashboard, ListChecks, Settings, Wallet, type LucideIcon } from "lucide-react";
import { unreadFor, useAppState } from "@/lib/data/store";
import { LangMenu, SignOutButton } from "@/components/ui/sidebar-foot";
import { SIDE_W, SideFoldButton, SideLink, SideTip, sideRowCls, useSideFold } from "@/components/ui/side-nav";
import { useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Badge, Brand, Loading, cx } from "@/components/ui/primitives";
import { useSignInRedirect } from "@/lib/data/use-sign-in-redirect";
import { useRemoteInbox } from "@/lib/api/use-remote";
import { QuickSearch, useQuickSearchKey } from "./quick-search";
import { onboardingProgress } from "./onboarding";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { FirmEmblem, FirmWordmark } from "@/components/ui/firm-mark";

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
  // Folded to icons when the person chose it; until then, only on a case page (to give the case more width).
  const onCase = /^\/expedientes\/[^/]+$/.test(usePathname());
  const [pref, setPref] = useSideFold("gestor");
  const compact = pref ?? onCase;

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
    <div
      style={{ "--side-w": `${compact ? SIDE_W.folded : SIDE_W.open}px` } as CSSProperties}
      className="gestor-shell min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[var(--side-w)_minmax(0,1fr)] lg:overflow-hidden motion-safe:lg:transition-[grid-template-columns] motion-safe:lg:duration-300 motion-safe:lg:ease-out print:block print:h-auto print:overflow-visible"
    >
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
        <Sidebar onNavigate={() => setOpen(false)} onSearch={openSearch} compact={compact} onFold={() => setPref(!compact)} />
      </aside>

      <div className="min-w-0 lg:h-dvh lg:p-3 print:h-auto print:p-0">
        <QuickSearch open={searching} onClose={() => setSearching(false)} />
        <div data-app-frame className="min-h-[calc(100dvh-56px)] bg-surface lg:relative lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain thin-scroll lg:rounded-[14px] lg:border lg:border-line lg:shadow-sheet print:h-auto print:overflow-visible print:border-0 print:shadow-none">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate, onSearch, compact, onFold }: { onNavigate: () => void; onSearch: () => void; compact: boolean; onFold: () => void }) {
  // Folded (desktop only): labels stay for screen readers and as tooltips; the drawer on phones is always full.
  const item = (on: boolean) => cx(itemCls(on), compact && "lg:justify-center lg:px-0");
  const row = (href: string, icon: LucideIcon, text: string, on: boolean, trailing?: ReactNode) => (
    <li key={href}>
      <SideLink href={href} icon={icon} label={text} on={on} theme="dark" folded={compact} onClick={onNavigate} trailing={trailing} />
    </li>
  );
  const { exps, firm } = useAppState();
  const { t } = useI18n();
  const signOut = useSignOut();
  const path = usePathname();
  const unread = Object.values(exps).filter((e) => unreadFor(e, "gestor") > 0).length;
  const inCases = path.startsWith("/expedientes");
  // Team lives inside Settings (sitemap G7), so its page lights the Settings row.
  const inSettings = path.startsWith("/ajustes");
  const all: [LucideIcon, string, string, boolean][] = [
    [LayoutDashboard, t.side.board, "/panel", FEATURES.campaignBoard],
    [Contact, t.side.clients, "/clientes", true],
    [CalendarDays, t.side.appointments, "/citas", FEATURES.appointments],
    [Wallet, t.side.payments, "/cobros", FEATURES.payments],
  ];
  const live = all.filter((x) => x[3]);

  const firmName = firm.name.trim() || "Gestoría";
  // A8: the first-run checklist stays in the menu until its steps are done.
  const { p } = usePlatformText();
  const setup = onboardingProgress(firm, Object.values(exps));
  const inSetup = path.startsWith("/alta-gestoria/inicio");
  const showSetup = FEATURES.platformAdmin && FEATURES.firmSettings && (!setup.ready || inSetup);

  return (
    <nav aria-label={t.side.main} className="flex h-full flex-col bg-chrome text-chrome-ink on-dark lg:overflow-hidden lg:rounded-[14px] lg:shadow-sheet">
      {/* Who is signed in: the gestoría, at the top. */}
      <div className={cx("mx-4 flex min-h-[68px] shrink-0 items-center gap-3 border-b border-chrome-line px-1", compact && "lg:mx-3 lg:flex-col lg:justify-center lg:gap-2 lg:px-0 lg:py-3")}>
        <span className="shrink-0" title={compact ? firmName : undefined}>
          <FirmEmblem size={36} tone="dark" />
        </span>
        <span className={cx("min-w-0 flex-1", compact && "lg:sr-only")}>
          <FirmWordmark name={firmName} tone="dark" />
        </span>
        <SideFoldButton folded={compact} onToggle={onFold} theme="dark" className="max-lg:hidden" />
        <button type="button" aria-label={t.side.closeMenu} onClick={onNavigate} className="px-2 text-xl text-chrome-muted lg:hidden">
          ×
        </button>
      </div>

      <div className={cx("flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pt-4 pb-3 [scrollbar-width:thin]", compact && "lg:px-3")}>
        <SideTip label={`${t.extra.search.open} · Ctrl K`} folded={compact}>
          <button type="button" onClick={onSearch} className={cx("mb-4 flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg border border-chrome-line bg-white/[0.04] px-3 text-left text-[13.5px] text-chrome-muted transition-colors hover:bg-chrome-hover hover:text-chrome-ink", compact && "lg:justify-center lg:px-0")}>
            <Search size={17} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span className={cx("flex-1", compact && "lg:sr-only")}>{t.extra.search.open}</span>
            <kbd className={cx("rounded border border-chrome-line px-1.5 font-mono text-[10.5px]", compact && "lg:hidden")}>Ctrl K</kbd>
          </button>
        </SideTip>
        {/* Primary: the daily work. Secondary (below the rule): the office and the account. */}
        <p className={cx("t-label mb-2 px-3 text-chrome-muted/80", compact && "lg:sr-only")}>{t.side.workLabel}</p>
        <ul className="flex flex-col gap-1.5">
          {row("/expedientes", Inbox, t.nav.cases, inCases, <Badge n={unread} />)}
          {live.map(([LiveIcon, text, href]) => row(href, LiveIcon, text, path.startsWith(href)))}
        </ul>

        {/* Account: settings, language and sign-out, under a divider. */}
        <p className={cx("t-label mt-auto mb-2 border-t border-chrome-line px-3 pt-4 text-chrome-muted/80", compact && "lg:sr-only")}>{t.side.officeLabel}</p>
        <ul className={cx("flex flex-col gap-1.5", compact && "lg:mt-auto lg:border-t lg:border-chrome-line lg:pt-4")}>
          {showSetup && row("/alta-gestoria/inicio", ListChecks, p.onboarding.title, inSetup, !compact && <span className="figures text-[12px] font-normal text-chrome-muted">{setup.done}/{setup.total}</span>)}
          {FEATURES.firmSettings && row("/ajustes/despacho", Settings, t.side.settings, inSettings)}
          <li className="mt-2">
            <SideTip label={t.common.language} folded={compact}>
              <LangMenu compact={compact} item={item} />
            </SideTip>
          </li>
          <li>
            <SideTip label={t.common.signOut} folded={compact}>
              <SignOutButton onClick={signOut} label={t.common.signOut} compact={compact} title={compact ? undefined : "Alt ⇧ Q"} />
            </SideTip>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// The language row lives with the sign-out in ui/sidebar-foot, shared by every sidebar.
export { LangMenu } from "@/components/ui/sidebar-foot";

// Rows of the navy sidebars (gestoría, PreRenta team): the shared side-nav look.
export const itemCls = (on: boolean) => sideRowCls(on, "dark");


/** Sticky header inside the content panel: breadcrumbs on the left, actions on the right. */
export function TopBar({ crumbs, right }: { crumbs: { label: string; href?: string }[]; right?: ReactNode }) {
  // A lone crumb only repeats the page title below it: show the bar only when it adds a path or actions.
  if (crumbs.length < 2 && !right) return null;
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
