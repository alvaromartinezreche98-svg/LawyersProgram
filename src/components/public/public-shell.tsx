"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LEGAL_DOCS } from "@/lib/legal/content";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch } from "@/components/ui/lang-switch";
import { Brand, ButtonLink, cx } from "@/components/ui/primitives";
import { LogIn } from "lucide-react";
import { useAppState } from "@/lib/data/store";

/**
 * Header and footer of every public page, the firm's landing on "/" included.
 * Each firm's domain serves these pages, so the header shows that firm and the
 * footer credits PreRenta as the platform.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const { t, tr } = useI18n();
  const { firm } = useAppState();
  const firmName = firm.name.trim();
  const path = usePathname();
  const nav = [
    { href: "/como-funciona", label: t.pub.nav.how },
    { href: "/para-gestorias", label: t.pub.nav.firms },
    { href: "/preguntas-frecuentes", label: t.pub.nav.faq },
    { href: "/contacto", label: t.pub.nav.contact },
  ];
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 sm:gap-6 sm:px-8">
          <Link href="/" className="mr-auto min-w-0">
            <Brand sub={firmName || undefined} />
          </Link>
          <nav aria-label={t.nav.sections} className="hidden gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className={cx("rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors", path === n.href ? "text-accent" : "text-muted hover:text-ink")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <LangSwitch />
          <ButtonLink href="/acceso" size="sm" variant="primary">
            <LogIn size={15} aria-hidden="true" />
            {t.pub.nav.signIn}
          </ButtonLink>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Institutional footer: a navy band, the brand statement set large, links in two quiet groups. */}
      <footer className="bg-[var(--band)] text-[var(--band-ink)] [--focus:#a9c8ff]">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
          <div className="grid gap-x-12 gap-y-10 pt-14 pb-12 md:grid-cols-12 md:pt-16">
            <div className="flex flex-col gap-6 md:col-span-7">
              <span className="text-[20px] font-semibold tracking-[-0.01em]">
                Pre<span className="text-[var(--band-copper)]">Renta</span>
              </span>
              <p className="display-serif max-w-[18ch] text-[clamp(28px,3.4vw,42px)] leading-[1.12] font-semibold">{t.pub.footer.tagline}</p>
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-[var(--band-muted)]">{t.pub.footer.about}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:col-span-5 md:gap-x-10 md:pt-1.5">
              <FooterLinks title={t.pub.footer.product} links={nav} />
              <FooterLinks title={t.pub.footer.legal} links={LEGAL_DOCS.map((d) => ({ href: `/legal/${d.slug}`, label: tr(d.title) }))} />
              {(firmName || firm.phone || firm.email || firm.address) && (
                <div className="col-span-2 flex flex-col gap-2 border-t border-[var(--band-line)] pt-6 text-[14px]">
                  <h2 className="text-[11.5px] font-semibold tracking-[.14em] text-[var(--band-muted)] uppercase">{t.pub.footer.firmLabel}</h2>
                  {firmName && <span className="text-[16px] font-semibold">{firmName}</span>}
                  <span className="flex flex-wrap gap-x-5 gap-y-1 text-[var(--band-muted)]">
                    {firm.phone && <a href={`tel:${firm.phone.replace(/\s+/g, "")}`} className="hover:text-[var(--band-ink)] hover:underline">{firm.phone}</a>}
                    {firm.email && <a href={`mailto:${firm.email}`} className="hover:text-[var(--band-ink)] hover:underline">{firm.email}</a>}
                    {firm.address && <span>{firm.address}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Watermark: the PreRenta wordmark (same face and weight as <Brand />), oversized, monochrome and cropped at the baseline. */}
          <div aria-hidden="true" className="pointer-events-none -mt-2 h-[0.74em] overflow-hidden text-[min(23.2vw,286px)] select-none sm:-mt-4">
            <span className="display-tight block text-center leading-[0.86] font-semibold tracking-[-0.045em] whitespace-nowrap text-[var(--band-ink)] opacity-[0.08]">
              PreRenta
            </span>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--band-line)] py-6 text-[13px] text-[var(--band-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} PreRenta</span>
            <span>{firmName ? `${firmName} · ${t.landing.poweredBy} PreRenta` : t.pub.footer.tagline}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-[11.5px] font-semibold tracking-[.14em] text-[var(--band-muted)] uppercase">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-[15px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[var(--band-ink)] underline-offset-4 transition-colors hover:text-[var(--band-ink)] hover:underline hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
