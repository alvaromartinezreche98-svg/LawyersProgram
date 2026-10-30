"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ClipboardList, FileSignature, ShieldCheck, type LucideIcon } from "lucide-react";
import { actions, clientName, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile, HUES } from "@/components/ui/icons";
import { Button, Card, Eyebrow, Notice, cx } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

const STEP_ICONS: LucideIcon[] = [ShieldCheck, ClipboardList, FileSignature];

/** C1 · Bienvenida: shown on the client's first sign-in; they confirm they are the taxpayer. */
export function Welcome() {
  const exp = useClientExp();
  const { firm } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const name = clientName(exp);
  const [ok, setOk] = useState(!!exp.identityConfirmedAt);
  const [missing, setMissing] = useState(false);
  const box = useRef<HTMLInputElement>(null);

  const go = () => {
    if (!ok) {
      setMissing(true);
      box.current?.focus();
      return;
    }
    if (!exp.identityConfirmedAt) actions.confirmIdentity(exp.id);
    router.push("/inicio");
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 py-4">
      <PageTitle>{t.titles.welcome}</PageTitle>
      <div>
        <Eyebrow>{t.home.eyebrow(exp.ejercicio)}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(24px,2.6vw,30px)] font-semibold">{t.welcome.title(name.split(" ")[0] ?? "")}</h1>
        <p className="mt-2 max-w-[60ch] text-muted">{t.welcome.intro(firm.name.trim() || "Su gestoría")}</p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {t.welcome.steps.map(([title, d], i) => (
          <li key={title} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
            <IconTile icon={STEP_ICONS[i]} size="sm" tone={HUES[i % HUES.length]} />
            <b className="text-[14.5px] font-semibold">{title}</b>
            <span className="text-[13px] text-muted">{d}</span>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <label className={cx("flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[15px] transition-colors", ok ? "border-accent bg-accent-soft" : missing ? "border-bad bg-bad-soft" : "border-line-strong hover:bg-sunk")}>
          <input ref={box} type="checkbox" checked={ok} onChange={(e) => { setOk(e.target.checked); setMissing(false); }} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          {t.welcome.confirm(name)}
        </label>
        {missing && <Notice tone="bad">{t.welcome.needConfirm}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-muted">{t.welcome.notYou}</span>
          <Button variant="primary" size="lg" onClick={go}>
            {t.welcome.continue} →
          </Button>
        </div>
      </Card>
    </div>
  );
}
