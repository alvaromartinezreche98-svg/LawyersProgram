"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Building2, ChartNoAxesColumn, Menu, Tags, type LucideIcon } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useSignInRedirect } from "@/lib/data/use-sign-in-redirect";
import { useSignOut } from "@/lib/auth/use-auth";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { Brand, Loading, cx, HEADER_BAR, HEADER_ICON_BTN } from "@/components/ui/primitives";
import { itemCls } from "@/components/gestor/gestor-shell";
import { SideLink } from "@/components/ui/side-nav";
import { LangMenu, SignOutButton } from "@/components/ui/sidebar-foot";

/** X · The PreRenta team's area: the same frame as the gestoría panel, with its own three sections. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { ready, session } = useAppState();
  const { t, p } = usePlatformText();
  const [open, setOpen] = useState(false);
  const allowed = session?.role === "admin";
  useSignInRedirect(allowed);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  if (!ready || !allowed) return <Loading />;

  return (
    <div className="gestor-shell min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden">
      <div className={cx("sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6 lg:hidden", HEADER_BAR)}>
        <button type="button" aria-label={t.side.menu} aria-expanded={open} onClick={() => setOpen(true)} className={HEADER_ICON_BTN}>
          <Menu size={18} strokeWidth={1.9} aria-hidden="true" />
        </button>
        <Brand />
      </div>

      {open && <div className="fixed inset-0 z-40 bg-[var(--scrim)] lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx("fixed inset-y-0 left-0 z-50 w-[272px] bg-chrome motion-safe:transition-[translate] motion-safe:duration-250 lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0 lg:bg-transparent lg:py-3 lg:pl-3", open ? "translate-x-0 shadow-card" : "-translate-x-full")}>
        <Sidebar onNavigate={() => setOpen(false)} />
      </aside>

      <div className="min-w-0 lg:h-dvh lg:p-3">
        <div data-app-frame className="min-h-[calc(100dvh-56px)] bg-surface lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain thin-scroll lg:rounded-[14px] lg:border lg:border-line lg:shadow-sheet">
          {children}
          <p className="px-4 pb-6 text-[12.5px] text-muted sm:px-6">{p.admin.demoNote}</p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { t, p } = usePlatformText();
  const path = usePathname();
  const signOut = useSignOut();
  const links: [LucideIcon, string, string][] = [
    [Building2, p.admin.nav.firms, "/admin/gestorias"],
    [Tags, p.admin.nav.plans, "/admin/planes"],
    [ChartNoAxesColumn, p.admin.nav.metrics, "/admin/metricas"],
  ];
  return (
    <nav aria-label={p.admin.area} className="flex h-full flex-col bg-chrome text-chrome-ink on-dark lg:overflow-hidden lg:rounded-[14px] lg:shadow-sheet">
      <div className="mx-3 flex items-center gap-3 border-b border-chrome-line px-2 pt-4 pb-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-chrome-ink text-[13px] font-bold text-chrome shadow-[0_1px_2px_rgb(0_0_0/0.16)]" aria-hidden="true">P</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold">PreRenta</span>
        </span>
        <button type="button" aria-label={t.side.closeMenu} onClick={onNavigate} className="grid size-10 shrink-0 place-items-center rounded-lg text-xl text-chrome-muted transition-colors hover:bg-chrome-hover hover:text-chrome-ink lg:hidden">×</button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 pb-3">
        <ul className="flex flex-col gap-1.5">
          {links.map(([Icon, label, href]) => {
            const on = path.startsWith(href);
            return (
              <li key={href}>
                <SideLink href={href} icon={Icon} label={label} on={on} theme="dark" folded={false} onClick={onNavigate} />
              </li>
            );
          })}
        </ul>
      </div>
      {/* Foot, outside the scrolling list: language and sign-out always in view */}
      <div className="flex shrink-0 flex-col gap-1 border-t border-chrome-line px-3 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        <LangMenu compact={false} item={itemCls} />
        <SignOutButton onClick={signOut} label={t.common.signOut} />
      </div>
    </nav>
  );
}
