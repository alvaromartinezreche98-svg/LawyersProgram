"use client";

import Link from "next/link";
import { Fragment } from "react";
import { COMPANY, type CompanyKey } from "@/lib/company";
import { LEGAL_DOCS, type LegalDoc } from "@/lib/legal/content";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { Eyebrow, Notice, cx } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

/** A company detail that has not been supplied yet, shown as such instead of invented. */
export function Pending({ k }: { k: CompanyKey }) {
  const { t } = useI18n();
  return <mark className="rounded-sm bg-warn-soft px-1 text-warn">[{t.pub.legal.pending(t.pub.legal.fields[k])}]</mark>;
}

/** Fills {placeholders} from COMPANY. */
function Filled({ text }: { text: string }) {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    if (!m || !(m[1] in COMPANY)) return <Fragment key={i}>{part}</Fragment>;
    const k = m[1] as CompanyKey;
    const v = COMPANY[k] || (k === "privacyEmail" ? COMPANY.email : "");
    return <Fragment key={i}>{v || <Pending k={k} />}</Fragment>;
  });
}

/** P7 · Legal: one document, with links to the others. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t, tr } = useI18n();
  return (
    <PublicShell>
      <PageTitle>{tr(doc.title)}</PageTitle>
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={t.pub.footer.legal} className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col">
          {LEGAL_DOCS.map((d) => (
            <Link key={d.slug} href={`/legal/${d.slug}`} aria-current={d.slug === doc.slug ? "page" : undefined} className={cx("rounded-md px-3 py-2 text-[14px] font-medium whitespace-nowrap", d.slug === doc.slug ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent")}>
              {tr(d.title)}
            </Link>
          ))}
        </nav>
        <article className="flex min-w-0 flex-col gap-6">
          <div>
            <Eyebrow>{t.pub.footer.legal}</Eyebrow>
            <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,34px)] font-semibold">{tr(doc.title)}</h1>
            <p className="mt-2 max-w-[68ch] text-muted">{tr(doc.intro)}</p>
          </div>
          <Notice tone="warn">{t.pub.legal.draft}</Notice>
          {doc.sections.map((s, i) => (
            <section key={i} className="flex max-w-[72ch] flex-col gap-2">
              <h2 className="display-tight text-[18px] font-semibold">{tr(s.h)}</h2>
              {s.p.map((p, j) => (
                <p key={j} className="text-[15px] leading-relaxed">
                  <Filled text={tr(p)} />
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </PublicShell>
  );
}
