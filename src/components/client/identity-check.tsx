"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { asFiles } from "@/lib/questionnaire/progress";
import { actions, clientName } from "@/lib/data/store";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Card, Eyebrow, Notice, cx } from "@/components/ui/primitives";
import { QuestionnaireForm } from "@/components/questionnaire/field-list";
import { useClientExp } from "./client-shell";

const DNI = SCHEMA[0].fields.find((f) => f.id === "doc_dni")!;

/**
 * A6 · Verificación de identidad: "I am the taxpayer" plus the DNI/NIE. The
 * upload is the questionnaire's own DNI question, so the files land in
 * Datos personales and are never asked for twice. The DNI can wait; the
 * confirmation cannot.
 */
export function IdentityCheck() {
  const exp = useClientExp();
  const { t, p } = usePlatformText();
  const router = useRouter();
  const i = p.identity;
  const [ok, setOk] = useState(!!exp.identityConfirmedAt);
  const [missing, setMissing] = useState<"" | "confirm" | "dni">("");
  const box = useRef<HTMLInputElement>(null);
  const hasDni = asFiles(exp.answers.doc_dni).length > 0;

  const go = (later: boolean) => {
    if (!ok) {
      setMissing("confirm");
      box.current?.focus();
      return;
    }
    if (!hasDni && !later) {
      setMissing("dni");
      return;
    }
    if (!exp.identityConfirmedAt) actions.confirmIdentity(exp.id);
    router.push("/inicio");
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 py-4">
      <PageTitle>{i.title}</PageTitle>
      <div>
        <Eyebrow>{i.eyebrow}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(24px,2.6vw,30px)] font-semibold">{i.title}</h1>
        <p className="mt-2 max-w-[60ch] text-muted">{i.intro}</p>
      </div>

      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <label className={cx("flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[15px] transition-colors", ok ? "border-accent bg-accent-soft" : missing === "confirm" ? "border-bad bg-bad-soft" : "border-line-strong hover:bg-sunk")}>
          <input ref={box} type="checkbox" checked={ok} onChange={(e) => { setOk(e.target.checked); setMissing(""); }} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          {t.welcome.confirm(clientName(exp))}
        </label>
        {missing === "confirm" && <Notice tone="bad">{t.welcome.needConfirm}</Notice>}

        <div className="flex flex-col gap-2 border-t border-line pt-5">
          <QuestionnaireForm
            fields={[DNI]}
            answers={exp.answers}
            onChange={(path, value) => { actions.setAnswer(exp.id, path, value); setMissing(""); }}
            onUpdate={(path, fn) => { actions.updateAnswer(exp.id, path, fn); setMissing(""); }}
            idBase="identity"
            exp={exp}
            section={SCHEMA[0].slug}
          />
          <p className="text-[13px] text-muted">{i.dniHelp}</p>
        </div>
        {missing === "dni" && <Notice tone="bad">{i.needDni}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-muted">{t.welcome.notYou}</span>
          <span className="flex flex-wrap items-center gap-2">
            {!hasDni && <Button variant="ghost" onClick={() => go(true)}>{i.later}</Button>}
            <Button variant="primary" size="lg" onClick={() => go(false)}>
              {i.continue}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </span>
        </div>
      </Card>
    </div>
  );
}
