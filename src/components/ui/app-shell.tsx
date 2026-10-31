"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, CircleUserRound, LogOut, type LucideIcon } from "lucide-react";
import { IconTile } from "./icons";
import { useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch, useHtmlLang } from "./lang-switch";
import { LangMenu, SignOutButton as SidebarSignOut } from "./sidebar-foot";
import { Badge, Brand, Button, cx } from "./primitives";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  /** On phones, listed under "Cuenta" instead of having its own tab. */
  phoneMore?: boolean;
  badge?: number;
  icon?: LucideIcon;
  /** Also active for nested routes. */
  match?: string;
}

/**
 * Client portal frame (design system › Navigation). From 1280px it has the same
 * layout as the gestoría panel: a fixed sidebar on the left (light, with navy
 * ink, the inverse of the workspace's navy one) and the page on the right.
 * Between 768 and 1280px a top bar leads with the gestoría, then four tabs and
 * a "Cuenta" menu. On phones only the identity stays on top and the tabs move
 * to a bottom bar.
 */
export function AppShell({ nav, who, org, children }: { nav: NavItem[]; who: string; org?: string; children: ReactNode }) {
  const path = usePathname();
  const { t } = useI18n();
  // The language switch lives in the account menu (not always mounted), so the frame keeps <html lang>.
  useHtmlLang();
  const isOn = (n: NavItem) => path === n.href || (!!n.match && path.startsWith(n.match));
  const tabs = nav.slice(0, 4);
  const more = nav.slice(4);
  // The header's real height, so sticky columns start level with the content.
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = head.current;
    if (!h) return;
    const ro = new ResizeObserver(() => root.current?.style.setProperty("--app-header", `${h.offsetHeight}px`));
    ro.observe(h);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={root} className={cx("client-scale flex min-h-dvh flex-col", nav.length > 0 && "xl:grid xl:h-dvh xl:grid-cols-[272px_minmax(0,1fr)] xl:overflow-hidden")}>
      {nav.length > 0 && <ClientSidebar nav={nav} who={who} org={org} isOn={isOn} />}
      {/* Hidden (height 0) beside the sidebar, so --app-header drops to 0 and sticky columns sit at the top. */}
      <header ref={head} className={cx("z-20 border-b border-line bg-surface md:sticky md:top-0", nav.length > 0 && "xl:hidden")}>
        <div className="mx-auto flex min-h-16 max-w-client items-center gap-x-5 px-4 sm:px-6">
          <Link href={nav[0]?.href ?? "/"} className="mr-auto flex min-w-0 items-center gap-3 py-2 md:mr-2">
            <Cobrand org={org} />
          </Link>
          <nav aria-label={t.nav.sections} className={cx("mr-auto flex items-center gap-1.5 max-md:hidden", !nav.length && "hidden")}>
            {tabs.map((n) => {
              const on = isOn(n);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex h-10 items-center gap-2 rounded-full px-4 text-[15px] whitespace-nowrap transition-colors duration-150",
                    on ? "bg-accent-soft font-semibold text-accent" : "font-medium text-muted hover:bg-sunk hover:text-ink",
                  )}
                >
                  {n.icon && <n.icon size={18} strokeWidth={2.1} aria-hidden="true" />}
                  <span className="max-lg:hidden">{n.label}</span>
                  <span className="lg:hidden">{n.short ?? n.label}</span>
                  <Badge n={n.badge ?? 0} />
                </Link>
              );
            })}
          </nav>
          {/* One quiet control on the right: the account (language and sign-out live in it). */}
          {nav.length > 0 ? (
            <AccountMenu who={who} items={more} isOn={isOn} className="max-md:hidden" />
          ) : (
            <>
              <LangSwitch />
              <SignOutButton />
            </>
          )}
        </div>
      </header>
      {/* From 1280px the page sits in the same framed panel as the gestoría's: white, rounded, a hairline and the sheet shadow, scrolling inside. */}
      <div className={cx("flex min-w-0 flex-1 flex-col", nav.length > 0 && "xl:h-dvh xl:p-3")}>
        <div data-app-frame className={cx("flex flex-1 flex-col", nav.length > 0 && "thin-scroll xl:relative xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:rounded-[14px] xl:border xl:border-line xl:bg-surface xl:shadow-sheet")}>
          <main className={cx("mx-auto w-full max-w-client flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-24", nav.length > 0 && "xl:px-8 xl:pt-8 xl:pb-12")}>{children}</main>
        </div>
      </div>
      {nav.length > 0 && <BottomNav nav={nav} isOn={isOn} />}
    </div>
  );
}

/**
 * Desktop sidebar: the gestoría on top, every page as a row, then the person,
 * the language and sign-out at the foot. Rows follow the workspace sidebar
 * (icon tile, terracotta tile and bar on the current page) in navy on light blue.
 */
function ClientSidebar({ nav, who, org, isOn }: { nav: NavItem[]; who: string; org?: string; isOn: (n: NavItem) => boolean }) {
  const { t } = useI18n();
  const signOut = useSignOut();
  const row = (on: boolean) =>
    cx(
      "relative flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 text-[15px] transition-colors duration-150",
      on
        ? "bg-surface font-semibold text-accent shadow-sm before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-copper"
        : "font-medium text-accent/80 hover:bg-surface/70 hover:text-accent",
    );
  return (
    <aside className="z-30 h-dvh p-3 pr-0 max-xl:hidden">
      <nav aria-label={t.nav.sections} className="flex h-full flex-col rounded-[14px] border border-accent/10 bg-accent-soft text-accent shadow-sheet">
        <Link href={nav[0].href} className="mx-3 flex min-w-0 items-center gap-3 border-b border-accent/10 px-2 pt-4 pb-4">
          <Cobrand org={org} inSidebar />
        </Link>
        <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 pb-3">
          <ul className="flex flex-col gap-1.5">
            {nav.map((n) => {
              const on = isOn(n);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={on ? "page" : undefined} className={row(on)}>
                    {n.icon && <IconTile icon={n.icon} size="xs" tone={on ? "copperSolid" : "accent"} className={on ? undefined : "bg-surface"} />}
                    <span className="flex-1">{n.label}</span>
                    <Badge n={n.badge ?? 0} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex flex-col gap-1.5 border-t border-accent/10 pt-4">
            <div className="flex items-center gap-3 px-2.5 py-1.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-ink" aria-hidden="true">{initialsOf(who)}</span>
              <span className="min-w-0">
                <b className="block truncate text-[14.5px] font-semibold">{who}</b>
                <span className="block text-[12.5px] text-accent/70">{t.side.account}</span>
              </span>
            </div>
            <LangMenu item={row} theme="light" />
            <SidebarSignOut onClick={signOut} label={t.common.signOut} theme="light" />
          </div>
        </div>
      </nav>
    </aside>
  );
}

/** The gestoría's mark and name, nothing else; PreRenta's wordmark alone when the firm has no name yet. */
function Cobrand({ org, inSidebar }: { org?: string; inSidebar?: boolean }) {
  const { firm } = useAppState();
  const url = useFileUrl(firm.logo);
  if (!org) return <Brand />;
  const mark = org.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
        <img src={url} alt="" className="size-10 shrink-0 rounded-lg border border-line object-contain" />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-[13px] font-semibold tracking-wide text-accent-ink shadow-[0_1px_2px_rgb(0_0_0/0.16)]" aria-hidden="true">{mark}</span>
      )}
      {/* Between 768 and 1280px the tabs need the room: the logo slot alone stands for the gestoría. */}
      <span className={cx("min-w-0 truncate text-[15px] leading-[18px] font-semibold", !inSidebar && "md:max-xl:sr-only")}>{org}</span>
    </>
  );
}

function SignOutButton() {
  const { t } = useI18n();
  const signOut = useSignOut();
  return (
    <Button size="sm" onClick={signOut} aria-label={t.common.signOut} className="max-sm:px-2.5">
      <LogOut size={15} aria-hidden="true" />
      <span className="max-sm:hidden">{t.common.signOut}</span>
    </Button>
  );
}

const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/** "Cuenta": the pages that are not tabs, the language and sign-out. */
function AccountMenu({ who, items, isOn, className }: { who: string; items: NavItem[]; isOn: (n: NavItem) => boolean; className?: string }) {
  const { t } = useI18n();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const on = items.some(isOn);
  const badge = items.reduce((n, x) => n + (x.badge ?? 0), 0);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={box} className={cx("relative", className)}>
      {/* The person, not a button label: their initials, first name and a chevron. */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t.side.account}: ${who}`}
        onClick={() => setOpen(!open)}
        className={cx("relative inline-flex h-10 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[14.5px] font-medium whitespace-nowrap transition-colors", on || open ? "border-line-strong bg-sunk" : "border-line bg-sunk/50 hover:border-line-strong hover:bg-sunk")}
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-ink" aria-hidden="true">{initialsOf(who)}</span>
        <span className="max-w-[12ch] truncate pl-0.5 max-lg:hidden">{who.split(/\s+/)[0]}</span>
        <ChevronDown size={15} className={cx("text-muted motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")} aria-hidden="true" />
        {badge > 0 && <span className="absolute -top-1 left-6"><Badge n={badge} /></span>}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-1.5 flex w-72 flex-col gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-card">
          <div className="flex items-center gap-3 border-b border-line px-3 pt-2 pb-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[14px] font-semibold text-accent-ink" aria-hidden="true">{initialsOf(who)}</span>
            <span className="min-w-0">
              <b className="block truncate text-[15px] font-semibold">{who}</b>
              <span className="text-[13px] text-muted">{t.side.account}</span>
            </span>
          </div>
          {items.map((n) => (
            <Link key={n.href} role="menuitem" href={n.href} onClick={() => setOpen(false)} aria-current={isOn(n) ? "page" : undefined} className={cx("flex items-center gap-3 rounded-md px-3 py-2.5 text-[14.5px] font-medium", isOn(n) ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent")}>
              {n.icon && <IconTile icon={n.icon} size="xs" />}
              <span className="flex-1">{n.label}</span>
              <Badge n={n.badge ?? 0} />
            </Link>
          ))}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-line px-3 pt-2.5 pb-1.5 text-[14px]">
            <span className="text-muted">{t.common.language}</span>
            <LangSwitch />
          </div>
          <button type="button" role="menuitem" onClick={signOut} className="flex items-center gap-3 rounded-md border-t border-line px-3 py-2.5 text-left text-[14.5px] font-medium hover:bg-accent-soft hover:text-accent">
            <LogOut size={17} strokeWidth={1.9} aria-hidden="true" />
            {t.common.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

/** Phone tab bar: four destinations with labels always visible; the rest under "Cuenta". */
function BottomNav({ nav, isOn }: { nav: NavItem[]; isOn: (n: NavItem) => boolean }) {
  const { t } = useI18n();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  // Three destinations plus "Cuenta" (design system › Navigation): the rest live in the sheet.
  const main = nav.filter((n) => !n.phoneMore).slice(0, 3);
  const rest = nav.filter((n) => !main.includes(n));
  const restOn = rest.some(isOn);
  const restBadge = rest.reduce((n, x) => n + (x.badge ?? 0), 0);
  const tab = (on: boolean) =>
    cx("relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 pt-2 pb-1.5 text-[11px] font-medium transition-colors", on ? "text-accent" : "text-muted");
  const bar = (on: boolean) => on && <i className="absolute inset-x-3 top-0 h-[3px] rounded-b-sm bg-copper" aria-hidden="true" />;
  return (
    <nav aria-label={t.nav.sections} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {open && (
        <ul className="absolute inset-x-3 bottom-full mb-2 flex max-h-[70dvh] flex-col gap-1 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-card">
          {rest.map((n) => (
            <li key={n.href}>
              <Link href={n.href} onClick={() => setOpen(false)} aria-current={isOn(n) ? "page" : undefined} className={cx("flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-medium", isOn(n) ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent")}>
                {n.icon && <IconTile icon={n.icon} size="xs" />}
                <span className="flex-1">{n.label}</span>
                <Badge n={n.badge ?? 0} />
              </Link>
            </li>
          ))}
          <li className="mt-1 flex items-center justify-between gap-3 border-t border-line px-3 pt-3 pb-2 text-[15px]">
            <span className="text-muted">{t.common.language}</span>
            <LangSwitch />
          </li>
          <li>
            <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[15px] font-medium hover:bg-accent-soft hover:text-accent">
              <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
              {t.common.signOut}
            </button>
          </li>
        </ul>
      )}
      <div className="flex">
        {main.map((n) => {
          const on = isOn(n);
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined} className={tab(on)}>
              {bar(on)}
              <span className="relative">
                {n.icon && <n.icon size={22} strokeWidth={2.1} aria-hidden="true" />}
                {!!n.badge && <span className="absolute -top-1.5 left-3.5"><Badge n={n.badge} /></span>}
              </span>
              <span className="max-w-full truncate">{n.short ?? n.label}</span>
            </Link>
          );
        })}
        {(
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={tab(restOn || open)}>
            {bar(restOn)}
            <span className="relative">
              <CircleUserRound size={21} strokeWidth={1.9} aria-hidden="true" />
              {restBadge > 0 && <span className="absolute -top-1.5 left-3.5"><Badge n={restBadge} /></span>}
            </span>
            <span>{t.side.account}</span>
          </button>
        )}
      </div>
    </nav>
  );
}

/** Sets the browser tab title in the current language. */
export function PageTitle({ children }: { children: string }) {
  useEffect(() => {
    document.title = `${children} · PreRenta`;
  }, [children]);
  return null;
}
