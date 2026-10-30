"use client";

import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { useState, type DragEvent } from "react";
import { CalendarClock, ChartNoAxesColumn, CircleAlert, Clock, FolderOpen, MessageCircle, SearchCheck, Send, TriangleAlert, type LucideIcon } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import { STATUSES, awaitingApproval, type Status } from "@/lib/data/types";
import { daysUntil, needsAttention, sortCases, triage, type Triage } from "@/lib/gestor/triage";
import { IconTile } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { ProgressBar, cx } from "@/components/ui/primitives";
import { PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";
import { DeadlineChips } from "./case-list";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/** G1 · Panel de campaña: cases in columns by status, deadlines and workload per accountant. */
export function CampaignBoard() {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const [only, setOnly] = useState(false);
  const [over, setOver] = useState<Status | null>(null);
  const all = Object.values(exps).map(triage);
  const shown = sortCases(only ? all.filter(needsAttention) : all, "attention");

  const drop = (status: Status) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id && exps[id] && exps[id].status !== status) actions.setStatus(id, status);
  };

  const members = [...firm.team.map((m) => ({ id: m.id as string | null, name: m.name })), { id: null, name: t.list.unassigned }];
  const load = members
    .map((m) => {
      const mine = all.filter((x) => (x.exp.assignee ?? null) === m.id && x.exp.status !== "listo");
      return { ...m, cases: mine.length, attention: mine.filter(needsAttention).length, approval: mine.filter((x) => awaitingApproval(x.exp)).length };
    })
    .filter((m) => m.id !== null || m.cases > 0);

  return (
    <>
      <PageTitle>{t.titles.board}</PageTitle>
      <TopBar crumbs={[{ label: t.board.title }]} />
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <PageHead
          title={t.board.title}
          intro={t.board.intro}
          actions={
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} className="size-4 accent-[var(--accent)]" />
              {t.board.onlyAttention}
            </label>
          }
        />
        <CampaignStats all={all} filing={firm.campaign?.filing} />
        <DeadlineChips />

        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="grid w-full min-w-[996px] auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3">
            {STATUSES.map((s) => {
              const col = shown.filter((x) => x.exp.status === s.id);
              return (
                <section
                  key={s.id}
                  aria-label={tr(s.label)}
                  onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
                  onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
                  onDrop={drop(s.id)}
                  className={cx("flex min-h-[220px] flex-col gap-2 rounded-lg border bg-sunk p-2 transition-colors", over === s.id ? "border-accent bg-accent-soft" : "border-line")}
                >
                  <header className="flex items-center justify-between px-1.5 py-1" title={tr(s.help)}>
                    <h2 className="text-[13px] font-semibold">{tr(s.label)}</h2>
                    <span className="figures text-[12px] text-muted">{col.length}</span>
                  </header>
                  {col.length === 0 && <p className="px-1.5 py-4 text-center text-[12.5px] text-muted">{t.board.empty}</p>}
                  {col.map((x) => (
                    <Card key={x.exp.id} x={x} member={firm.team.find((m) => m.id === x.exp.assignee)?.name} />
                  ))}
                </section>
              );
            })}
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="display-tight text-[15px] font-semibold">{t.board.workload}</h2>
          <div className="overflow-clip rounded-lg border border-line bg-surface">
            <div className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] gap-4 border-b border-line bg-sunk px-4 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">
              <span>{t.board.cols.member}</span>
              <span className="text-right">{t.board.cols.cases}</span>
              <span className="text-right">{t.board.cols.attention}</span>
              <span className="text-right">{t.board.cols.approval}</span>
            </div>
            {load.map((m) => (
              <div key={m.id ?? "none"} className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] gap-4 border-t border-line px-4 py-2.5 text-[14px] first:border-t-0">
                <span className={cx("truncate", m.id === null && "text-muted")}>{m.name}</span>
                <span className="figures text-right">{m.cases}</span>
                <span className={cx("figures text-right", m.attention ? "font-medium text-warn" : "text-muted")}>{m.attention}</span>
                <span className="figures text-right text-muted">{m.approval}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Card({ x, member }: { x: Triage; member?: string }) {
  const { t } = useI18n();
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", x.exp.id)}
      className="group relative flex cursor-grab flex-col gap-2 rounded-md border border-line bg-surface p-3 transition-colors hover:border-line-strong active:cursor-grabbing"
    >
      <Link href={`/expedientes/${x.exp.id}`} className="truncate text-[14px] font-medium after:absolute after:inset-0 hover:underline">
        {x.name || t.common.unnamedClient}
      </Link>
      <span className="flex items-center gap-2">
        <ProgressBar pct={x.pct} className="flex-1" />
        <span className="figures text-[12px] text-muted">{x.pct} %</span>
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        {x.unread > 0 && (
          <span className="inline-flex items-center gap-1 text-info">
            <MessageCircle size={13} aria-hidden="true" />
            {t.list.reasons.unread}
          </span>
        )}
        {x.bad > 0 && (
          <span className="inline-flex items-center gap-1 text-bad">
            <CircleAlert size={13} aria-hidden="true" />
            {t.list.missingN(x.bad)}
          </span>
        )}
        {x.warn > 0 && (
          <span className="inline-flex items-center gap-1 text-warn">
            <TriangleAlert size={13} aria-hidden="true" />
            {t.list.checkN(x.warn)}
          </span>
        )}
        {member && (
          <span className="ml-auto grid size-6 place-items-center rounded-full bg-accent-soft text-[10.5px] font-semibold text-accent" title={member}>
            {initials(member)}
          </span>
        )}
      </span>
    </article>
  );
}

/** Campaign at a glance: one figure per tile, each linking to the matching case list. */
function CampaignStats({ all, filing }: { all: Triage[]; filing?: string }) {
  const { t } = useI18n();
  const k = t.extra.kpi;
  const avg = all.length ? Math.round(all.reduce((n, x) => n + x.pct, 0) / all.length) : 0;
  const left = filing ? daysUntil(filing) : null;
  const tiles: { icon: LucideIcon; label: string; value: string; href?: string; urgent?: boolean }[] = [
    { icon: FolderOpen, label: k.total, value: String(all.length), href: "/expedientes?vista=todos" },
    { icon: Send, label: k.toReview, value: String(all.filter((x) => x.exp.status === "enviado").length), href: "/expedientes?vista=todos&estado=enviado" },
    { icon: Clock, label: k.waitingClient, value: String(all.filter((x) => x.waiting === "cliente").length), href: "/expedientes?vista=cliente" },
    { icon: SearchCheck, label: k.ready, value: String(all.filter((x) => x.exp.status === "listo").length), href: "/expedientes?vista=todos&estado=listo" },
    { icon: ChartNoAxesColumn, label: k.avg, value: `${avg} %` },
    left === null
      ? { icon: CalendarClock, label: k.noDeadline, value: "—", href: FEATURES.firmSettings ? "/ajustes/campana" : undefined }
      : { icon: CalendarClock, label: k.deadline, value: left < 0 ? k.passed : k.days(left), urgent: left <= 7 },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
      {tiles.map((x) => {
        const body = (
          <>
            <IconTile icon={x.icon} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className={cx("figures text-[22px] leading-7 font-semibold", x.urgent && "text-bad")}>{x.value}</span>
              <span className="truncate text-[13px] text-muted">{x.label}</span>
            </span>
          </>
        );
        const cls = "flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sheet";
        return (
          <li key={x.label}>
            {x.href ? <Link href={x.href} className={cx(cls, "transition-colors hover:border-line-strong")}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
