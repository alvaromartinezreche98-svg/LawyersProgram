"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ListFilter, ArrowDownAZ, ArrowRight, ArrowUpNarrowWide, CalendarClock, ChevronDown, Flame, History, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock, Download, Eye, FileWarning, Inbox, Info, MessageCircle, MessageSquareReply, PencilLine, Search, Send, SlidersHorizontal, TriangleAlert, UserPlus, X, type LucideIcon } from "lucide-react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import type { Alert, AlertLevel } from "@/lib/questionnaire/alerts";
import { openTasks, useAppState } from "@/lib/data/store";
import { STATUSES, awaitingApproval, type Status } from "@/lib/data/types";
import { SORT_KEYS, daysUntil, needsAttention, sortCases, triage, type SortKey, type Triage } from "@/lib/gestor/triage";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, ButtonLink, EmptyState, StatusPill, cx } from "@/components/ui/primitives";
import { Chip, Chips, PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";
import css from "./case-list.module.scss";
import { SELECT_PANEL_ATTR, Select } from "@/components/ui/select";

const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Downloads rows as CSV (semicolon-separated with a BOM, as Spanish Excel expects).
 * Text a client typed is never read as a formula: a cell starting with = @ + or -
 * (other than a number or phone like "+34 600…") gets a leading apostrophe.
 */
export function toCsv(rows: readonly (readonly string[])[]) {
  const esc = (raw: string) => {
    const v = /^[=@\t\r]|^[+-](?![\d\s(])/.test(raw) ? `'${raw}` : raw;
    return /[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n") + "\r\n";
}

function exportCsv<T>(rows: T[], cells: (x: T) => string[], head: readonly string[], name: string) {
  const url = URL.createObjectURL(new Blob([toCsv([head, ...rows.map(cells)])], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${name}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-10-29 17:20" in the browser's own time zone, as the list shows it (not UTC). */
const csvTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

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

/** Alert dimension of the list (?aviso=): only what the case data really supports. */
type Issue = "missing" | "check" | "unread" | "answered";
const ISSUES: Issue[] = ["missing", "check", "unread", "answered"];
const isIssue = (v: string | null): v is Issue => ISSUES.includes(v as Issue);

// Overview cards: one icon and colour per metric (status icons as in StatusPill).
type Tone = "neutral" | "info" | "accent" | "ok" | "bad" | "warn" | "copper";
const STATUS_CARD: Record<Status, { icon: LucideIcon; tone: Tone }> = {
  borrador: { icon: PencilLine, tone: "neutral" },
  enviado: { icon: Send, tone: "info" },
  revision: { icon: Eye, tone: "accent" },
  listo: { icon: CircleCheck, tone: "ok" },
};
const ISSUE_CARD: Record<Issue, { icon: LucideIcon; tone: Tone }> = {
  missing: { icon: FileWarning, tone: "bad" },
  check: { icon: TriangleAlert, tone: "warn" },
  unread: { icon: MessageCircle, tone: "copper" },
  answered: { icon: MessageSquareReply, tone: "info" },
};
const hasIssue = (x: Triage, i: Issue) => (i === "missing" ? x.bad > 0 : i === "check" ? x.warn > 0 : i === "unread" ? x.unread > 0 : x.reasons.includes("taskDone"));

type Step = { text: string; href: string; tone: "act" | "wait" | "done" };

/**
 * The one thing to do next on a case, most urgent first, and where to do it.
 * Derived only from the case's own data (reasons, alerts, status, requests).
 */
function nextStep(x: Triage, t: ReturnType<typeof useI18n>["t"]): Step {
  const e = x.exp;
  const base = `/expedientes/${e.id}`;
  const n = t.list.next;
  if (x.unread) return { text: n.unread, href: `${base}#chat`, tone: "act" };
  if (x.reasons.includes("taskDone")) return { text: n.taskDone, href: `${base}#peticiones`, tone: "act" };
  if (x.reasons.includes("toFile")) return { text: n.toFile, href: `${base}#resultado`, tone: "act" };
  if (e.status === "enviado") return { text: n.toReview, href: `${base}#respuestas`, tone: "act" };
  if (x.reasons.includes("appointment")) return { text: n.appointment, href: "/citas", tone: "act" };
  const firstBad = x.alerts.find((a) => a.level === "bad");
  if (firstBad && x.waiting !== "cliente") return { text: n.missing(x.bad), href: alertHref(e.id, firstBad), tone: "act" };
  if (e.status === "revision") return x.warn ? { text: n.check(x.warn), href: `${base}#avisos`, tone: "act" } : { text: n.review, href: `${base}#respuestas`, tone: "act" };
  if (e.status === "listo") return { text: n.ready, href: base, tone: "done" };
  const open = openTasks(e).length;
  if (open) return { text: n.tasks(open), href: `${base}#peticiones`, tone: "wait" };
  if (FEATURES.resultApproval && awaitingApproval(e)) return { text: n.approval, href: `${base}#resultado`, tone: "wait" };
  return { text: n.draft(x.pct), href: base, tone: "wait" };
}

/** G2 · Expedientes. Filters live in the URL (?estado=, ?vista=, ?aviso=, ?orden=, ?gestor=) so views can be bookmarked and shared. */
export function CaseList() {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const status: Status | "all" = isStatus(params.get("estado")) ? (params.get("estado") as Status) : "all";
  const rawView = params.get("vista");
  const view: View = rawView === "todos" ? "all" : isView(rawView) ? rawView : "gestoria";
  const issue: Issue | null = isIssue(params.get("aviso")) ? (params.get("aviso") as Issue) : null;
  const sort: SortKey = isSort(params.get("orden")) ? (params.get("orden") as SortKey) : "attention";
  const [q, setQ] = useState("");
  const [overviewOpen, setOverviewOpen] = useOverviewPref();
  // Overview tab: the status one when a status filter is on, else the gestoría's pending work.
  const [group, setGroup] = useState<"pending" | "status">(() => (isStatus(params.get("estado")) ? "status" : "pending"));
  const [perPage, setPerPage] = usePageSize();
  const [page, setPage] = useState(1);
  // ?gestor=<member id>, or "ninguno" for unassigned cases.
  const who = params.get("gestor");

  const all = Object.values(exps).map(triage);
  const waitN = (w: "gestoria" | "cliente") => all.filter((x) => x.waiting === w).length;
  const count = (st: Status) => all.filter((x) => x.exp.status === st).length;
  const issueN = (i: Issue) => all.filter((x) => hasIssue(x, i)).length;
  // cases with something urgent for the gestoría (missing, to check or unread): the pending tab's badge
  const hotN = all.filter((x) => hasIssue(x, "missing") || hasIssue(x, "check") || hasIssue(x, "unread")).length;
  const showAssignee = all.some((x) => x.exp.assignee);
  const teamName = (id?: string | null) => firm.team.find((m) => m.id === id)?.name;

  const query = norm(q.trim());
  const shown = sortCases(
    all.filter((x) => {
      if (status !== "all" && x.exp.status !== status) return false;
      if (issue && !hasIssue(x, issue)) return false;
      if (view === "atencion" && !needsAttention(x)) return false;
      if (view === "mensajes" && !x.unread) return false;
      if ((view === "gestoria" || view === "cliente") && x.waiting !== view) return false;
      if (who && (x.exp.assignee ?? "ninguno") !== who) return false;
      if (!query) return true;
      return norm([x.name, x.exp.answers.email, x.exp.answers.telefono].filter((v) => typeof v === "string").join(" ")).includes(query);
    }),
    sort,
  );

  // Pages: any change of filter, search or order starts again at page 1 (the page is clamped below).
  const pages = Math.max(1, Math.ceil(shown.length / perPage));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * perPage, current * perPage);
  const filterKey = `${params.toString()}|${query}`;
  const [lastKey, setLastKey] = useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    setPage(1);
  }

  const go = (patch: { estado?: Status | "all"; vista?: View; orden?: SortKey; gestor?: string; aviso?: Issue | "all" }) => {
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
  // The overview filters by status or alert across every case, whoever it waits on.
  const pick = (patch: { estado?: Status | "all"; aviso?: Issue | "all" }) => go({ vista: "all", ...patch });

  const statusLabel = (st: Status) => tr(STATUSES.find((x) => x.id === st)!.label);
  // Every filter that narrows the list, each removable on its own.
  const active: { key: string; label: string; remove: () => void }[] = [
    ...(view !== "gestoria" && view !== "all" ? [{ key: "vista", label: view === "cliente" ? t.list.wait.views.cliente : view === "atencion" ? t.list.attentionView : t.list.summary.unread, remove: () => go({ vista: "gestoria" }) }] : []),
    ...(status !== "all" ? [{ key: "estado", label: statusLabel(status), remove: () => go({ estado: "all" }) }] : []),
    ...(issue ? [{ key: "aviso", label: t.list.issue[issue], remove: () => go({ aviso: "all" }) }] : []),
    ...(who ? [{ key: "gestor", label: who === "ninguno" ? t.list.unassigned : (teamName(who) ?? who), remove: () => go({ gestor: "all" }) }] : []),
    ...(query ? [{ key: "q", label: t.list.searchChip(q.trim()), remove: () => setQ("") }] : []),
  ];
  // "Clear filters" only when something narrows the list; switching to "All" is a view, not a filter.
  const filtered = active.length > 0;

  const crumb =
    view === "gestoria" ? null
    : view === "cliente" ? t.list.wait.views[view]
    : view !== "all" ? (view === "atencion" ? t.list.attentionView : t.list.summary.unread)
    : status !== "all" ? statusLabel(status)
    : null;

  return (
    <>
      <PageTitle>{t.titles.cases}</PageTitle>
      <TopBar crumbs={crumb ? [{ label: t.list.title, href: "/expedientes" }, { label: crumb }] : [{ label: t.list.title }]} />

      <div className={css.page}>
        {FEATURES.campaignBoard && <DeadlineBanners />}

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

        {/* Overview: real counts only, each one a filter. Folds to one line (remembered per browser). */}
        {!overviewOpen ? (
          <div className={css.overviewFolded}>
            <span>{t.list.overviewLine(all.length, waitN("gestoria"))}</span>
            <button type="button" aria-expanded={false} onClick={() => setOverviewOpen(true)} className={css.textAction}>
              {t.list.overviewShow}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
        <section className={css.overview} aria-label={t.list.overview.label}>
          {/* One row of cards at a time, under two tabs; the gestoría's pending work first, as it is the urgent one. */}
          <div className={css.groupHead}>
            <div role="tablist" aria-label={t.list.overview.label} className={css.tabs}>
              {(["pending", "status"] as const).map((g) => (
                <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)} className={css.tab}>
                  {g === "pending" ? t.list.overview.pending : t.list.overview.byStatus}
                  {/* a terracotta dot: something urgent waits behind this tab */}
                  {g === "pending" && hotN > 0 && <i className={css.tabDot} aria-hidden="true" />}
                </button>
              ))}
            </div>
            <button type="button" aria-expanded onClick={() => setOverviewOpen(false)} className={css.overviewToggle}>
              {t.list.overviewHide}
              <ChevronDown size={13} className="rotate-180" aria-hidden="true" />
            </button>
          </div>
          <ul className={css.cards} role="tabpanel">
            {group === "status"
              ? STATUSES.map((x) => (
                  <li key={x.id}>
                    <MetricCard n={count(x.id)} label={tr(x.label)} title={tr(x.help)} filterLabel={t.list.overview.filterBy(tr(x.label))} {...STATUS_CARD[x.id]} on={status === x.id} onClick={() => pick({ estado: status === x.id ? "all" : x.id })} />
                  </li>
                ))
              : ISSUES.map((i) => {
                  const n = issueN(i);
                  return (
                    <li key={i}>
                      <MetricCard n={n} label={t.list.issue[i]} filterLabel={t.list.overview.filterBy(t.list.issue[i])} {...ISSUE_CARD[i]} hot={n > 0 && i !== "answered"} on={issue === i} onClick={() => pick({ aviso: issue === i ? "all" : i })} />
                    </li>
                  );
                })}
          </ul>
        </section>
        )}

        {/*
          Toolbar, one row with one gap: who acts next, search, filters and order. Status and alerts are
          filtered from the overview above (one place per filter); active ones show as chips below.
        */}
        <div className={css.toolbar}>
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
          <label className={css.search}>
            <span className="sr-only">{t.list.searchLabel}</span>
            <Search size={16} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQ("")} placeholder={t.list.search} className="field" />
          </label>
          {firm.team.length > 0 && (
            <FilterMenu label={t.list.filters} active={who ? 1 : 0}>
              <label className={css.menuField}>
                <span>{t.extra.assignee.label}</span>
                <Select aria-label={t.extra.assignee.label} value={who ?? "all"} onChange={(v) => go({ gestor: v })} buttonClassName="font-normal" options={[{ value: "all", label: t.extra.assignee.all }, ...firm.team.map((m) => ({ value: m.id, label: m.name })), { value: "ninguno", label: t.list.unassigned }]} />
              </label>
            </FilterMenu>
          )}
          <Select aria-label={t.list.sort.label} value={sort} onChange={(k) => go({ orden: k as SortKey })} className={css.sortMenu} options={SORT_KEYS.map((k) => ({ value: k, label: t.list.sort[k], icon: SORT_ICON[k] }))} />
        </div>

        {/* Result line: active filters (each removable), count and export. */}
        <div className={css.resultBar}>
          {active.length > 0 && (
            <ul className={css.activeList} aria-label={t.list.active}>
              {active.map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={a.remove} aria-label={t.list.remove(a.label)} className={css.activeChip}>
                    {a.label}
                    <X size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <span className={css.resultCount} aria-live="polite">{t.list.results(shown.length, all.length)}</span>
          {filtered && (
            <button type="button" onClick={clear} className={css.textAction}>
              {t.list.clear}
            </button>
          )}
          {shown.length > 0 && (
            <button type="button" onClick={() => exportCsv(shown, (x) => [x.name, str(x.exp.answers.email), str(x.exp.answers.telefono), tr(STATUSES.find((st) => st.id === x.exp.status)!.label), x.waiting ? t.list.wait.row[x.waiting] : "", `${x.pct}`, `${x.pending}`, `${x.bad + x.warn}`, teamName(x.exp.assignee) ?? "", csvTime(x.exp.updatedAt)], t.extra.csv.cols, `expedientes-${EJERCICIO}`)} className={cx("group", css.exportBtn)}>
              <Download size={15} className="text-accent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-y-0.5" aria-hidden="true" />
              {t.extra.csv.export}
            </button>
          )}
        </div>

        {/* The table answers to its own width (container query), not the viewport: the sidebar takes space too. */}
        <div className={css.table} data-assignee={showAssignee || undefined}>
          <div className={cx("table-head", css.head)}>
            <span>{t.list.cols.client}</span>
            <span>{t.list.cols.status}</span>
            <span>{t.list.cols.questionnaire}</span>
            <span>{t.list.colNext}</span>
            {showAssignee && <span>{t.list.assignee}</span>}
            <span className={css.right}>{t.list.cols.updated}</span>
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
              {visible.map((x) => (
                <CaseRow key={x.exp.id} x={x} assignee={showAssignee ? (teamName(x.exp.assignee) ?? null) : undefined} />
              ))}
            </ul>
          )}
          {/* Pages once the list is longer than one page: range, previous / next, and how many per page. */}
          {shown.length > PAGE_SIZES[0] && (
            <nav aria-label={t.list.pager.label} className={css.pager}>
              <label className={css.pagerSize}>
                <span>{t.list.pager.perPage}</span>
                <Select aria-label={t.list.pager.perPage} value={String(perPage)} onChange={(v) => { setPerPage(Number(v)); setPage(1); }} className="w-20" options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))} />
              </label>
              <span className={css.pagerRange} aria-live="polite">
                {t.list.pager.range((current - 1) * perPage + 1, Math.min(current * perPage, shown.length), shown.length)}
              </span>
              <span className={css.pagerNav}>
                <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label={t.list.pager.prev} className={css.pagerBtn}>
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} aria-label={t.list.pager.next} className={css.pagerBtn}>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </span>
            </nav>
          )}
          {/* A short list ends on a closing line, so the space below reads as "nothing more", not as missing content. */}
          {shown.length > 0 && shown.length < 6 && current === pages && (
            <p className={css.endNote}>
              <span>{t.list.endNote}</span>
              <Link href="/clientes" className={css.textAction}>
                <UserPlus size={14} aria-hidden="true" />
                {t.list.invite}
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function CaseRow({ x, assignee }: { x: Triage; assignee?: string | null }) {
  const { t, tr, locale } = useI18n();
  const e = x.exp;
  const href = `/expedientes/${e.id}`;
  const step = nextStep(x, t);
  // The points behind the step, summed up as two counts; the full text is on hover and in the case file.
  const bad = x.alerts.filter((a) => a.level === "bad");
  const warn = x.alerts.filter((a) => a.level === "warn");
  const signals = [
    { level: "bad" as const, list: bad, label: t.list.missingN(bad.length) },
    { level: "warn" as const, list: warn, label: t.list.checkN(warn.length) },
  ].filter((s) => s.list.length);
  const contact = [e.answers.email, e.answers.telefono].filter((v): v is string => typeof v === "string" && !!v).join(" · ");
  const name = x.name || t.common.unnamedClient;

  return (
    <li className={css.row} data-tone={step.tone}>
      {/* Client: the name link covers the whole row; the step and alert links sit above it. */}
      <div className={css.client}>
        <span className={css.nameLine}>
          {x.unread > 0 && <span className={css.unreadDot} title={t.list.reasons.unread} aria-hidden="true" />}
          <Link href={href} className={css.rowLink} aria-label={t.list.open(name)}>
            {name}
          </Link>
          {e.example && <span className={css.tag}>{t.common.example}</span>}
          {e.ejercicio !== EJERCICIO && <span className={cx(css.tag, css.tagYear)}>{e.ejercicio}</span>}
        </span>
        <span className={css.contact}>{contact || t.list.noEmail}</span>
      </div>

      <div className={css.state}>
        <span title={tr(STATUSES.find((st) => st.id === e.status)!.help)}>
          <StatusPill status={e.status} />
        </span>
        {x.waiting && <span className={css.waiting}><WaitingLabel who={x.waiting} /></span>}
      </div>

      <div className={css.progress}>
        <span className={css.meter} aria-hidden="true">
          <span style={{ width: `${x.pct}%` }} data-done={x.pct === 100 || undefined} />
        </span>
        <span className={css.progressText}>
          <span className="figures">{x.pct} %</span>
          {x.pct < 100 && <span>· {t.list.pendingAnswers(x.pending)}</span>}
        </span>
      </div>

      <div className={css.next}>
        <Link href={step.href} className={css.step}>
          {step.tone === "act" && <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />}
          {step.tone === "wait" && <Clock size={14} strokeWidth={2.2} aria-hidden="true" />}
          {step.tone === "done" && <CircleCheck size={14} strokeWidth={2.2} aria-hidden="true" />}
          <span>{step.text}</span>
        </Link>
        {signals.length > 0 && (
          <span className={css.signals}>
            {signals.map((sg) => {
              const lv = LEVEL[sg.level];
              return (
                <Link key={sg.level} href={alertHref(e.id, sg.list[0])} title={sg.list.map((a) => tr(a.text)).join("\n")} className={css.signal}>
                  <lv.icon size={13} className={lv.cls} aria-hidden="true" />
                  {sg.label}
                </Link>
              );
            })}
          </span>
        )}
      </div>

      {assignee !== undefined && <span className={css.assignee}>{assignee ?? <span className={css.mutedText}>{t.list.unassigned}</span>}</span>}

      <span className={css.updated}>{fmtTime(e.updatedAt, locale)}</span>
    </li>
  );
}

/**
 * One overview count as a card: coloured icon, the figure large and bold, its label, and a filter
 * mark that says it is clickable. `hot` (something urgent waiting) tints the card in its colour.
 */
function MetricCard({ n, label, title, filterLabel, icon: Icon, tone, hot, on, onClick }: { n: number; label: string; title?: string; filterLabel: string; icon: LucideIcon; tone: Tone; hot?: boolean; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} aria-label={`${filterLabel} (${n})`} onClick={onClick} title={title ?? filterLabel} className={css.card} data-tone={tone} data-hot={hot || undefined} data-zero={n === 0 || undefined}>
      <span className={css.cardIcon} aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
      <span className={css.cardN}>{n}</span>
      <span className={css.cardLabel}>{label}</span>
      <span className={css.cardGo} aria-hidden="true">{on ? <X size={14} strokeWidth={2.2} /> : <ListFilter size={14} strokeWidth={2.2} />}</span>
    </button>
  );
}

const DISMISSED_KEY = "prerenta:deadlines:dismissed";

/**
 * Campaign deadlines as alert banners at the top of the page, with a countdown; nothing
 * until the gestoría sets them in Ajustes › Campaña. Within a week (or past) the banner is
 * red with a warning sign; further off it is a quiet info line. Each can be closed: the
 * browser remembers that deadline and date, so a new date shows again.
 */
export function DeadlineBanners() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    let stored: string[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    } catch {}
    if (!Array.isArray(stored) || !stored.length) return;
    const raf = requestAnimationFrame(() => setDismissed(stored));
    return () => cancelAnimationFrame(raf);
  }, []);
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {}
  };
  const items = (["filing", "directDebit"] as const)
    .filter((k) => firm.campaign?.[k])
    .map((k) => ({ k, iso: firm.campaign![k]!, id: `${k}:${firm.campaign![k]}` }))
    .filter((x) => !dismissed.includes(x.id))
    .sort((a, b) => a.iso.localeCompare(b.iso)); // the nearest (or overdue) deadline first
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ k, iso, id }) => {
        const d = daysUntil(iso);
        const urgent = d <= 7;
        const Icon = urgent ? TriangleAlert : CalendarClock;
        return (
          <div key={id} role={urgent ? "alert" : "status"} className={cx("flex items-center gap-3 rounded-lg border py-2.5 pr-2 pl-3 text-[14px]", urgent ? "border-bad/30 border-l-4 border-l-bad bg-bad-soft" : "border-info/20 bg-info-soft")}>
            <span className={cx("grid size-8 shrink-0 place-items-center rounded-md", urgent ? "bg-bad text-surface" : "bg-surface text-info")}>
              <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <b className="font-semibold text-ink">{t.list.deadline[k]}</b>
              <span className={cx("figures font-semibold", urgent ? "text-bad" : "text-info")}>{t.list.deadline.days(d)}</span>
              <span className="figures text-muted">· {fmtDate(iso)}</span>
            </p>
            <button type="button" onClick={() => dismiss(id)} aria-label={t.common.close} title={t.common.close} className={cx("grid size-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors", urgent ? "text-bad hover:bg-bad/10" : "text-muted hover:bg-info/10 hover:text-ink")}>
              <X size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
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

const OVERVIEW_KEY = "prerenta:cases:overview";

/** Whether the overview is unfolded; a per-browser preference, so it reads storage after mount and never fails without it. */
function useOverviewPref(): [boolean, (v: boolean) => void] {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(OVERVIEW_KEY);
    } catch {}
    if (stored !== "closed") return;
    const raf = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(raf);
  }, []);
  const set = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(OVERVIEW_KEY, v ? "open" : "closed");
    } catch {}
  };
  return [open, set];
}

/** "Filtros": secondary filters in a small panel under a button; the badge counts the active ones. Closes on Escape or a click outside. */
function FilterMenu({ label, active, children }: { label: string; active: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    // a dropdown's list is portalled outside the panel: a pick in it must not close the panel
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && !(e.target as Element).closest?.(`[${SELECT_PANEL_ATTR}]`) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={box} className={css.filterMenu}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={cx("field", css.filterBtn)} data-on={active > 0 || undefined}>
        <SlidersHorizontal size={15} aria-hidden="true" />
        {label}
        {active > 0 && <span className={css.filterCount}>{active}</span>}
      </button>
      {open && <div className={css.menuPanel}>{children}</div>}
    </div>
  );
}

const SORT_ICON: Record<SortKey, LucideIcon> = { recent: History, attention: Flame, name: ArrowDownAZ, progress: ArrowUpNarrowWide };

const PAGE_SIZES = [10, 25, 50] as const;
const PAGE_KEY = "prerenta:cases:perPage";

/** Cases per page: a per-browser preference (25 until changed), read after mount so it never breaks without storage. */
function usePageSize(): [number, (n: number) => void] {
  const [n, setN] = useState<number>(25);
  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(localStorage.getItem(PAGE_KEY));
    } catch {}
    if (!PAGE_SIZES.includes(stored as (typeof PAGE_SIZES)[number])) return;
    const raf = requestAnimationFrame(() => setN(stored));
    return () => cancelAnimationFrame(raf);
  }, []);
  const set = (v: number) => {
    setN(v);
    try {
      localStorage.setItem(PAGE_KEY, String(v));
    } catch {}
  };
  return [n, set];
}
