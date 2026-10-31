"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LEGAL_DOCS } from "@/lib/legal/content";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch } from "@/components/ui/lang-switch";
import { Brand, ButtonLink, cx } from "@/components/ui/primitives";
import { LogIn, Mail, MapPin, Phone } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { PLATFORM_SITE } from "@/lib/site";
import f from "./public-shell.module.scss";

/**
 * Header and footer of every public page. Two sites share them (lib/site.ts):
 * on a gestoría's domain they belong to that gestoría, with PreRenta credited
 * as the platform; on PreRenta's main domain they carry the public website.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const { t, tr } = useI18n();
  const { firm } = useAppState();
  const firmName = firm.name.trim() || t.landing.yourFirm;
  const logo = useFileUrl(firm.logo);
  const privacyDoc = useFileUrl(firm.docs.privacy?.file ?? null);
  const path = usePathname();
  const firmSite = !PLATFORM_SITE;
  const nav = firmSite
    ? [
        { href: "/como-funciona", label: t.pub.nav.how },
        { href: "/preguntas-frecuentes", label: t.pub.nav.faq },
        { href: "/contacto", label: t.pub.nav.contact },
      ]
    : [
        { href: "/como-funciona", label: t.pub.nav.how },
        { href: "/para-gestorias", label: t.pub.nav.firms },
        { href: "/demo", label: t.pub.nav.demo },
        { href: "/preguntas-frecuentes", label: t.pub.nav.faq },
        { href: "/contacto", label: t.pub.nav.contact },
      ];
  const legal = LEGAL_DOCS.map((d) => ({ href: `/legal/${d.slug}`, label: tr(d.title) }));
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-page items-center gap-3 px-4 sm:gap-6 sm:px-8">
          {firmSite ? (
            // The gestoría leads; PreRenta is credited as the platform beside it.
            <Link href="/" className={cx(f.brand, "mr-auto")}>
              <span className={f.firmMark} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL from Ajustes › Despacho */}
                {logo ? <img src={logo} alt="" /> : initials(firmName)}
              </span>
              <span className={f.firmBrand}>
                <b>{firmName}</b>
                <span className={f.withPreRenta}>
                  {t.pub.footerFirm.withLabel}{" "}
                  <span>Pre<em>Renta</em></span>
                </span>
              </span>
            </Link>
          ) : (
            <Link href="/" className={cx(f.brand, "mr-auto")}>
              <Brand />
            </Link>
          )}
          <nav aria-label={t.nav.sections} className="hidden gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className={cx(f.navLink, path === n.href && f.navActive)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <LangSwitch />
          <ButtonLink href="/acceso" size="sm" variant="primary" aria-label={t.pub.nav.signIn} className="max-[359px]:px-2.5">
            <LogIn size={15} aria-hidden="true" />
            <span className="max-[359px]:sr-only">{t.pub.nav.signIn}</span>
          </ButtonLink>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {firmSite ? (
        // The gestoría's footer: who it is and how to reach it, help and legal (its own data-protection notice first).
        <footer className={cx(f.footer, "on-dark")}>
          <div className={f.inner}>
            {/* Three columns that start level: the gestoría (name, how to reach it), help, legal. Contacto is in Help. */}
            <div className={f.mainFirm}>
              <div className={f.firmCol}>
                <p className={f.firmTitle}>{firmName}</p>
                {(firm.phone || firm.email || firm.address) && (
                  <ul className={f.firmContact}>
                    {firm.phone && <li><Phone size={15} aria-hidden="true" /><a href={`tel:${firm.phone.replace(/\s+/g, "")}`}>{firm.phone}</a></li>}
                    {firm.email && <li><Mail size={15} aria-hidden="true" /><a href={`mailto:${firm.email}`}>{firm.email}</a></li>}
                    {firm.address && <li><MapPin size={15} aria-hidden="true" /><span>{firm.address}</span></li>}
                  </ul>
                )}
              </div>
              <FooterLinks title={t.pub.footerFirm.help} links={nav} />
              <FooterLinks
                title={t.pub.footer.legal}
                links={[...(privacyDoc ? [{ href: privacyDoc, label: t.pub.footerFirm.firmPrivacy(firmName), external: true }] : []), ...legal]}
              />
            </div>
            <div className={f.legal}>
              <span>{t.pub.footerFirm.rights(year, firmName)}</span>
              <span>
                {t.landing.poweredBy} <span className={f.wordmarkSmall}>Pre<span>Renta</span></span>
              </span>
            </div>
          </div>
        </footer>
      ) : (
        // PreRenta's footer on its main domain: the brand statement, the site and legal.
        <footer className={cx(f.footer, "on-dark")}>
          <div className={f.inner}>
            <div className={f.main}>
              <span className={f.wordmark}>
                Pre<span>Renta</span>
              </span>
              <div className={f.statement}>
                <p className={f.tagline}>{t.pub.footer.tagline}</p>
                <p className={f.about}>{t.pub.footer.about}</p>
              </div>
              <div className={f.links}>
                <FooterLinks title={t.pub.footer.product} links={nav} />
                <FooterLinks title={t.pub.footer.legal} links={legal} />
              </div>
            </div>

            <div aria-hidden="true" className={cx(f.watermark, "display-tight")}>
              <span>PreRenta</span>
            </div>

            <div className={f.legal}>
              <span>© {year} PreRenta</span>
              <span>{t.pub.footer.tagline}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string; external?: boolean }[] }) {
  return (
    <nav aria-label={title} className={f.group}>
      <h2 className={f.groupTitle}>{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            {l.external ? <a href={l.href} target="_blank" rel="noopener">{l.label}</a> : <Link href={l.href}>{l.label}</Link>}
          </li>
        ))}
      </ul>
    </nav>
  );
}
