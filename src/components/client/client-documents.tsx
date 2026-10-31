"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, FileText, FolderOpen, Plus, Upload } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { collectDocs } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { FileCard } from "@/components/ui/file-card";
import { Card, Eyebrow, Notice, Pill, cx } from "@/components/ui/primitives";
import { openTasks } from "@/lib/data/store";
import { IconTile, SECTION_ICON } from "@/components/ui/icons";
import { useClientExp } from "./client-shell";
import d from "./client-documents.module.scss";

/** C4 · Mis documentos: every document the answers ask for, grouped by step. */
export function ClientDocuments() {
  const exp = useClientExp();
  const { t, tr } = useI18n();
  const docs = collectDocs(exp.answers);
  const uploaded = docs.reduce((n, d) => n + d.files.length, 0);
  const missing = docs.filter((d) => !d.files.length).length;
  const asked = openTasks(exp).filter((x) => x.target?.kind === "docs");

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.titles.documents}</PageTitle>
      <div>
        <Eyebrow>{t.docs.eyebrow}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.docs.title}</h1>
        <p className="mt-2 max-w-[62ch] text-muted">{t.docs.summary(uploaded, missing)}</p>
      </div>
      {docs.length > 0 && (
        // What was asked, what is in, what is still missing. "All done" only when nothing is missing.
        <dl className={d.register}>
          <div><IconTile icon={FileText} /><dt>{t.docs.reg.asked}</dt><dd>{docs.length}</dd></div>
          <div><IconTile icon={CircleCheck} tone="ok" /><dt>{t.docs.reg.uploaded}</dt><dd>{docs.length - missing}</dd></div>
          <div data-missing={missing > 0 || undefined}><IconTile icon={Upload} tone={missing > 0 ? "warn" : "ok"} /><dt>{t.docs.reg.missing}</dt><dd>{missing}</dd></div>
        </dl>
      )}
      {docs.length > 0 && missing === 0 && <p className={d.allDone}><CircleCheck size={16} aria-hidden="true" />{t.docs.reg.allDone}</p>}
      {asked.length > 0 && (
        <Notice tone="warn">
          <span className="font-medium">{t.tasks.yours}:</span>
          <ul className="mt-1 list-disc pl-5">
            {asked.map((x) => (
              <li key={x.id}>{tr(x.text)}</li>
            ))}
          </ul>
          <Link href="/inicio" className="mt-1.5 inline-block text-[13.5px] font-medium text-accent hover:underline">
            {t.tasks.markDone} →
          </Link>
        </Notice>
      )}
      {docs.length === 0 && (
        <Card className="soft-wash flex flex-col items-center gap-3 p-8 text-center">
          <IconTile icon={FolderOpen} tone="neutral" size="lg" />
          <p className="text-muted">{t.docs.none}</p>
          <Link href="/declaracion" className="font-semibold text-accent">
            {t.docs.startQ} →
          </Link>
        </Card>
      )}
      {/* By step, like folders in a drive: each document a row with its files as preview cards (an upload tile when it is still missing). */}
      {SCHEMA.map((s) => {
        const list = docs.filter((d) => d.section === s.slug);
        if (!list.length) return null;
        const n = list.reduce((k, x) => k + x.files.length, 0);
        return (
          <section key={s.slug} aria-labelledby={`docs-${s.slug}`} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <h2 id={`docs-${s.slug}`} className="flex min-w-0 items-center gap-3 text-[16px] font-semibold">
                <IconTile icon={SECTION_ICON[s.slug]} size="sm" />
                <span className="truncate">{tr(s.title)}</span>
                <span className="shrink-0 text-[13px] font-normal text-muted">{t.docs.card.files(n)}</span>
              </h2>
              <Link href={`/declaracion/${s.slug}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft">
                {t.docs.goSection.replace(/\s*→\s*$/, "")}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <ul className="flex flex-col gap-6">
              {list.map((d0, i) => {
                const href = `/declaracion/${d0.section}#q-${d0.field}${d0.item ? `-${d0.item}` : ""}`;
                return (
                  <li key={i} className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-[14.5px] font-semibold text-ink">{tr(d0.label)}</span>
                      {d0.context && <span className="text-[12.5px] text-muted">· {tr(d0.context)}</span>}
                      {!d0.files.length && <Pill tone="warn">{t.common.missing}</Pill>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                      {d0.files.map((f) => <FileCard key={f.id} file={f} replaceHref={href} />)}
                      {/* the way to add one: a dashed tile that leads to the question */}
                      <Link href={href} className={cx("group/up flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors", d0.files.length ? "border-line text-muted hover:border-accent/50 hover:bg-accent-soft/40 hover:text-accent" : "border-warn/40 bg-warn-soft/40 text-warn hover:border-warn hover:bg-warn-soft")}>
                        <span className="grid size-10 place-items-center rounded-full bg-surface shadow-sm transition-transform group-hover/up:scale-110">
                          {d0.files.length ? <Plus size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
                        </span>
                        <span className="text-[13px] font-semibold">{d0.files.length ? t.docs.reg.add : t.docs.card.uploadHere}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
