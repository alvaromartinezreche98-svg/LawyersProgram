"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, FileSignature, ShieldCheck, type LucideIcon } from "lucide-react";
import { clientName, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, Eyebrow } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

const STEP_ICONS: LucideIcon[] = [ShieldCheck, ClipboardList, FileSignature];

/** C1 · Bienvenida: shown on the client's first sign-in; the identity check (A6) comes next. */
export function Welcome() {
  const exp = useClientExp();
  const { firm } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const name = clientName(exp);
  const go = () => router.push(exp.identityConfirmedAt ? "/inicio" : "/verificacion");

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
          <li key={title} className="flex flex-col gap-2 rounded-lg border border-line bg-surface pad-tile">
            <IconTile icon={STEP_ICONS[i]} size="sm" />
            <b className="text-[14.5px] font-semibold">{title}</b>
            <span className="text-[13px] text-muted">{d}</span>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-muted">{t.welcome.notYou}</span>
          <Button variant="primary" size="lg" onClick={go}>
            {t.welcome.continue} →
          </Button>
        </div>
      </Card>
    </div>
  );
}
