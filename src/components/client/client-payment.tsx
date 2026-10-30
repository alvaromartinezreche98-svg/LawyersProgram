"use client";

import { CircleCheck, CreditCard } from "lucide-react";
import { SIMULATED_PAYMENT } from "@/lib/features";
import { actions, useAppState } from "@/lib/data/store";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, EmptyState, Eyebrow, Notice } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

/** C7 · Pago: the gestoría's fee, broken down, and the (simulated) payment. */
export function ClientPayment() {
  const exp = useClientExp();
  const { firm } = useAppState();
  const { t, locale } = useI18n();
  const fee = feeFor(exp, firm);
  const label = (k: "base" | "perProperty" | "selfEmployed", qty: number) => (k === "base" ? t.pay.base : k === "perProperty" ? t.pay.perProperty(qty) : t.pay.selfEmployed);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.pay}</PageTitle>
      <div>
        <Eyebrow>{firm.name.trim() || t.nav.pay}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.pay.title}</h1>
        <p className="mt-2 text-muted">{t.pay.intro}</p>
      </div>

      <Card className="overflow-clip">
        {!fee ? (
          <EmptyState icon={CreditCard} title={t.pay.noFees} />
        ) : (
          <>
            <dl className="divide-y divide-line">
              {fee.lines.map((l) => (
                <div key={l.key} className="flex items-baseline justify-between gap-4 px-5 py-3 text-[14.5px]">
                  <dt>{label(l.key, l.qty)}</dt>
                  <dd className="figures font-medium">{fmtEuros(l.amount, locale)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 bg-sunk px-5 py-3.5">
                <dt className="font-semibold">{t.pay.total}</dt>
                <dd className="figures text-[18px] font-semibold">{fmtEuros(fee.total, locale)}</dd>
              </div>
            </dl>
            {firm.fees.notes.trim() && (
              <div className="border-t border-line px-5 py-3 text-[13.5px]">
                <span className="font-medium">{t.pay.notes}: </span>
                <span className="text-muted">{firm.fees.notes}</span>
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-line px-5 py-4">
              {exp.payment ? (
                <div className="flex items-center gap-3">
                  <IconTile icon={CircleCheck} tone="ok" />
                  <span className="text-[14.5px]">
                    <b className="figures font-semibold">{fmtEuros(exp.payment.amount, locale)}</b> · {t.pay.paid(fmtTime(exp.payment.paidAt, locale))}
                  </span>
                </div>
              ) : !SIMULATED_PAYMENT ? (
                <Notice tone="info">{t.pay.unavailable}</Notice>
              ) : (
                <Button variant="primary" size="lg" className="self-start" onClick={() => actions.pay(exp.id, fee.total)}>
                  <CreditCard size={17} aria-hidden="true" />
                  {t.pay.pay(fmtEuros(fee.total, locale))}
                </Button>
              )}
              {SIMULATED_PAYMENT && <Notice tone="warn">{t.pay.simulated}</Notice>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
