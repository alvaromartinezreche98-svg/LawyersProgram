"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { BellRing, Building2, CalendarClock, CreditCard, Euro, FileSignature, Mail, Users, type LucideIcon, MessageSquareReply } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { cx } from "@/components/ui/primitives";
import { SaveFailed, SaveStatus } from "@/components/ui/save-status";
import { TopBar } from "../gestor-shell";

type Section = "firm" | "legal" | "team" | "fees" | "campaign" | "replies" | "emails" | "reminders" | "subscription";
const SECTIONS: { id: Section; href: string; icon: LucideIcon }[] = [
  { id: "firm", href: "/ajustes/despacho", icon: Building2 },
  { id: "legal", href: "/ajustes/documentos", icon: FileSignature },
  { id: "team", href: "/ajustes/equipo", icon: Users },
  { id: "fees", href: "/ajustes/honorarios", icon: Euro },
  { id: "campaign", href: "/ajustes/campana", icon: CalendarClock },
  { id: "replies", href: "/ajustes/respuestas", icon: MessageSquareReply },
  { id: "emails", href: "/ajustes/correos", icon: Mail },
  { id: "reminders", href: "/ajustes/recordatorios", icon: BellRing },
  { id: "subscription", href: "/ajustes/suscripcion", icon: CreditCard },
];

/** G7 · Ajustes: section list on the left, the section form on the right. */
export function SettingsLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const current = SECTIONS.find((s) => path.startsWith(s.href)) ?? SECTIONS[0];

  return (
    <>
      <PageTitle>{`${t.settings.nav[current.id]} · ${t.titles.settings}`}</PageTitle>
      <TopBar crumbs={[{ label: t.settings.title, href: "/ajustes/despacho" }, { label: t.settings.nav[current.id] }]} right={<span className="max-sm:hidden"><SaveStatus idle={t.settings.saved} /></span>} />
      <div className="grid items-start gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:py-6">
        <nav aria-label={t.settings.navLabel} className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-1 overflow-x-auto px-4 after:w-px after:shrink-0 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:sticky lg:top-[72px] lg:mx-0 lg:flex-col lg:rounded-xl lg:border lg:border-line lg:bg-sunk/60 lg:p-2">
          {SECTIONS.map((s) => {
            const on = s.id === current.id;
            return (
              <Link
                key={s.id}
                href={s.href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex shrink-0 snap-start items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 max-lg:border max-lg:text-[13.5px] lg:gap-2.5",
                  on ? "border-accent bg-accent text-accent-ink shadow-sm" : "border-line text-muted hover:bg-accent-soft hover:text-accent max-lg:bg-surface",
                )}
              >
                <s.icon size={16} strokeWidth={1.9} aria-hidden="true" />
                {t.settings.nav[s.id]}
              </Link>
            );
          })}
        </nav>
        {/* Every settings section uses the full width, like the rest of the panel; forms lay their fields out in columns. */}
        <div className="min-w-0">
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

/** A field with its unit on the right ("€", "días"), drawn as one control. */
export function UnitField({ id, unit, className, ...input }: { id: string; unit: string; className?: string } & ComponentProps<"input">) {
  return (
    <div className={cx("shadow-field flex h-(--control-h) items-center overflow-clip rounded-md border border-field-line bg-surface transition-colors hover:border-accent focus-within:border-focus focus-within:ring-4 focus-within:ring-focus/15", className)}>
      <input id={id} {...input} className="figures h-full w-full min-w-0 bg-transparent px-3 text-right outline-hidden" />
      <span className="grid h-full place-items-center border-l border-line bg-sunk px-3 text-[14px] whitespace-nowrap text-muted">{unit}</span>
    </div>
  );
}
