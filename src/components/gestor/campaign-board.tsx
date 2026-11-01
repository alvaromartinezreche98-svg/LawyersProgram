"use client";

import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { useEffect, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { CalendarClock, ChartNoAxesColumn, CircleAlert, Clock, FolderOpen, GripVertical, MessageCircle, SearchCheck, Send, TriangleAlert, UserPlus, type LucideIcon } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import { STATUSES, awaitingApproval, type Status } from "@/lib/data/types";
import { daysUntil, needsAttention, sortCases, triage, type Triage } from "@/lib/gestor/triage";
import type { Alert } from "@/lib/questionnaire/alerts";
import { Tooltip } from "@/components/ui/tooltip";
import { IconTile } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, ProgressBar, cx } from "@/components/ui/primitives";
import { PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";
import { DeadlineBanners } from "./case-list";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/** G1 · Panel de campaña: cases in columns by status, deadlines and workload per accountant. */

/**
 * Each column's colour, after what its status means: grey draft, blue sent, amber under
 * review, green ready. The column gets a faint wash of it, the header the full colour.
 */
const COLUMN_TONE: Record<Status, { col: string; border: string; head: string; ink: string }> = {
  borrador: { col: "bg-neutral-soft/70", border: "border-line-strong/25", head: "bg-muted", ink: "text-muted" },
  enviado: { col: "bg-info-soft/70", border: "border-info/25", head: "bg-info", ink: "text-info" },
  revision: { col: "bg-warn-soft", border: "border-warn/25", head: "bg-warn", ink: "text-warn" },
  listo: { col: "bg-ok-soft/70", border: "border-ok/25", head: "bg-ok", ink: "text-ok" },
};

export function CampaignBoard() {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const [only, setOnly] = useState(false);
  const [over, setOver] = useState<Status | null>(null);
  // Drag feedback: the card in hand, the card just moved (a short glow) and what to announce.
  const [dragging, setDragging] = useState<string | null>(null);
  const [moved, setMoved] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (!moved) return;
    const id = setTimeout(() => setMoved(null), 1400);
    return () => clearTimeout(id);
  }, [moved]);
  const all = Object.values(exps).map(triage);
  const shown = sortCases(only ? all.filter(needsAttention) : all, "attention");

  const drop = (status: Status) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    setDragging(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id && exps[id] && exps[id].status !== status) {
      actions.setStatus(id, status);
      setMoved(id);
      setSaid(t.board.moved(all.find((x) => x.exp.id === id)?.name || t.common.unnamedClient, tr(STATUSES.find((s) => s.id === status)!.label)));
    }
  };
  const from = dragging ? exps[dragging]?.status : null;

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
        <DeadlineBanners />
        {/* A working header: no tutorial line (the drag hint is on each card), the page's tools on the right. */}
        <PageHead
          title={t.board.title}
          actions={
            <>
              <button
                type="button"
                aria-pressed={only}
                onClick={() => setOnly(!only)}
                className={cx(
                  "inline-flex h-(--control-h-sm) items-center gap-2 rounded-md border px-3 text-[13.5px] font-medium transition-colors",
                  only ? "border-copper bg-copper-soft text-copper-text" : "border-line-strong bg-surface text-ink hover:bg-hover",
                )}
              >
                <TriangleAlert size={14} aria-hidden="true" />
                {t.board.onlyAttention}
              </button>
              <ButtonLink href="/clientes" size="sm">
                <UserPlus size={15} aria-hidden="true" />
                {t.list.invite}
              </ButtonLink>
            </>
          }
        />
        <CampaignStats all={all} filing={firm.campaign?.filing} />

        {/* Phones: one column per swipe (snap-scroll), the next one peeking in; from md the board as it was. */}
        <div className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 max-md:[scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:snap-none">
          {/* Columns with cases get the room; empty ones stay narrow, as a drop target. */}
          <div
            className="grid w-full gap-3 max-md:w-max max-md:grid-cols-[repeat(4,min(84vw,340px))] md:grid-cols-(--cols)"
            style={{
              "--cols": STATUSES.map((s) => (shown.some((x) => x.exp.status === s.id) ? "minmax(240px, 1fr)" : "minmax(160px, 0.55fr)")).join(" "),
            } as CSSProperties}
          >
            {STATUSES.map((s) => {
              const col = shown.filter((x) => x.exp.status === s.id);
              const tone = COLUMN_TONE[s.id];
              const target = !!dragging && from !== s.id;
              return (
                <section
                  key={s.id}
                  aria-label={tr(s.label)}
                  onDragOver={(e) => {
                    if (!target) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setOver(s.id);
                  }}
                  onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOver((o) => (o === s.id ? null : o))}
                  onDrop={drop(s.id)}
                  className={cx(
                    // every column the same height (from the window); the header stays, the cards scroll inside
                    "flex h-[clamp(360px,calc(100dvh-280px),680px)] snap-start flex-col gap-2 rounded-lg border p-2 transition-[background-color,border-color,box-shadow] duration-150",
                    over === s.id ? "border-copper bg-copper-soft shadow-[inset_0_0_0_1px_var(--copper)]"
                    : target ? cx("border-dashed border-line-strong", tone.col)
                    : cx(tone.border, tone.col),
                  )}
                >
                  {/* The header filled with the status colour, white text; the count on a white pill. */}
                  <header className={cx("flex items-center gap-2 rounded-md px-3 py-2.5 text-white shadow-sm", tone.head)} title={tr(s.help)}>
                    <h2 className="flex-1 text-[13.5px] font-semibold">{tr(s.label)}</h2>
                    <span className={cx("figures grid h-5 min-w-6 place-items-center rounded-full bg-white px-1.5 text-[11.5px] font-bold", tone.ink)}>{col.length}</span>
                  </header>
                  {col.length === 0 && (
                    <p className={cx("grid flex-1 place-items-center rounded-md border border-dashed px-2 py-6 text-center text-[12.5px] transition-colors", over === s.id ? "border-copper text-copper-text" : "border-line-strong/50 text-muted")}>
                      {dragging ? t.board.dropHere : t.board.empty}
                    </p>
                  )}
                  {/* The cards scroll inside the column; its header stays put. */}
                  {col.length > 0 && (
                  <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pt-px pb-1 [scrollbar-width:thin]">
                  {col.map((x) => (
                    <Card
                      key={x.exp.id}
                      x={x}
                      member={firm.team.find((m) => m.id === x.exp.assignee)?.name}
                      dragging={dragging === x.exp.id}
                      moved={moved === x.exp.id}
                      onDrag={(on) => {
                        setDragging(on ? x.exp.id : null);
                        if (!on) setOver(null);
                      }}
                    />
                  ))}
                  </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{said}</p>

        <section className="flex flex-col gap-2">
          <h2 className="display-tight text-[15px] font-semibold">{t.board.workload}</h2>
          {/* Phones: one card per accountant (the three figures labelled under the name); from sm a table */}
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div>
            <div className="table-head hidden grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] gap-4 whitespace-nowrap sm:grid">
              <span>{t.board.cols.member}</span>
              <span className="text-right">{t.board.cols.cases}</span>
              <span className="text-right">{t.board.cols.attention}</span>
              <span className="text-right">{t.board.cols.approval}</span>
            </div>
            {load.map((m) => (
              <div key={m.id ?? "none"} className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-[14px] first:border-t-0 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] sm:gap-4 sm:py-2.5 sm:first:border-t-0">
                <span className={cx("col-span-3 truncate font-medium sm:col-span-1 sm:font-normal", m.id === null && "text-muted")}>{m.name}</span>
                <WorkFigure label={t.board.cols.cases} className="">{m.cases}</WorkFigure>
                <WorkFigure label={t.board.cols.attention} className={m.attention ? "font-semibold text-copper-text" : "text-muted"}>{m.attention}</WorkFigure>
                <WorkFigure label={t.board.cols.approval} className="text-muted">{m.approval}</WorkFigure>
              </div>
            ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Card({ x, member, dragging, moved, onDrag }: { x: Triage; member?: string; dragging: boolean; moved: boolean; onDrag: (on: boolean) => void }) {
  const { t } = useI18n();
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", x.exp.id);
        e.dataTransfer.effectAllowed = "move";
        onDrag(true);
      }}
      onDragEnd={() => onDrag(false)}
      title={t.board.dragHint}
      className={cx(
        "group relative flex shrink-0 cursor-grab flex-col gap-3 rounded-lg border bg-surface pad-tile shadow-sm transition-[opacity,border-color,box-shadow,translate,scale] duration-200 active:cursor-grabbing",
        // in hand: the original stays as a faded placeholder; just moved: a short terracotta glow where it landed
        dragging ? "motion-safe:scale-[0.98] border-dashed border-line-strong opacity-40"
        : moved ? "border-copper shadow-[0_0_0_3px_var(--copper-soft)]"
        // hover says "you can pick this up": firmer edge and shadow, a 1px lift, the grip shows
        : "border-line hover:border-line-strong hover:shadow-[0_6px_16px_-8px_var(--shadow)] motion-safe:hover:-translate-y-px",
      )}
    >
      {/* Head: the client, the accountant beside the name, and the grip that shows on hover. */}
      <span className="flex items-center gap-2">
        <Link href={`/expedientes/${x.exp.id}`} className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink after:absolute after:inset-0 hover:underline">
          {x.name || t.common.unnamedClient}
        </Link>
        {member && (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[10.5px] font-semibold text-accent" title={member}>
            {initials(member)}
          </span>
        )}
        <GripVertical size={15} className="-mr-1 shrink-0 text-line-strong opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </span>
      <span className="flex items-center gap-2">
        <ProgressBar pct={x.pct} className="flex-1" />
        <span className={cx("figures w-10 text-right text-[12px] font-semibold", x.pct === 100 ? "text-ok" : "text-ink/70")}>{x.pct} %</span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5 empty:hidden">
        {x.unread > 0 && (
          <span className={cx(CHIP, "bg-info-soft text-info ring-info/20")}>
            <MessageCircle size={12} strokeWidth={2.3} aria-hidden="true" />
            {t.list.reasons.unread}
          </span>
        )}
        {x.bad > 0 && <AlertChip level="bad" alerts={x.alerts.filter((a) => a.level === "bad")} label={t.list.missingN(x.bad)} />}
        {x.warn > 0 && <AlertChip level="warn" alerts={x.alerts.filter((a) => a.level === "warn")} label={t.list.checkN(x.warn)} />}
      </span>
    </article>
  );
}

const CHIP = "relative z-10 inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-semibold ring-1";

/** A card's alert count as a chip; hovering or focusing it lists what the alerts are, so the case need not be opened. */
function AlertChip({ level, alerts, label }: { level: "bad" | "warn"; alerts: Alert[]; label: string }) {
  const { t, tr } = useI18n();
  const Icon = level === "bad" ? CircleAlert : TriangleAlert;
  return (
    <Tooltip
      title={t.file.alertHelp[level].title}
      text={alerts.map((a) => tr(a.title)).join(" · ")}
      body={
        <ul className="flex flex-col gap-1.5">
          {alerts.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className={cx("mt-[7px] size-1.5 shrink-0 rounded-full", level === "bad" ? "bg-bad-soft" : "bg-warn-soft")} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-medium text-white">{tr(a.title)}</span>
                {a.detail && <span className="block text-[12px] leading-[17px] text-white/70">{tr(a.detail)}</span>}
              </span>
            </li>
          ))}
        </ul>
      }
      className="relative z-10 rounded-md"
    >
      <span className={cx(CHIP, level === "bad" ? "bg-bad-soft text-bad ring-bad/25" : "bg-warn-soft text-warn ring-warn/25")}>
        <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  );
}

/** One figure of the workload: a right-aligned cell in the table; on phones, a small label over it. */
function WorkFigure({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <span className="flex flex-col sm:block sm:text-right">
      <span className="text-[11.5px] text-muted sm:sr-only">{label}</span>
      <span className={cx("figures", className)}>{children}</span>
    </span>
  );
}

/** Campaign at a glance: one figure per tile, each linking to the matching case list. */
function CampaignStats({ all, filing }: { all: Triage[]; filing?: string }) {
  const { t } = useI18n();
  const k = t.extra.kpi;
  const avg = all.length ? Math.round(all.reduce((n, x) => n + x.pct, 0) / all.length) : 0;
  const left = filing ? daysUntil(filing) : null;
  const toReview = all.filter((x) => x.exp.status === "enviado").length;
  // `firm`: the figure is work waiting on the gestoría, so it takes the terracotta like every count that needs the gestoría.
  const tiles: { icon: LucideIcon; label: string; value: string; href?: string; urgent?: boolean; firm?: boolean }[] = [
    { icon: FolderOpen, label: k.total, value: String(all.length), href: "/expedientes?vista=todos" },
    { icon: Send, label: k.toReview, value: String(toReview), href: "/expedientes?vista=todos&estado=enviado", firm: toReview > 0 },
    { icon: Clock, label: k.waitingClient, value: String(all.filter((x) => x.waiting === "cliente").length), href: "/expedientes?vista=cliente" },
    { icon: SearchCheck, label: k.ready, value: String(all.filter((x) => x.exp.status === "listo").length), href: "/expedientes?vista=todos&estado=listo" },
    { icon: ChartNoAxesColumn, label: k.avg, value: `${avg} %` },
    left === null
      ? { icon: CalendarClock, label: k.noDeadline, value: "—", href: FEATURES.firmSettings ? "/ajustes/campana" : undefined }
      : { icon: CalendarClock, label: k.deadline, value: left < 0 ? k.passed : k.days(left), urgent: left <= 7 },
  ];
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 2xl:grid-cols-6">
      {tiles.map((x) => {
        const body = (
          <>
            <IconTile icon={x.icon} size="sm" tone={x.firm ? "copper" : "accent"} />
            <span className="flex min-w-0 flex-col">
              <span className={cx("figures text-[22px] leading-7 font-semibold max-sm:text-[19px] max-sm:leading-6", x.urgent && "text-bad", x.firm && "text-copper-text")}>{x.value}</span>
              <span className="truncate text-[13px] text-muted max-sm:text-[12px] max-sm:leading-4 max-sm:whitespace-normal max-sm:line-clamp-2">{x.label}</span>
            </span>
          </>
        );
        // Phones: compact, icon beside the figure, two tiles a row; the label may take two short lines.
        const cls = "flex h-full items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sheet max-sm:gap-2.5 max-sm:px-3 max-sm:py-2.5";
        return (
          <li key={x.label}>
            {x.href ? <Link href={x.href} className={cx(cls, "transition-colors hover:border-line-strong")}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
