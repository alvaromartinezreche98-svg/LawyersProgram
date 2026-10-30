"use client";

import { History } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { casesOfClient } from "@/lib/data/years";
import { fmtEuros } from "@/lib/data/fees";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { Card, EmptyState, Eyebrow, Pill, StatusPill } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

/** C9 · Mis declaraciones: the client's cases for every tax year. */
export function ClientHistory() {
  const exp = useClientExp();
  const { exps } = useAppState();
  const { t, locale } = useI18n();
  const all = casesOfClient(exps, exp);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.history}</PageTitle>
      <div>
        <Eyebrow>{t.nav.history}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.years.history}</h1>
        <p className="mt-2 text-muted">{t.years.historyIntro}</p>
      </div>
      <Card className="overflow-clip">
        {all.length < 2 ? (
          <EmptyState inset icon={History} title={t.years.none} />
        ) : (
          <>
            <div className="hidden grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_120px] gap-4 border-b border-line bg-sunk px-5 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase sm:grid">
              <span>{t.years.cols.year}</span>
              <span>{t.years.cols.status}</span>
              <span>{t.years.cols.result}</span>
              <span className="text-right">{t.years.cols.paid}</span>
            </div>
            <ul>
              {all.map((e) => (
                <li key={e.id} className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line px-5 py-3 first:border-t-0 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_120px] sm:items-center">
                  <span className="figures flex items-center gap-2 font-semibold">
                    {e.ejercicio}
                    {e.id === exp.id && <Pill tone="accent">{t.years.current}</Pill>}
                  </span>
                  <span>
                    <StatusPill status={e.status} />
                  </span>
                  <span className="figures col-start-2 text-[14px] sm:col-start-auto">{e.result ? `${t.result.kind[e.result.kind]} · ${e.result.amount} €` : "—"}</span>
                  <span className="figures col-start-2 text-[14px] sm:col-start-auto sm:text-right">{e.payment ? fmtEuros(e.payment.amount, locale) : "—"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
