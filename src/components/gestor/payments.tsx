"use client";

import { FEATURES } from "@/lib/features";

import Link from "next/link";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { caseOrder, clientName, useAppState } from "@/lib/data/store";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, EmptyState, Notice, Pill } from "@/components/ui/primitives";
import { Chip, Chips, PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";

/** G6 · Cobros: what each case owes, what has been paid. */
export function Payments() {
  const { exps, firm } = useAppState();
  const { t, locale } = useI18n();
  const rows = caseOrder(exps).map((e) => ({ e, fee: feeFor(e, firm) }));
  const paid = rows.reduce((s, r) => s + (r.e.payment?.amount ?? 0), 0);
  const pending = rows.reduce((s, r) => s + (!r.e.payment && r.fee ? r.fee.total : 0), 0);
  const configured = rows.some((r) => r.fee) || rows.some((r) => r.e.payment);
  // Quick filter: all, pending or paid (the list keeps the case order).
  const [show, setShow] = useState<"all" | "pending" | "paid">("all");
  const nPaid = rows.filter((r) => r.e.payment).length;
  const shown = rows.filter((r) => (show === "all" ? true : show === "paid" ? !!r.e.payment : !r.e.payment));

  return (
    <>
      <PageTitle>{t.titles.cobros}</PageTitle>
      <TopBar crumbs={[{ label: t.cobros.title }]} />
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <PageHead title={t.cobros.title} intro={t.cobros.intro} />

        {!configured ? (
          <EmptyState icon={Wallet} title={t.cobros.noFees}>
            <ButtonLink href="/ajustes/honorarios" size="sm" className="mt-2">
              {t.cobros.configure}
            </ButtonLink>
          </EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:max-w-[520px]">
              <Stat label={t.cobros.totalPaid} value={fmtEuros(paid, locale)} tone="text-ok" />
              <Stat label={t.cobros.totalPending} value={fmtEuros(pending, locale)} tone="text-ink" />
            </div>
            <Chips label={t.cobros.filter.label} scroll>
              {([["all", t.cobros.filter.all, rows.length], ["pending", t.cobros.filter.pending, rows.length - nPaid], ["paid", t.cobros.filter.paid, nPaid]] as const).map(([id, label, n]) => (
                <Chip key={id} on={show === id} count={n} onClick={() => setShow(id)}>
                  {label}
                </Chip>
              ))}
            </Chips>
            <div className="overflow-clip rounded-lg border border-line bg-surface">
              <div className="table-head hidden grid-cols-[minmax(0,1.5fr)_140px_120px_160px] gap-4 sm:grid">
                <span>{t.cobros.cols.client}</span>
                <span className="text-right">{t.cobros.cols.amount}</span>
                <span>{t.cobros.cols.status}</span>
                <span>{t.cobros.cols.date}</span>
              </div>
              <ul>
                {shown.map(({ e, fee }) => (
                  <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.5fr)_140px_120px_160px]">
                    <Link href={`/expedientes/${e.id}`} className="truncate font-medium hover:underline">
                      {clientName(e) || t.common.unnamedClient}
                    </Link>
                    <span className="figures text-right font-medium">{e.payment ? fmtEuros(e.payment.amount, locale) : fee ? fmtEuros(fee.total, locale) : "—"}</span>
                    <span>{e.payment ? <Pill tone="ok">{t.cobros.paid}</Pill> : <Pill tone="warn">{t.cobros.pending}</Pill>}</span>
                    <span className="figures text-[12.5px] text-muted">{e.payment ? fmtTime(e.payment.paidAt, locale) : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {/* Until a payout account is connected nothing is charged: said plainly, with the way to fix it. */}
        <Notice
          tone="info"
          title={t.cobros.simulatedTitle}
          actions={FEATURES.firmSettings && <ButtonLink href="/ajustes/honorarios" size="sm">{t.cobros.simulatedAction}</ButtonLink>}
        >
          {t.cobros.simulated}
        </Notice>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface pad-tile">
      <span className="block text-[12.5px] text-muted">{label}</span>
      <b className={`figures mt-1 block text-[20px] font-semibold ${tone}`}>{value}</b>
    </div>
  );
}
