"use client";

import { useState } from "react";
import { ExternalLink, FileSignature, ShieldCheck, type LucideIcon } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { LEGAL_KINDS, signState, signingDone, type SignState } from "@/lib/data/legal";
import type { Expediente, LegalKind } from "@/lib/data/types";
import { asItems, asText } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { IconTile } from "@/components/ui/icons";
import { Button, Notice, Pill } from "@/components/ui/primitives";

const ICON: Record<LegalKind, LucideIcon> = { privacy: ShieldCheck, mandate: FileSignature };
export const SIGN_TONE: Record<SignState, "ok" | "warn" | "neutral" | "info"> = { signed: "ok", outdated: "warn", pending: "warn", unavailable: "neutral" };

/** C3 · Firma: the client reads and signs the gestoría's data-protection notice and mandate. */
export function SignStep({ exp, readOnly = false }: { exp: Expediente; readOnly?: boolean }) {
  const { firm } = useAppState();
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-[62ch] text-muted">{t.sign.intro}</p>
      {signingDone(exp, firm) && LEGAL_KINDS.some((k) => firm.docs[k]) && <Notice tone="ok">{t.sign.allDone}</Notice>}
      {LEGAL_KINDS.map((k) => (
        <SignCard key={k} exp={exp} kind={k} readOnly={readOnly} />
      ))}
      <p className="text-[12.5px] text-muted">{t.sign.legalNote}</p>
    </div>
  );
}

function SignCard({ exp, kind, readOnly }: { exp: Expediente; kind: LegalKind; readOnly: boolean }) {
  const { firm } = useAppState();
  const { t, locale } = useI18n();
  const doc = firm.docs[kind];
  const state = signState(exp, firm, kind);
  const sig = exp.signatures?.[kind];
  const url = useFileUrl(doc?.file ?? null);
  const titular = asItems(exp.answers.miembros).find((m) => asText(m.parentesco) === "Titular");
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState(asText(exp.answers.nombre));
  const [dni, setDni] = useState(titular ? asText(titular.dni) : "");
  const canSign = accepted && name.trim() && dni.trim();
  const title = kind === "privacy" ? t.settings.legal.privacy : t.settings.legal.mandate;
  const desc = kind === "privacy" ? t.settings.legal.privacyDesc : t.settings.legal.mandateDesc;
  const field = "field h-(--control-h) text-[15px]";

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line pad-card">
      <div className="flex items-start gap-3">
        <IconTile icon={ICON[kind]} tone={state === "signed" ? "ok" : "accent"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="display-tight text-[15px] font-semibold">{title}</h2>
            <Pill tone={SIGN_TONE[state]}>{t.sign.state[state]}</Pill>
          </div>
          <p className="text-[13.5px] text-muted">{desc}</p>
        </div>
      </div>

      {!doc ? (
        <Notice>{t.sign.unavailable}</Notice>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-sunk px-3 py-2 text-[13.5px]">
            <span className="min-w-0 flex-1 truncate font-medium">{doc.file.name}</span>
            <span className="text-muted">{t.sign.version(doc.version)}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                {t.sign.open}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </div>

          {sig && <p className="text-[13.5px] text-ok">{t.sign.signed(fmtTime(sig.signedAt, locale), sig.version)} · {sig.signerName}</p>}
          {state === "outdated" && <Notice tone="warn">{t.sign.outdated}</Notice>}

          {!readOnly && state !== "signed" && (
            <div className="flex flex-col gap-3 border-t border-line pt-3">
              <label className="flex items-start gap-2.5 text-[14px]">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
                {t.sign.accept}
              </label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end">
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
                  {t.sign.signer}
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
                  {t.sign.signerId}
                  <input value={dni} onChange={(e) => setDni(e.target.value.toUpperCase())} className={field + " font-mono"} />
                </label>
                <Button variant="primary" disabled={!canSign} onClick={() => actions.sign(exp.id, kind, name.trim(), dni.trim())}>
                  <FileSignature size={16} aria-hidden="true" />
                  {t.sign.sign}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
