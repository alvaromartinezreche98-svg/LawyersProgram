"use client";

import { FolderOpen, Globe, UserRound } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { actions } from "@/lib/data/store";
import { LANGS } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { QuestionnaireForm } from "@/components/questionnaire/field-list";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Card, CardTitle, Eyebrow, StatusPill, cx } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

const CONTACT = SCHEMA[0].fields.filter((f) => ["nombre", "telefono", "email"].includes(f.id));

/** C10 · Perfil: contact details on the left; language and case summary on the right. */
export function ClientProfile() {
  const exp = useClientExp();
  const { t, lang, locale } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.profile}</PageTitle>
      <div>
        <Eyebrow>{t.nav.profile}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.profile.title}</h1>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <IconTile icon={UserRound} />
            <div className="min-w-0 flex-1">
              <CardTitle aside={t.profile.autosaved}>{t.profile.contact}</CardTitle>
            </div>
          </div>
          <QuestionnaireForm fields={CONTACT} answers={exp.answers} idBase="perfil" onChange={(path, v) => actions.setAnswer(exp.id, path, v)} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <IconTile icon={Globe} tone="info" />
              <h2 className="display-tight text-[15px] font-semibold">{t.common.language}</h2>
            </div>
            <div role="radiogroup" aria-label={t.common.language} className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={l.id === lang}
                  onClick={() => actions.setLang(l.id)}
                  className={cx("h-(--control-h) rounded-md border px-4 text-[14px] font-medium transition-colors", l.id === lang ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface shadow-field hover:border-line-strong")}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <IconTile icon={FolderOpen} tone="neutral" />
              <h2 className="display-tight text-[15px] font-semibold">{t.profile.caseTitle}</h2>
            </div>
            <dl className="flex flex-col text-sm">
              <Row label={t.profile.year}>{exp.ejercicio}</Row>
              <Row label={t.home.status}>
                <StatusPill status={exp.status} />
              </Row>
              <Row label={t.file.created}>{fmtTime(exp.createdAt, locale)}</Row>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
