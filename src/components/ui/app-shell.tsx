"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, CircleUserRound, LogOut, type LucideIcon } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch } from "./lang-switch";
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
 * Client portal frame (design system › Navigation). The top bar leads with the
 * gestoría (logo slot, name, "Renta 2026 · con PreRenta"); from 760px it is one
 * row with four tabs and a "Cuenta" menu (other pages, language, sign-out).
 * On phones only the identity stays on top and the tabs move to a bottom bar.
 */
export function AppShell({ nav, who, org, children }: { nav: NavItem[]; who: string; org?: string; children: ReactNode }) {
  const path = usePathname();
  const { t } = useI18n();
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
    <div ref={root} className="client-scale flex min-h-dvh flex-col">
      <header ref={head} className="z-20 border-b border-line bg-surface md:sticky md:top-0">
        <div className="mx-auto flex min-h-16 max-w-[1320px] items-center gap-x-5 px-4 sm:px-6">
          <Link href={nav[0]?.href ?? "/"} className="mr-auto flex min-w-0 items-center gap-3 py-2 md:mr-2">
            <Cobrand org={org} />
          </Link>
          <nav aria-label={t.nav.sections} className={cx("mr-auto flex gap-1 self-stretch max-md:hidden", !nav.length && "hidden")}>
            {tabs.map((n) => {
              const on = isOn(n);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-2 border-b-[3px] px-3 pt-[3px] text-[15px] font-medium whitespace-nowrap transition-colors",
                    on ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {n.icon && <n.icon size={17} strokeWidth={1.9} aria-hidden="true" />}
                  <span className="max-lg:hidden">{n.label}</span>
                  <span className="lg:hidden">{n.short ?? n.label}</span>
                  <Badge n={n.badge ?? 0} />
                </Link>
              );
            })}
          </nav>
          <LangSwitch className="max-lg:hidden" />
          <span className="hidden max-w-[22ch] truncate text-[14px] text-muted xl:inline">{who}</span>
          {nav.length > 0 ? <AccountMenu items={more} isOn={isOn} className="max-md:hidden" /> : <SignOutButton />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-24">{children}</main>
      {nav.length > 0 && <BottomNav nav={nav} isOn={isOn} />}
    </div>
  );
}

/** The gestoría first, PreRenta as the platform; PreRenta's wordmark alone when the firm has no name yet. */
function Cobrand({ org }: { org?: string }) {
  const { t } = useI18n();
  const { firm } = useAppState();
  const url = useFileUrl(firm.logo);
  if (!org) return <Brand sub={t.common.taxYear(EJERCICIO)} />;
  const mark = org.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
        <img src={url} alt="" className="size-9 shrink-0 rounded-md border border-line object-contain" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-[12px] font-semibold text-muted" aria-hidden="true">{mark}</span>
      )}
      {/* Between 768 and 1280px the tabs need the room: the logo slot alone stands for the gestoría. */}
      <span className="min-w-0 md:max-xl:sr-only">
        <span className="block truncate text-[15px] leading-[18px] font-semibold">{org}</span>
        <span className="block truncate text-[12.5px] leading-4 text-muted">
          {t.common.taxYear(EJERCICIO)} · {t.common.with}{" "}
          <b className="font-semibold text-ink">Pre<span className="text-copper-text">Renta</span></b>
        </span>
      </span>
    </>
  );
}

function SignOutButton() {
  const { t } = useI18n();
  const signOut = useSignOut();
  return <Button size="sm" onClick={signOut}>{t.common.signOut}</Button>;
}

/** "Cuenta": the pages that are not tabs, the language and sign-out. */
function AccountMenu({ items, isOn, className }: { items: NavItem[]; isOn: (n: NavItem) => boolean; className?: string }) {
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
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} className={cx("inline-flex h-(--control-h-sm) items-center gap-2 rounded-md border px-3 text-[14px] font-medium whitespace-nowrap transition-colors", on || open ? "border-accent bg-accent-soft text-accent" : "border-line-strong bg-surface hover:bg-hover")}>
        <CircleUserRound size={16} strokeWidth={1.9} aria-hidden="true" />
        {t.side.account}
        <Badge n={badge} />
        <ChevronDown size={14} className={cx("transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-1.5 flex w-64 flex-col gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-card">
          {items.map((n) => (
            <Link key={n.href} role="menuitem" href={n.href} onClick={() => setOpen(false)} aria-current={isOn(n) ? "page" : undefined} className={cx("flex items-center gap-3 rounded-md px-3 py-2.5 text-[14.5px] font-medium", isOn(n) ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent")}>
              {n.icon && <n.icon size={17} strokeWidth={1.9} aria-hidden="true" />}
              <span className="flex-1">{n.label}</span>
              <Badge n={n.badge ?? 0} />
            </Link>
          ))}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-line px-3 pt-2.5 pb-1.5 text-[14px] lg:hidden">
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
  const bar = (on: boolean) => on && <i className="absolute inset-x-3 top-0 h-0.5 rounded-b-sm bg-accent" aria-hidden="true" />;
  return (
    <nav aria-label={t.nav.sections} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {open && (
        <ul className="absolute inset-x-3 bottom-full mb-2 flex max-h-[70dvh] flex-col gap-1 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-card">
          {rest.map((n) => (
            <li key={n.href}>
              <Link href={n.href} onClick={() => setOpen(false)} aria-current={isOn(n) ? "page" : undefined} className={cx("flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-medium", isOn(n) ? "bg-accent-soft text-accent" : "hover:bg-accent-soft hover:text-accent")}>
                {n.icon && <n.icon size={18} strokeWidth={1.9} aria-hidden="true" />}
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
                {n.icon && <n.icon size={21} strokeWidth={1.9} aria-hidden="true" />}
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
