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
      {/*
        Three columns across the full page width: the documents, the text at a reading
        measure, and "On this page" (from xl) so the right side carries the document's outline.
      */}
      <div className="mx-auto grid w-full max-w-page items-start gap-x-16 gap-y-8 px-4 py-12 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_220px]">
        {/* From lg the links' text lines up with the page edge (and the logo); the highlight bleeds into the gutter. */}
        <nav aria-label={t.pub.footer.legal} className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:-ml-3 lg:flex-col">
          {LEGAL_DOCS.map((d) => (
            <Link key={d.slug} href={`/legal/${d.slug}`} aria-current={d.slug === doc.slug ? "page" : undefined} className={cx("rounded-md px-3 py-2 text-[14px] font-medium whitespace-nowrap", d.slug === doc.slug ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent")}>
              {tr(d.title)}
            </Link>
          ))}
        </nav>
        {/* One reading measure for everything in the document: title, notice and sections share the same right edge. */}
        <article className="flex w-full max-w-[72ch] min-w-0 flex-col gap-6 xl:max-w-none">
          <div>
            <Eyebrow>{t.pub.footer.legal}</Eyebrow>
            <h1 className="display-serif mt-1.5 text-[clamp(26px,3vw,34px)] font-semibold">{tr(doc.title)}</h1>
            <p className="mt-2 text-muted">{tr(doc.intro)}</p>
          </div>
          <Notice tone="warn">{t.pub.legal.draft}</Notice>
          {doc.sections.map((s, i) => (
            <section key={i} id={`s-${i + 1}`} className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="display-tight text-[18px] font-semibold">{tr(s.h)}</h2>
              {s.p.map((p, j) => (
                <p key={j} className="text-[15px] leading-relaxed">
                  <Filled text={tr(p)} />
                </p>
              ))}
            </section>
          ))}
        </article>
        <nav aria-label={t.pub.legal.onPage} className="hidden flex-col gap-1 xl:sticky xl:top-24 xl:flex">
          <p className="t-label mb-2 text-muted uppercase">{t.pub.legal.onPage}</p>
          {doc.sections.map((s, i) => (
            <a key={i} href={`#s-${i + 1}`} className="border-l-2 border-line py-1.5 pl-3 text-[14px] text-muted transition-colors hover:border-copper hover:text-ink">
              {tr(s.h)}
            </a>
          ))}
        </nav>
      </div>
    </PublicShell>
  );
}
