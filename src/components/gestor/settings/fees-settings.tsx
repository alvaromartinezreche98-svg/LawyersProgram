"use client";

import { Landmark } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import type { Fees } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { Field, SectionHead, inputCls } from "./settings-layout";

const AMOUNTS: (keyof Omit<Fees, "notes">)[] = ["base", "perProperty", "selfEmployed"];

/** G7 · Honorarios y cobro: what the firm charges, and the (future) Stripe payout account. */
export function FeesSettings() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const s = t.settings.fees;
  const set = (patch: Partial<Fees>) => actions.updateFirm({ fees: { ...firm.fees, ...patch } });

  return (
    <>
      <SectionHead title={s.title} intro={s.intro} />
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-3">
            {AMOUNTS.map((k) => (
              <Field key={k} id={`fee-${k}`} label={s[k]}>
                <div className="shadow-field flex h-(--control-h) items-center overflow-clip rounded-md border border-line-strong bg-surface transition-colors focus-within:border-focus focus-within:ring-4 focus-within:ring-focus/15">
                  <input id={`fee-${k}`} type="text" inputMode="decimal" placeholder="0,00" value={firm.fees[k]} onChange={(e) => set({ [k]: e.target.value })} className="figures h-full w-full bg-transparent px-3 text-right outline-hidden" />
                  <span className="grid h-full place-items-center border-l border-line bg-sunk px-3 text-[14px] text-muted">€</span>
                </div>
              </Field>
            ))}
          </div>
          <Field id="fee-notes" label={s.notes}>
            <textarea id="fee-notes" rows={3} value={firm.fees.notes} onChange={(e) => set({ notes: e.target.value })} className={inputCls + " h-auto resize-y py-2 leading-relaxed"} />
          </Field>
        </Card>

        <Card className="soft-wash flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <IconTile icon={Landmark} tone="info" />
            <h2 className="display-tight flex-1 text-[15px] font-semibold">{s.payoutTitle}</h2>
            <Pill>{t.side.soon}</Pill>
          </div>
          <p className="max-w-[64ch] text-[14px] text-muted">{s.payoutBody}</p>
          <Button disabled className="self-start">
            {s.connect}
          </Button>
        </Card>
      </div>
    </>
  );
}
