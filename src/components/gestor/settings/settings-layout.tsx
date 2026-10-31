"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, CalendarClock, Euro, FileSignature, Mail, Users, type LucideIcon, MessageSquareReply } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { cx } from "@/components/ui/primitives";
import { SaveFailed, SaveStatus } from "@/components/ui/save-status";
import { TopBar } from "../gestor-shell";

type Section = "firm" | "legal" | "team" | "fees" | "campaign" | "replies" | "emails";
const SECTIONS: { id: Section; href: string; icon: LucideIcon }[] = [
  { id: "firm", href: "/ajustes/despacho", icon: Building2 },
  { id: "legal", href: "/ajustes/documentos", icon: FileSignature },
  { id: "team", href: "/ajustes/equipo", icon: Users },
  { id: "fees", href: "/ajustes/honorarios", icon: Euro },
  { id: "campaign", href: "/ajustes/campana", icon: CalendarClock },
  { id: "replies", href: "/ajustes/respuestas", icon: MessageSquareReply },
  { id: "emails", href: "/ajustes/correos", icon: Mail },
];

/** G7 · Ajustes: section list on the left, the section form on the right. */
export function SettingsLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const current = SECTIONS.find((s) => path.startsWith(s.href)) ?? SECTIONS[0];

  return (
    <>
      <PageTitle>{`${t.settings.nav[current.id]} · ${t.titles.settings}`}</PageTitle>
      <TopBar crumbs={[{ label: t.settings.title, href: "/ajustes/despacho" }, { label: t.settings.nav[current.id] }]} right={<SaveStatus idle={t.settings.saved} className="hidden sm:inline-flex" />} />
      <div className="grid items-start gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:py-6">
        <nav aria-label={t.settings.navLabel} className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto lg:sticky lg:top-[72px] lg:mx-0 lg:flex-col">
          {SECTIONS.map((s) => {
            const on = s.id === current.id;
            return (
              <Link
                key={s.id}
                href={s.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium whitespace-nowrap transition",
                  on ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent",
                )}
              >
                <s.icon size={16} strokeWidth={1.9} aria-hidden="true" />
                {t.settings.nav[s.id]}
              </Link>
            );
          })}
        </nav>
        {/* 820px for settings forms; a page with a side column (data-wide) gets the room for it. */}
        <div className="min-w-0 max-w-[820px] has-[[data-wide]]:max-w-[1180px]">
          <SaveFailed className="mb-5" />
          {children}
        </div>
      </div>
    </>
  );
}

/** Heading block for one settings section. */
export function SectionHead({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.01em]">{title}</h1>
      <p className="mt-1 max-w-[68ch] text-[14px] leading-[21px] text-muted">{intro}</p>
    </div>
  );
}

/** Workspace fields: the shared .field look (globals.css) at the workspace height. */
export const inputCls = "field disabled:text-muted";

/** Label + control, stacked. */
export function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}
