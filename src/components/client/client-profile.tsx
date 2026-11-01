"use client";

import { FolderOpen, Globe } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { actions, clientName } from "@/lib/data/store";
import { LANGS } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { QuestionnaireForm } from "@/components/questionnaire/field-list";
import { SaveStatus } from "@/components/ui/save-status";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Card, Eyebrow, StatusPill, cx } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

const CONTACT = SCHEMA[0].fields.filter((f) => ["nombre", "telefono", "email"].includes(f.id));

/** C10 · Perfil: contact details on the left; language and case summary on the right. */
export function ClientProfile() {
  const exp = useClientExp();
  const { t, lang, locale } = useI18n();
  const name = clientName(exp);
  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.profile}</PageTitle>
      <div>
        <Eyebrow>{t.nav.profile}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.profile.title}</h1>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card pad="none" className="overflow-clip">
          {/* Who this is, at a glance: initials, name and email, then the fields in two columns. */}
          <div className="flex items-center gap-4 border-b border-line bg-sunk/50 pad-card">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-[22px] font-semibold text-accent-ink shadow-[0_1px_2px_rgb(0_0_0/0.16)]" aria-hidden="true">{initialsOf(name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-semibold">{name || "—"}</p>
              <p className="truncate text-[14px] text-muted">{typeof exp.answers.email === "string" ? exp.answers.email : ""}</p>
            </div>
            {/* Live: saving… with a spinner while a field changes, then a tick and the time it was saved */}
            <SaveStatus idle={t.profile.autosaved} className="text-[12.5px] max-sm:hidden" />
          </div>
          <div className="pad-card">
            <h2 className="mb-4 text-[15px] font-semibold">{t.profile.contact}</h2>
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {CONTACT.map((f) => (
                <div key={f.id} className={cx("min-w-0", f.id === "nombre" && "sm:col-span-2")}>
                  <QuestionnaireForm fields={[f]} answers={exp.answers} idBase="perfil" onChange={(path, v) => actions.setAnswer(exp.id, path, v)} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card >
            <div className="mb-4 flex items-center gap-3">
              <IconTile icon={Globe} tone="info" />
              <h2 className="display-tight text-[15px] font-semibold">{t.common.language}</h2>
            </div>
            <div role="radiogroup" aria-label={t.common.language} className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={l.id === lang}
                  onClick={() => actions.setLang(l.id)}
                  className={cx("h-(--control-h) min-w-0 truncate rounded-md border px-2 text-[14px] font-medium transition-colors", l.id === lang ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface shadow-field hover:border-line-strong")}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Card>

          <Card >
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

const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
