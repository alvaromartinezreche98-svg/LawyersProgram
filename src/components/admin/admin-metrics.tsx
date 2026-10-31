"use client";

import { usePlatform } from "@/lib/data/platform";
import { useAppState } from "@/lib/data/store";
import { STATUSES } from "@/lib/data/types";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { PageTitle } from "@/components/ui/app-shell";
import { Card } from "@/components/ui/primitives";
import { PageHead } from "@/components/gestor/page-head";
import { TopBar } from "@/components/gestor/gestor-shell";

/** X4 · Métricas: only what this demo's data can count (gestorías, cases); revenue waits for billing. */
export function AdminMetrics() {
  const { p, tr } = usePlatformText();
  const { firms } = usePlatform();
  const { exps } = useAppState();
  const m = p.metrics;
  const cases = Object.values(exps);
  // This installation's gestoría counts as active.
  const active = 1 + firms.filter((f) => f.status === "active").length;
  const pending = firms.filter((f) => f.status === "pending").length;
  const years = [...new Set(cases.map((e) => e.ejercicio))].sort((a, b) => b - a);
  const max = Math.max(1, ...years.map((y) => cases.filter((e) => e.ejercicio === y).length));

  return (
    <>
      <PageTitle>{m.title}</PageTitle>
      <TopBar crumbs={[{ label: m.title }]} />
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <PageHead eyebrow={p.admin.area} title={m.title} intro={m.intro} />
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label={m.active} value={String(active)} />
          <Tile label={m.pending} value={String(pending)} copper={pending > 0} />
          <Tile label={m.cases} value={String(cases.length)} />
          <Tile label={m.revenue} value="—" note={m.revenueNone} />
        </dl>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-[15px] font-semibold">{m.byCampaign}</h2>
            <ul className="flex flex-col gap-3">
              {years.map((y) => {
                const n = cases.filter((e) => e.ejercicio === y).length;
                return (
                  <li key={y} className="grid grid-cols-[8rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-[14px]">
                    <span className="whitespace-nowrap">{m.campaign(y)}</span>
                    <span className="h-2 overflow-clip rounded-sm bg-line"><i className="block h-full bg-accent" style={{ width: `${(n / max) * 100}%` }} /></span>
                    <span className="figures text-right font-semibold">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-[15px] font-semibold">{m.byStatus}</h2>
            <ul className="flex flex-col">
              {STATUSES.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-t border-line py-2 text-[14px] first:border-t-0 first:pt-0">
                  <span>{tr(s.label)}</span>
                  <span className="figures font-semibold">{cases.filter((e) => e.status === s.id).length}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Tile({ label, value, note, copper }: { label: string; value: string; note?: string; copper?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3 shadow-sheet">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={`figures mt-1 text-[22px] leading-7 font-semibold ${copper ? "text-copper-text" : ""}`}>{value}</dd>
      {note && <p className="mt-1 text-[12.5px] text-muted">{note}</p>}
    </div>
  );
}
