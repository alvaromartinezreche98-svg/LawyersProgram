"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarClock, Download, UserPlus, CircleAlert, Clock, ClipboardCheck, Inbox, Info, type LucideIcon, MessageCircle, Search, TriangleAlert } from "lucide-react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import type { Alert, AlertLevel } from "@/lib/questionnaire/alerts";
import { useAppState } from "@/lib/data/store";
import { STATUSES, type Status } from "@/lib/data/types";
import { SORT_KEYS, daysUntil, needsAttention, sortCases, triage, type SortKey, type Triage } from "@/lib/gestor/triage";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, ButtonLink, EmptyState, StatusPill, cx } from "@/components/ui/primitives";
import { Chip, Chips, PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Downloads rows as CSV (semicolon-separated with a BOM, as Spanish Excel expects). */
function exportCsv<T>(rows: T[], cells: (x: T) => string[], head: readonly string[], name: string) {
  const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const text = [head, ...rows.map(cells)].map((r) => r.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${name}.csv` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const isStatus = (v: string | null): v is Status => STATUSES.some((s) => s.id === v);
/** "gestoria" / "cliente": who the case is waiting on (the main views). "atencion" and "mensajes" stay valid for old links. */
type View = "all" | "gestoria" | "cliente" | "atencion" | "mensajes";
const isView = (v: string | null): v is View => v === "gestoria" || v === "cliente" || v === "atencion" || v === "mensajes";
const isSort = (v: string | null): v is SortKey => SORT_KEYS.includes(v as SortKey);

const LEVEL: Record<AlertLevel, { icon: LucideIcon; cls: string }> = {
  bad: { icon: CircleAlert, cls: "text-bad" },
  warn: { icon: TriangleAlert, cls: "text-warn" },
  info: { icon: Info, cls: "text-info" },
};

/** Link to the place in the case file where an alert is resolved. */
export const alertHref = (id: string, a: Alert) => `/expedientes/${id}#${a.target.kind === "docs" ? "documentos" : `sec-${a.target.section}`}`;

/** G2 · Expedientes. Filters live in the URL (?estado=, ?vista=, ?orden=) so views can be bookmarked and shared. */
export function CaseList() {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const status: Status | "all" = isStatus(params.get("estado")) ? (params.get("estado") as Status) : "all";
  const rawView = params.get("vista");
  const view: View = rawView === "todos" ? "all" : isView(rawView) ? rawView : "gestoria";
  const sort: SortKey = isSort(params.get("orden")) ? (params.get("orden") as SortKey) : "attention";
  const [q, setQ] = useState("");
  // ?gestor=<member id>, or "ninguno" for unassigned cases.
  const who = params.get("gestor");

  const all = Object.values(exps).map(triage);
  const waitN = (w: "gestoria" | "cliente") => all.filter((x) => x.waiting === w).length;
  const count = (s: Status) => all.filter((x) => x.exp.status === s).length;
  const showAssignee = all.some((x) => x.exp.assignee);
  const teamName = (id?: string | null) => firm.team.find((m) => m.id === id)?.name;

  const query = norm(q.trim());
  const shown = sortCases(
    all.filter((x) => {
      if (status !== "all" && x.exp.status !== status) return false;
      if (view === "atencion" && !needsAttention(x)) return false;
      if (view === "mensajes" && !x.unread) return false;
      if ((view === "gestoria" || view === "cliente") && x.waiting !== view) return false;
      if (who && (x.exp.assignee ?? "ninguno") !== who) return false;
      if (!query) return true;
      return norm([x.name, x.exp.answers.email, x.exp.answers.telefono].filter((v) => typeof v === "string").join(" ")).includes(query);
    }),
    sort,
  );
  const filtered = status !== "all" || view !== "gestoria" || !!query || !!who;

  const go = (patch: { estado?: Status | "all"; vista?: View; orden?: SortKey; gestor?: string }) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (k === "vista") {
        if (v === "gestoria") next.delete(k);
        else next.set(k, v === "all" ? "todos" : v);
      } else if (!v || v === "all" || (k === "orden" && v === "attention")) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `/expedientes?${qs}` : "/expedientes", { scroll: false });
  };
  const clear = () => {
    setQ("");
    router.replace(sort === "attention" ? "/expedientes" : `/expedientes?orden=${sort}`, { scroll: false });
  };

  const crumb =
    view === "gestoria" ? null
    : view === "cliente" ? t.list.wait.views[view]
    : view !== "all" ? (view === "atencion" ? t.list.attentionView : t.list.summary.unread)
    : status !== "all" ? tr(STATUSES.find((s) => s.id === status)!.label)
    : null;
  // Cliente | Estado | Espera a | Motivo | Cuestionario | (Gestor) | Actualizado
  const cols = showAssignee
    ? "@4xl:grid-cols-[minmax(0,1.2fr)_150px_110px_minmax(0,1.7fr)_120px_120px_96px]"
    : "@4xl:grid-cols-[minmax(0,1.2fr)_150px_110px_minmax(0,1.9fr)_120px_96px]";

  return (
    <>
      <PageTitle>{t.titles.cases}</PageTitle>
      <TopBar crumbs={crumb ? [{ label: t.list.title, href: "/expedientes" }, { label: crumb }] : [{ label: t.list.title }]} />

      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <PageHead
          eyebrow={t.list.eyebrow(EJERCICIO)}
          title={t.list.title}
          actions={
            <ButtonLink href="/clientes" size="sm">
              <UserPlus size={15} aria-hidden="true" />
              {t.list.invite}
            </ButtonLink>
          }
        />

        {FEATURES.campaignBoard && <DeadlineChips />}

        {/* Toolbar: who we are waiting on first, then search, status and order; it wraps on narrow screens. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Chips label={t.list.wait.label}>
            {([
              ["gestoria", t.list.wait.views.gestoria, waitN("gestoria")],
              ["cliente", t.list.wait.views.cliente, waitN("cliente")],
              ["all", t.list.all, all.length],
            ] as const).map(([id, label, n]) => (
              <Chip key={id} on={view === id} count={n} alert={id === "gestoria"} onClick={() => go({ vista: id })}>
                {label}
              </Chip>
            ))}
          </Chips>
          <label className="relative min-w-[min(100%,16rem)] grow-[999] basis-0">
            <span className="sr-only">{t.list.searchLabel}</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQ("")} placeholder={t.list.search} className="field h-(--control-h) pr-3 pl-9" />
          </label>
          <div className="flex max-w-full grow flex-wrap items-center gap-2">
            {firm.team.length > 0 && (
              <label className="flex items-center gap-2 text-[13px] text-muted">
                <span className="sr-only">{t.extra.assignee.label}</span>
                <select value={who ?? "all"} onChange={(e) => go({ gestor: e.target.value })} className="field h-(--control-h) w-auto max-w-[220px] text-[14px]">
                  <option value="all">{t.extra.assignee.all}</option>
                  {firm.team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  <option value="ninguno">{t.list.unassigned}</option>
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <span className="sr-only">{t.list.filterLabel}</span>
              <select value={status} onChange={(e) => go({ estado: e.target.value as Status | "all" })} className="field h-(--control-h) w-auto text-[14px]">
                <option value="all">{t.list.allStatuses} ({all.length})</option>
                {STATUSES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {tr(x.label)} ({count(x.id)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <span className="whitespace-nowrap">{t.list.sort.label}</span>
              <select value={sort} onChange={(e) => go({ orden: e.target.value as SortKey })} className="field h-(--control-h) w-auto text-[14px]">
                {SORT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t.list.sort[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
          <span className="figures" aria-live="polite">
            {t.list.results(shown.length, all.length)}
          </span>
          <span className="flex items-center gap-4">
            {filtered && (
              <button type="button" onClick={clear} className="font-medium text-accent hover:underline">
                {t.list.clear}
              </button>
            )}
            {shown.length > 0 && (
              <button type="button" onClick={() => exportCsv(shown, (x) => [x.name, str(x.exp.answers.email), str(x.exp.answers.telefono), tr(STATUSES.find((s) => s.id === x.exp.status)!.label), x.waiting ? t.list.wait.row[x.waiting] : "", `${x.pct}`, `${x.pending}`, `${x.bad + x.warn}`, teamName(x.exp.assignee) ?? "", x.exp.updatedAt.slice(0, 16).replace("T", " ")], t.extra.csv.cols, `expedientes-${EJERCICIO}`)} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                <Download size={14} aria-hidden="true" />
                {t.extra.csv.export}
              </button>
            )}
          </span>
        </div>

        {/* Table */}
        {/* The table answers to its own width (container query), not the viewport: the sidebar takes space too. */}
        <div className="@container overflow-clip rounded-lg border border-line bg-surface">
          <div className={cx("hidden gap-4 border-b border-line bg-sunk px-4 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase @4xl:grid", cols)}>
            <span>{t.list.cols.client}</span>
            <span>{t.list.cols.status}</span>
            <span>{t.list.cols.waiting}</span>
            <span>{t.list.cols.reason}</span>
            <span>{t.list.cols.questionnaire}</span>
            {showAssignee && <span>{t.list.assignee}</span>}
            <span className="text-right">{t.list.cols.updated}</span>
          </div>
          {shown.length === 0 ? (
            <EmptyState inset icon={Inbox} title={t.list.none}>
              {filtered && (
                <Button size="sm" onClick={clear} className="mt-2">
                  {t.list.clear}
                </Button>
              )}
            </EmptyState>
          ) : (
            <ul>
              {shown.map((x) => (
                <CaseRow key={x.exp.id} x={x} cols={cols} assignee={showAssignee ? (teamName(x.exp.assignee) ?? null) : undefined} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function CaseRow({ x, cols, assignee }: { x: Triage; cols: string; assignee?: string | null }) {
  const { t, tr, locale } = useI18n();
  const e = x.exp;
  const href = `/expedientes/${e.id}`;
  const top = x.alerts.filter((a) => a.level !== "info").slice(0, 2);
  const shownTop = top.length ? top : x.alerts.slice(0, 1);
  const rest = x.alerts.length - shownTop.length;
  const contact = [e.answers.email, e.answers.telefono].filter((v): v is string => typeof v === "string" && !!v).join(" · ");

  return (
    <li className={cx("relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2.5 border-t border-line px-4 py-3 transition-colors first:border-t-0 hover:bg-sunk has-[a.row-link:focus-visible]:bg-sunk has-[a.row-link:focus-visible]:outline-2 has-[a.row-link:focus-visible]:-outline-offset-2 has-[a.row-link:focus-visible]:outline-accent @4xl:items-center", cols)}>
      {/* Client: the name link covers the whole row; the alert links sit above it. */}
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2">
          {x.unread > 0 && <span className="size-2 shrink-0 rounded-full bg-info" title={t.list.reasons.unread} aria-hidden="true" />}
          <Link href={href} className="row-link truncate font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-transparent">
            {x.name || t.common.unnamedClient}
          </Link>
          {e.example && <span className="shrink-0 rounded-sm border border-line px-1 text-[11px] text-muted">{t.common.example}</span>}
          {e.ejercicio !== EJERCICIO && <span className="figures shrink-0 rounded-sm border border-accent/25 bg-accent-soft px-1 text-[11px] text-accent">{e.ejercicio}</span>}
        </span>
        <span className="truncate text-[12.5px] text-muted">{contact || t.list.noEmail}</span>
      </div>

      <span className="justify-self-end @4xl:justify-self-start" title={tr(STATUSES.find((s) => s.id === e.status)!.help)}>
        <StatusPill status={e.status} />
      </span>

      <span className="col-span-2 @4xl:col-span-1">{x.waiting ? <WaitingLabel who={x.waiting} short /> : <span className="text-[12.5px] text-muted">—</span>}</span>

      <div className="col-span-2 flex min-w-0 flex-col gap-1 @4xl:col-span-1">
        {x.unread > 0 && (
          <Link href={`${href}#chat`} className="relative z-10 flex min-w-0 items-center gap-1.5 self-start text-[13px] text-info hover:underline">
            <MessageCircle size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t.list.reasons.unread}</span>
          </Link>
        )}
        {x.reasons.includes("taskDone") && (
          <Link href={`${href}#peticiones`} className="relative z-10 flex min-w-0 items-center gap-1.5 self-start text-[13px] text-info hover:underline">
            <ClipboardCheck size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{t.list.reasons.taskDone}</span>
          </Link>
        )}
        {shownTop.map((a, i) => {
          const lv = LEVEL[a.level];
          return (
            <Link key={i} href={alertHref(e.id, a)} title={tr(a.text)} className="relative z-10 flex min-w-0 items-start gap-1.5 text-[13px] text-ink hover:underline">
              <lv.icon size={14} className={cx("mt-[3px] shrink-0", lv.cls)} aria-hidden="true" />
              <span className="line-clamp-1">{tr(a.text)}</span>
            </Link>
          );
        })}
        {rest > 0 && (
          <Link href={`${href}#avisos`} className="relative z-10 self-start text-[12.5px] font-medium text-accent hover:underline">
            {t.list.moreAlerts(rest)}
          </Link>
        )}
        {!x.alerts.length && !x.unread && <span className="text-[12.5px] text-muted">{t.list.noAlerts}</span>}
      </div>

      <span className={cx("col-span-2 text-[13px] @4xl:col-span-1", x.pct === 100 ? "text-ok" : "text-muted")}>
        {x.pct === 100 ? t.sectionState.done : x.pct === 0 ? t.sectionState.empty : t.q.leftN(x.pending)}
      </span>

      {assignee !== undefined && <span className="hidden truncate text-[13px] @4xl:block">{assignee ?? <span className="text-muted">{t.list.unassigned}</span>}</span>}

      {/* Hidden on phones, as in the reference: the row stays short. */}
      <span className="figures hidden text-[12.5px] text-muted @4xl:block @4xl:text-right">{fmtTime(e.updatedAt, locale)}</span>
    </li>
  );
}

/** Campaign deadlines with a countdown; renders nothing until the gestoría sets them in Ajustes › Campaña. */
export function DeadlineChips() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const keys = (["filing", "directDebit"] as const).filter((k) => firm.campaign?.[k]);
  if (!keys.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => {
        const iso = firm.campaign![k]!;
        const d = daysUntil(iso);
        const urgent = d <= 7;
        return (
          <span key={k} className={cx("inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px]", urgent ? "border-bad/25 bg-bad-soft" : "border-line bg-surface")}>
            <CalendarClock size={15} className={urgent ? "text-bad" : "text-muted"} aria-hidden="true" />
            <b className="font-medium">{t.list.deadline[k]}</b>
            <span className="figures text-muted">{fmtDate(iso)}</span>
            <span className={cx("figures font-medium", urgent ? "text-bad" : "text-ink")}>{t.list.deadline.days(d)}</span>
          </span>
        );
      })}
    </div>
  );
}

/** "Espera a la gestoría" (navy, arrow) or "Espera al cliente" (muted, clock): who acts next. */
export function WaitingLabel({ who, short }: { who: "gestoria" | "cliente"; short?: boolean }) {
  const { t } = useI18n();
  const Icon = who === "gestoria" ? ArrowRight : Clock;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[12.5px] font-medium whitespace-nowrap", who === "gestoria" ? "text-accent" : "text-muted")}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {short ? t.list.waitShort[who] : t.list.wait.row[who]}
    </span>
  );
}
