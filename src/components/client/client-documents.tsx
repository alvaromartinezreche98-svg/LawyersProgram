"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { collectDocs } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { FileThumb } from "@/components/ui/file-chip";
import { Card, Eyebrow, Notice, Pill } from "@/components/ui/primitives";
import { openTasks } from "@/lib/data/store";
import { IconTile, SECTION_ICON } from "@/components/ui/icons";
import { useClientExp } from "./client-shell";

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
      {SCHEMA.map((s) => {
        const list = docs.filter((d) => d.section === s.slug);
        if (!list.length) return null;
        return (
          <Card key={s.slug} className="p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="display-tight flex items-center gap-3 text-[16px] font-semibold">
                <IconTile icon={SECTION_ICON[s.slug]} size="sm" />
                {tr(s.title)}
              </h2>
              <Link href={`/declaracion/${s.slug}`} className="text-sm font-semibold whitespace-nowrap text-accent">
                {t.docs.goSection}
              </Link>
            </div>
            <ul className="flex flex-col">
              {list.map((d, i) => (
                <li key={i} className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {d.context && <div className="text-xs text-muted">{tr(d.context)}</div>}
                    <div className="text-[14.5px] font-medium">{tr(d.label)}</div>
                  </div>
                  {d.files.length ? (
                    <ul className="flex flex-wrap gap-2 sm:justify-end">
                      {d.files.map((f) => (
                        <li key={f.id} className="flex max-w-[240px] items-center gap-2 rounded-md border border-line bg-sunk py-1 pr-2.5 pl-1 text-xs">
                          <FileThumb file={f} size={28} />
                          <span className="truncate">{f.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Pill tone="warn">{t.common.missing}</Pill>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
