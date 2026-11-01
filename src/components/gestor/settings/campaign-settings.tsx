"use client";

import { actions, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card } from "@/components/ui/primitives";
import { Field, SectionHead } from "./settings-layout";
import { DateField } from "@/components/ui/date-field";

const KEYS = ["filing", "directDebit"] as const;

/** G7 · Campaña: deadlines shown as countdowns in the Cases list. */
export function CampaignSettings() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const c = t.settings.campaign;
  const set = (k: (typeof KEYS)[number], v: string) => actions.updateFirm({ campaign: { ...firm.campaign, [k]: v || undefined } });

  return (
    <>
      <SectionHead title={c.title} intro={c.intro} />
      <Card pad="lg" className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {KEYS.map((k) => (
            <Field key={k} id={`camp-${k}`} label={c[k]}>
              <div className="flex gap-2">
                <DateField id={`camp-${k}`} value={firm.campaign?.[k] ?? ""} onChange={(v) => set(k, v)} />
                {firm.campaign?.[k] && (
                  <Button variant="ghost" onClick={() => set(k, "")}>
                    {c.clear}
                  </Button>
                )}
              </div>
            </Field>
          ))}
        </div>
        <p className="text-[12.5px] text-muted">{c.hint}</p>
      </Card>
    </>
  );
}
