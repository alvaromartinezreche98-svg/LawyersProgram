"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/data/store";
import { statusText } from "@/lib/data/types";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import { LANGS, textIn, type Lang } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/use-i18n";
import { EMAIL_KINDS, buildEmail, renderHtml, renderText, type EmailData, type EmailKind } from "@/lib/notifications/templates";
import { Card, Notice, cx } from "@/components/ui/primitives";
import { Field, SectionHead, inputCls } from "./settings-layout";

/** G7 · Correos: preview of every email the platform sends, in each language, with this firm's name. */
export function EmailSettings() {
  const { firm } = useAppState();
  const { t, lang: uiLang } = useI18n();
  const c = t.settings.emails;
  const [kind, setKind] = useState<EmailKind>("invitation");
  const [lang, setLang] = useState<Lang>(uiLang);
  const [view, setView] = useState<"html" | "text">("html");
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOrigin(window.location.origin));
    return () => cancelAnimationFrame(raf);
  }, []);

  const m = MESSAGES[lang];
  const data: EmailData = {
    firmName: firm.name.trim() || m.landing.yourFirm,
    clientName: "Sonia Martínez Soler",
    year: EJERCICIO,
    link: `${origin}${kind === "invitation" ? "/invitacion/ex-sonia" : "/inicio"}`,
    status: textIn(statusText("revision"), lang),
    when: m.cita.when("05/11/2026", m.cita.slot.manana, "10:30"),
    kind: m.cita.kind.llamada,
  };
  const email = buildEmail(kind, lang, data);

  return (
    <>
      <SectionHead title={c.title} intro={c.intro} />
      <Card className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[min(100%,16rem)] grow basis-0">
            <Field id="em-kind" label={c.template}>
              <select id="em-kind" value={kind} onChange={(e) => setKind(e.target.value as EmailKind)} className={inputCls}>
                {EMAIL_KINDS.map((k) => (
                  <option key={k} value={k}>{c.kinds[k]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Seg label={c.language} value={lang} onChange={setLang} options={LANGS.map((l) => [l.id, l.label])} />
          <Seg label={c.format} value={view} onChange={setView} options={[["html", c.html], ["text", c.text]]} />
        </div>

        <dl className="grid gap-1 rounded-md border border-line bg-sunk px-4 py-3 text-[14px]">
          <div className="flex flex-wrap gap-x-2"><dt className="text-muted">{c.subject}:</dt><dd className="font-medium">{email.subject}</dd></div>
          <div className="flex flex-wrap gap-x-2"><dt className="text-muted">{c.preheader}:</dt><dd>{email.preheader}</dd></div>
        </dl>

        {view === "html" ? (
          <iframe title={c.previewTitle} sandbox="" srcDoc={renderHtml(email, data, lang)} className="h-[640px] w-full rounded-md border border-line bg-bg" />
        ) : (
          <pre className="max-h-[640px] overflow-auto rounded-md border border-line bg-sunk p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{renderText(email, data)}</pre>
        )}
        <Notice>{c.note}</Notice>
      </Card>
    </>
  );
}

function Seg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium">{label}</span>
      <div className="flex rounded-md border border-line bg-sunk p-0.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={cx("h-(--control-h-sm) rounded-sm px-3 text-[13px] font-medium transition-colors", value === v ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
