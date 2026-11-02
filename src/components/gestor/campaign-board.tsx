"use client";

import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
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
// Each column a bento with its own clearly told-apart shell (draft slate grey, sent smoke blue,
// review the accent, ready slate green; 6–11% of the tone over white) and a matching border; its head is white with a 1px border in the same tone, the count in it.
// Draft neutral slate, sent slate-blue, under review the accent (the one place it is used as a
// faint wash, by request), ready slate-green. All washes stay under 5%: pastel, matt, formal.
const COLUMN_TONE: Record<Status, { col: string; border: string; head: string; ink: string; rule: string; badge: string; headBg: string }> = {
  borrador: { col: "bg-[color-mix(in_srgb,#8a8f98_11%,var(--surface))]", border: "border-line-strong/35", head: "", ink: "", rule: "border-line-strong/45", badge: "bg-sunk text-muted ring-line", headBg: "" },
  enviado: { col: "bg-[color-mix(in_srgb,var(--info)_12%,var(--surface))]", border: "border-info/30", head: "", ink: "", rule: "border-info/40", badge: "bg-info-soft text-info ring-info/25", headBg: "" },
  revision: { col: "bg-[color-mix(in_srgb,var(--copper)_6%,var(--surface))]", border: "border-copper/30", head: "", ink: "", rule: "border-copper/45", badge: "bg-surface text-copper ring-copper/40", headBg: "" },
  listo: { col: "bg-[color-mix(in_srgb,var(--ok)_7%,var(--surface))]", border: "border-ok/30", head: "", ink: "", rule: "border-ok/40", badge: "bg-ok-soft text-ok ring-ok/25", headBg: "" },
};

export function CampaignBoard() {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const [only, setOnly] = useState(false);
  // Phones: the board scrolls one column at a time; which one is in view, for the tabs above it.
  const board = useRef<HTMLDivElement>(null);
  const [colAt, setColAt] = useState(0);
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
      <div className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-5">
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
                aria-label={t.board.onlyAttention}
                title={t.board.onlyAttention}
                className={cx(
                  // phones: the icon alone, beside the title (pressed = copper)
                  "inline-flex h-(--control-h-sm) items-center gap-2 rounded-md border px-3 text-[13.5px] font-medium transition-colors max-sm:w-(--control-h-sm) max-sm:justify-center max-sm:px-0",
                  only ? "border-copper bg-copper-soft text-copper-text" : "border-line-strong bg-surface text-ink hover:bg-hover",
                )}
              >
                <TriangleAlert size={14} aria-hidden="true" />
                <span className="max-sm:sr-only">{t.board.onlyAttention}</span>
              </button>
              {/* phones: the icon alone, beside the title */}
              <ButtonLink href="/clientes" size="sm" aria-label={t.list.invite} className="max-sm:w-(--control-h-sm) max-sm:px-0">
                <UserPlus size={15} aria-hidden="true" />
                <span className="max-sm:hidden">{t.list.invite}</span>
              </ButtonLink>
            </>
          }
        />
        <CampaignStats all={all} filing={firm.campaign?.filing} />

        {/* Phones: one column at a time, tablets two; these tabs show which and jump to another (a swipe works too). */}
        <div role="tablist" aria-label={t.board.title} className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:hidden">
          {STATUSES.map((s, i) => {
            const n = shown.filter((x) => x.exp.status === s.id).length;
            const on = colAt === i;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => (board.current?.querySelector(`[data-col="${s.id}"]`) as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })}
                title={tr(s.label)}
                // label and count on one line, the same height whichever tab is on (the count never wraps or squeezes)
                className={cx("flex h-10 min-w-0 items-center justify-between gap-2 rounded-lg border pr-2 pl-3 text-[13px] font-semibold transition-colors", on ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:bg-sunk")}
              >
                <span className="min-w-0 truncate">{tr(s.label)}</span>
                <span className={cx("figures grid h-6 min-w-6 shrink-0 place-items-center rounded-md px-1.5 text-[12px] font-bold", on ? "bg-white text-accent" : COLUMN_TONE[s.id].badge)}>{n}</span>
              </button>
            );
          })}
        </div>
        <div
          ref={board}
          onScroll={(e) => {
            const el = e.currentTarget;
            const cols = el.querySelectorAll<HTMLElement>("[data-col]");
            if (cols.length < 2) return;
            const step = cols[1].offsetLeft - cols[0].offsetLeft;
            const i = Math.min(cols.length - 1, Math.round(el.scrollLeft / step));
            if (i !== colAt) setColAt(i);
          }}
          className="-mx-4 [container-type:inline-size] snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 max-lg:[scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:snap-none"
        >
          {/* Columns with cases get the room; empty ones stay narrow, as a drop target. */}
          <div
            className="grid w-full gap-3 max-sm:gap-4 sm:max-lg:gap-6 max-lg:w-max max-md:grid-cols-[repeat(4,100cqw)] md:max-lg:grid-cols-[repeat(4,calc((100cqw-1.5rem)/2))] lg:grid-cols-(--cols)"
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
                  data-col={s.id}
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
                    "flex h-[clamp(360px,calc(100dvh-280px),680px)] snap-start flex-col gap-2 rounded-xl border p-2 transition-[background-color,border-color,box-shadow] duration-150",
                    over === s.id ? "border-copper bg-copper-soft shadow-[inset_0_0_0_1px_var(--copper)]"
                    : target ? cx("border-dashed border-line-strong", tone.col)
                    : cx(tone.border, tone.col),
                  )}
                >
                  {/* The header filled with the status colour, white text; the count on a white pill. */}
                  <header className={cx("flex items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] max-lg:hidden", tone.rule)} title={tr(s.help)}>
                    <h2 className="flex-1 text-[13px] font-semibold tracking-[0.01em] text-ink">{tr(s.label)}</h2>
                    <span className={cx("figures grid h-5 min-w-6 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold ring-1", tone.badge)}>{col.length}</span>
                  </header>
                  {col.length === 0 && (
                    <p className={cx("grid flex-1 place-items-center rounded-md border border-dashed px-2 py-6 text-center text-[12.5px] transition-colors", over === s.id ? "border-copper text-copper-text" : "border-line-strong/50 text-muted")}>
                      {dragging ? t.board.dropHere : t.board.empty}
                    </p>
                  )}
                  {/* The cards scroll inside the column; its header stays put. */}
                  {col.length > 0 && (
                  <div className="board-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pt-px pb-1">
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
          <p className="-mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted sm:hidden" aria-hidden="true">
            <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-line-strong" />{t.board.cols.cases}</span>
            <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-bad" />{t.board.cols.attention}</span>
            <span className="inline-flex items-center gap-1"><i className="size-2 rounded-full bg-info" />{t.board.cols.approval}</span>
          </p>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div>
            <div className="table-head hidden grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] items-end gap-4 sm:grid">
              <span>{t.board.cols.member}</span>
              <span className="text-right">{t.board.cols.cases}</span>
              <span className="text-right">{t.board.cols.attention}</span>
              <span className="text-right">{t.board.cols.approval}</span>
            </div>
            {load.map((m) => (
              <div key={m.id ?? "none"} className="flex items-center gap-2 border-t border-line px-3 py-2 text-[14px] first:border-t-0 sm:grid sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] sm:gap-4 sm:px-4 sm:py-2.5">
                <span className={cx("min-w-0 flex-1 truncate font-medium sm:font-normal", m.id === null && "text-muted")}>{m.name}</span>
                {/* phones: three small figures in fixed columns, explained once in the legend above */}
                <span className="flex shrink-0 gap-1 sm:hidden">
                  <WorkBadge label={t.board.cols.cases} n={m.cases} tone="neutral" />
                  <WorkBadge label={t.board.cols.attention} n={m.attention} tone="bad" />
                  <WorkBadge label={t.board.cols.approval} n={m.approval} tone="info" />
                </span>
                <span className="figures hidden text-right sm:block">{m.cases}</span>
                <span className={cx("figures hidden text-right sm:block", m.attention ? "font-semibold text-copper-text" : "text-muted")}>{m.attention}</span>
                <span className="figures hidden text-right text-muted sm:block">{m.approval}</span>
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
        "group relative flex shrink-0 cursor-grab flex-col gap-2 rounded-lg border bg-surface px-3 py-2.5 shadow-sm transition-[opacity,border-color,box-shadow,translate,scale] duration-200 active:cursor-grabbing",
        // in hand: the original stays as a faded placeholder; just moved: a short terracotta glow where it landed
        dragging ? "motion-safe:scale-[0.98] border-dashed border-line-strong opacity-40"
        : moved ? "border-copper shadow-[0_0_0_3px_var(--copper-soft)]"
        // hover says "you can pick this up": firmer edge and shadow, a 1px lift, the grip shows
        : "border-line hover:border-line-strong hover:shadow-[0_6px_16px_-8px_var(--shadow)] motion-safe:hover:-translate-y-px",
      )}
    >
      {/* Head: the client, the accountant beside the name, and the grip that shows on hover. */}
      <span className="flex items-center gap-2">
        <Link href={`/expedientes/${x.exp.id}`} className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink after:absolute after:inset-0 hover:underline">
          {x.name || t.common.unnamedClient}
        </Link>
        {member && (
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[9.5px] font-semibold text-accent" title={member}>
            {initials(member)}
          </span>
        )}
        <GripVertical size={15} className="-mr-1 shrink-0 text-line-strong opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </span>
      <span className="flex items-center gap-2">
        <ProgressBar pct={x.pct} className="h-1! flex-1 rounded-full" />
        <span className={cx("figures w-9 text-right text-[11.5px] font-semibold", x.pct === 100 ? "text-ok" : "text-ink/70")}>{x.pct} %</span>
      </span>
      <span className="flex flex-wrap items-center gap-1 empty:hidden">
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

const CHIP = "relative z-10 inline-flex h-5 items-center gap-1 rounded px-1.5 text-[11px] font-semibold ring-1";

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
      <span className={cx(CHIP, level === "bad" ? "bg-bad-soft text-bad ring-bad/25" : "bg-warn-soft text-warn ring-copper")}>
        <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  );
}

/** Phones: one figure of the workload as a small badge (its meaning is in the legend and the label). */
function WorkBadge({ label, n, tone }: { label: string; n: number; tone: "neutral" | "bad" | "info" }) {
  const on = n > 0;
  const cls = !on ? "bg-sunk text-disabled" : tone === "bad" ? "bg-bad-soft text-bad" : tone === "info" ? "bg-info-soft text-info" : "bg-sunk text-ink";
  return (
    <span title={label} className={cx("figures grid h-6 min-w-8 place-items-center rounded-md px-1.5 text-[12.5px] font-semibold", cls)}>
      {n}
      <span className="sr-only"> {label}</span>
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
            <IconTile icon={x.icon} size="sm" tone={x.firm ? "copper" : "accent"} className="max-sm:size-8 max-sm:shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span className={cx("figures text-[22px] leading-7 font-semibold max-sm:text-[17px] max-sm:leading-6", x.urgent && "text-bad", x.firm && "text-copper-text")}>{x.value}</span>
              <span className="truncate text-[13px] text-muted max-sm:line-clamp-2 max-sm:text-[12px] max-sm:leading-4 max-sm:whitespace-normal">{x.label}</span>
            </span>
          </>
        );
        // Phones: two tiles a row (figure over label), so nothing runs off the screen edge.
        const cls = "flex h-full min-w-0 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sheet max-sm:gap-2.5 max-sm:px-3 max-sm:py-2.5";
        return (
          <li key={x.label} className="min-w-0">
            {x.href ? <Link href={x.href} className={cx(cls, "transition-colors hover:border-line-strong")}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}
