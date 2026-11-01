"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LEGAL_DOCS } from "@/lib/legal/content";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch } from "@/components/ui/lang-switch";
import { Brand, ButtonLink, cx, HEADER_BAR, HEADER_LANG, HEADER_LOGO } from "@/components/ui/primitives";
import { LogIn, Mail, MapPin, Phone } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { PLATFORM_SITE } from "@/lib/site";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import f from "./public-shell.module.scss";
import { FirmEmblem, FirmWordmark } from "@/components/ui/firm-mark";

/**
 * Header and footer of every public page. Two sites share them (lib/site.ts):
 * on a gestoría's domain they belong to that gestoría, with PreRenta credited
 * as the platform; on PreRenta's main domain they carry the public website.
 * `bare` (the entry page): one screen with a minimal header (brand, language,
 * sign-in) and a single line of legal links instead of the footer.
 */
const SHOW_LEGAL_LINKS = false;

export function PublicShell({ children, bare }: { children: ReactNode; bare?: boolean }) {
  const { t, tr } = useI18n();
  const { p } = usePlatformText();
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
        { href: "/precios", label: p.pricing.title },
        { href: "/demo", label: t.pub.nav.demo },
        { href: "/preguntas-frecuentes", label: t.pub.nav.faq },
        { href: "/contacto", label: t.pub.nav.contact },
      ];
  const legal = LEGAL_DOCS.map((d) => ({ href: `/legal/${d.slug}`, label: tr(d.title) }));
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className={cx("sticky top-0 z-20 border-b", bare ? "border-transparent bg-bg" : "border-line bg-surface")}>
        <div className={cx("mx-auto flex w-full max-w-page items-center gap-3 px-4 sm:gap-6", bare ? cx(f.bareHead, "max-xl:max-w-[calc(36rem+2rem)] xl:px-8") : "sm:px-8", HEADER_BAR)}>
          {firmSite ? (
            // The gestoría alone: its mark and name (PreRenta is credited in the footer).
            <Link href="/" className={cx(f.brand, "mr-auto")}>
              {logo ? (
                <span className={f.firmMark} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL from Ajustes › Despacho */}
                  <img src={logo} alt="" />
                </span>
              ) : (
                // No logo uploaded yet: the gestoría's emblem.
                <FirmEmblem size={HEADER_LOGO} className="shrink-0" />
              )}
              <span className={f.firmBrand}>
                <FirmWordmark name={firmName} />
              </span>
            </Link>
          ) : (
            <Link href="/" className={cx(f.brand, "mr-auto")}>
              <Brand />
            </Link>
          )}
          <nav aria-label={t.nav.sections} className={cx("hidden gap-1", !bare && "lg:flex")}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className={cx(f.navLink, path === n.href && f.navActive)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <LangSwitch className={HEADER_LANG} />
          {/* The entry page is the sign-in itself: no button for it in its header. */}
          {!bare && <ButtonLink href="/acceso" size="sm" variant="primary" aria-label={t.pub.nav.signIn} className="max-[359px]:px-2.5">
            <LogIn size={15} aria-hidden="true" />
            <span className="max-[359px]:sr-only">{t.pub.nav.signIn}</span>
          </ButtonLink>}
        </div>
      </header>

      <main className={cx("flex-1", bare && "flex flex-col")}>{children}</main>

      {bare ? (
        <footer className="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-[12.5px] text-muted max-xl:max-w-[calc(36rem+2rem)] max-xl:px-4 sm:py-4 sm:text-[13px] xl:px-8">
          <span>© {year} {firmSite ? firmName : "PreRenta"}</span>
          {/* Legal links hidden for now on the entry page: set SHOW_LEGAL_LINKS to bring them back. */}
          {SHOW_LEGAL_LINKS && legal.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent hover:underline">{l.label}</Link>
          ))}
          {firmSite && (
            <span className="sm:ml-auto">
              {t.landing.poweredBy} <b className="font-semibold text-ink">Pre<span className="text-copper-text">Renta</span></b>
            </span>
          )}
        </footer>
      ) : firmSite ? (
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
