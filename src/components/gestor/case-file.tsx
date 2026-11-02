"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, CircleCheck, Contact, CreditCard, FileDown, Mail, PencilLine, Phone, Send, ShieldCheck, UserRound, UserRoundX, Zap, CircleAlert, Eye, FileSignature, Clock, GitCompareArrows, ClipboardList, FileCheck2, History, FileText, Info, ListChecks, LayoutGrid, LockKeyhole, TriangleAlert, type LucideIcon } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { collectDocs, overall, progressOf, sectionState } from "@/lib/questionnaire/progress";
import { actions, caseOrder, clientName, openTasks, tasksToCheck, unreadFor, useAppState } from "@/lib/data/store";
import { STATUSES, slotKey, type Status } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { AnswersSummary } from "@/components/questionnaire/answers-summary";
import { ChatBox } from "@/components/chat/chat-box";
import { PageTitle } from "@/components/ui/app-shell";
import { FileTile } from "@/components/ui/file-card";
import { Button, ButtonLink, Loading, Pill, StatusPill, cx } from "@/components/ui/primitives";
import { StepDot } from "@/components/ui/progress";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { WaitingLabel } from "./case-list";
import { TopBar } from "./gestor-shell";
import { useRemoteCase } from "@/lib/api/use-remote";
import { API_MODE } from "@/lib/auth/config";
import { alertsOf, triage } from "@/lib/gestor/triage";
import { ResultPanel } from "./result-panel";
import { DownloadAll } from "./download-all";
import { AskButton, TaskPanel, isAsked } from "./task-panel";
import { ActivityLog } from "./activity-log";
import { SendChanges, hasSendChanges } from "./send-changes";
import { L, textIn, type Text } from "@/lib/i18n";
import { LEGAL_KINDS, signState } from "@/lib/data/legal";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { casesOfClient } from "@/lib/data/years";
import { SIGN_TONE } from "@/components/client/sign-step";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { Alert } from "@/lib/questionnaire/alerts";

// An alert's card: a faint wash of its colour and a solid edge; its badge in the full colour.
// An alert inside its block is a flat row (one level of box): a colour rule at its left edge, hairlines between rows.
const ALERT_CARD = { bad: "border-l-bad", warn: "border-l-warn", info: "border-l-info" } as const;
const ALERT_BADGE = { bad: "bg-bad text-white", warn: "bg-warn text-white", info: "bg-info text-white" } as const;
const ALERT_ICON = { bad: CircleAlert, warn: TriangleAlert, info: Info } as const;
const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** G3 · Ficha del expediente: content in the middle, properties on the right, ↑/↓ to move between cases. */
export function CaseFile({ id }: { id: string }) {
  const { exps, firm } = useAppState();
  useRemoteCase(id, true);
  const { t, tr, locale } = useI18n();
  const router = useRouter();
  const { p } = usePlatformText();
  const [tab, setTab] = useState<RailTab>("details");
  const [main, setMain] = useState<MainTab>("overview");
  const [showSecs, setShowSecs] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusFailed, setStatusFailed] = useState(false);
  const order = caseOrder(exps).map((e) => e.id);
  const idx = order.indexOf(id);
  const prevId = idx > 0 ? order[idx - 1] : null;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" && nextId) router.push(`/expedientes/${nextId}`);
      if (e.key === "k" && prevId) router.push(`/expedientes/${prevId}`);
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [prevId, nextId, router]);

  const e = exps[id];
  // API mode: the inbox only has the summary; wait for the full case (answers, documents, chat).
  const loaded = !!e && (!e.remote || e.remote.loaded);
  // Links into the page ("#documentos", "#sec-<section>", "#chat", from alerts, the case list or other pages) open
  // the tab that holds the target, then unfold and scroll to it.
  useEffect(() => {
    if (!loaded) return;
    const goTo = (hash: string) => {
      if (!hash) return;
      if (hash === "chat") {
        setTab("chat");
        document.getElementById("chat")?.scrollIntoView({ block: "start" });
        return;
      }
      setMain(tabOf(hash));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const el = document.getElementById(hash);
          if (!el) return;
          if (el instanceof HTMLDetailsElement) el.open = true;
          el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }),
      );
    };
    const fromHash = () => goTo(decodeURIComponent(window.location.hash.slice(1)));
    const fromEvent = (ev: Event) => goTo((ev as CustomEvent<string>).detail);
    // In-page links ("Ir a documentos" on an alert…): Next's links change the hash without a hashchange event.
    const fromClick = (ev: MouseEvent) => {
      const link = (ev.target as Element).closest?.("a[href^='#']");
      if (link) requestAnimationFrame(() => goTo(decodeURIComponent((link.getAttribute("href") ?? "").slice(1))));
    };
    const raf = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    window.addEventListener(GOTO, fromEvent);
    document.addEventListener("click", fromClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener(GOTO, fromEvent);
      document.removeEventListener("click", fromClick);
    };
  }, [loaded, id]);

  if (API_MODE && !loaded)
    return (
      <>
        <TopBar crumbs={[{ label: t.list.title, href: "/expedientes" }]} />
        <div className="px-6 py-10"><Loading /></div>
      </>
    );

  if (!e)
    return (
      <>
        <TopBar crumbs={[{ label: t.list.title, href: "/expedientes" }]} />
        <div className="px-6 py-10">
          <h1 className="display-tight text-[17px] font-semibold">{t.file.notFound}</h1>
          <Link href="/expedientes" className="mt-3 inline-block font-semibold text-accent">
            {t.file.backList}
          </Link>
        </div>
      </>
    );

  const a = e.answers;
  const name = clientName(e) || t.common.unnamedClient;
  const tt = e.remote ? { pct: e.remote.progress.percent, pending: e.remote.progress.total - e.remote.progress.answered } : overall(a);
  const { active: al, reviewed: alDone } = alertsOf(e);
  const docs = collectDocs(a);
  const nDocs = docs.reduce((n, d) => n + d.files.length, 0);
  const nPend = docs.filter((d) => !d.files.length).length;
  const fee = feeFor(e, firm);
  const years = casesOfClient(exps, e);
  const waiting = triage(e).waiting;
  const openSecs = SCHEMA.filter((s) => sectionState(progressOf(s.fields, a)) !== "done").length;
  const alBad = al.filter((x) => x.level === "bad").length;
  const alWarn = al.filter((x) => x.level === "warn").length;

  const mainTabs: [MainTab, LucideIcon, string, number, boolean][] = [
    ["overview", LayoutGrid, t.file.tabs.overview, al.length + openTasks(e).length + tasksToCheck(e).length, al.some((x) => x.level === "bad")],
    ["answers", ListChecks, t.file.tabs.answers, openSecs, false],
    ["docs", FileText, t.file.tabs.docs, nPend, nPend > 0],
    ...(FEATURES.resultApproval ? [["result", FileCheck2, t.file.tabs.result, 0, false] as [MainTab, LucideIcon, string, number, boolean]] : []),
    ...(FEATURES.activityLog ? [["activity", History, t.file.tabs.history, 0, false] as [MainTab, LucideIcon, string, number, boolean]] : []),
  ];

  const nav = (
    <div className="flex items-center gap-1">
      <span className="mr-1 font-mono text-xs text-muted" title={t.file.keys}>
        {t.file.position(idx + 1, order.length)}
      </span>
      <NavBtn href={prevId && `/expedientes/${prevId}`} label={t.file.prev}>
        ↑
      </NavBtn>
      <NavBtn href={nextId && `/expedientes/${nextId}`} label={t.file.next}>
        ↓
      </NavBtn>
    </div>
  );

  return (
    <>
      <PageTitle>{`${name} · ${t.titles.caseFile}`}</PageTitle>
      <TopBar crumbs={[{ label: t.list.title, href: "/expedientes" }, { label: name }]} right={nav} />

      <div className="grid items-start min-[1180px]:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Properties: right column on wide screens, a compact block on top below that. */}
        {/* Side panel in three tabs, so chat and notes are one click away instead of at the bottom of a long column. */}
        {/* Below 1180px the panel follows the case: a band of its own (darker ground, a thick top rule, its title), set apart from the case above */}
        <aside id="chat" aria-label={p.rail.label} className="order-2 scroll-mt-28 border-line max-[1179px]:mt-4 max-[1179px]:border-t-[3px] max-[1179px]:border-t-accent/20 max-[1179px]:bg-sunk max-[1179px]:pb-6 min-[1180px]:sticky min-[1180px]:top-12 min-[1180px]:flex min-[1180px]:max-h-[calc(100dvh-74px)] min-[1180px]:flex-col min-[1180px]:border-t-0 min-[1180px]:border-l">
          <h2 className="t-label px-4 pt-5 pb-2 text-muted sm:px-6 min-[1180px]:hidden">{p.rail.label}</h2>
          <div role="tablist" aria-label={p.rail.label} className="flex gap-1 border-b border-line bg-surface px-4 py-2 max-[1179px]:mx-4 max-[1179px]:rounded-xl max-[1179px]:border max-[1179px]:p-1 max-[1179px]:shadow-sm sm:px-6 max-[1179px]:sm:mx-6">
            {([
              ["details", p.rail.details, 0],
              ["chat", t.file.anchors.chat, unreadFor(e, "gestor")],
              ["notes", t.file.notes, 0],
            ] as const).map(([k, label, n]) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`rail-${k}`}
                aria-selected={tab === k}
                aria-controls="rail-panel"
                onClick={() => setTab(k)}
                className={cx("flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-[13.5px] font-medium whitespace-nowrap transition-colors", tab === k ? "bg-accent text-accent-ink" : "text-muted hover:bg-accent-soft hover:text-accent")}
              >
                {label}
                {n > 0 && <span className={cx("figures rounded-full px-1.5 text-[11.5px] font-semibold", tab === k ? "bg-surface/20" : "bg-copper-soft text-copper-text")}>{n}</span>}
                {k === "notes" && e.notes.trim() && <span className={cx("size-1.5 rounded-full", tab === k ? "bg-accent-ink" : "bg-accent")} aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div id="rail-panel" role="tabpanel" aria-labelledby={`rail-${tab}`} className={cx("thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 max-[1179px]:sm:px-6", tab === "details" && "min-[1180px]:bg-sunk/50")}>
            {tab === "details" && (
              <>
                {/* Inspector: the case's facts in separate cards, the actions last. */}
                <div className="grid gap-2 sm:gap-3 sm:max-[1179px]:grid-cols-2">
                  {/* Status and who handles it */}
                  <RailCard>
                    <Prop label={t.file.status}>
                      <Select
                        id="st-sel"
                        aria-label={t.file.status}
                        value={e.status}
                        onChange={async (v) => {
                          if (statusBusy) return;
                          setStatusBusy(true);
                          setStatusFailed(false);
                          try {
                            setStatusFailed(!await actions.setStatus(e.id, v as Status));
                          } finally {
                            setStatusBusy(false);
                          }
                        }}
                        disabled={statusBusy}
                        buttonClassName="h-10 rounded-lg px-3 text-sm font-medium"
                        options={STATUSES.map((s) => ({ value: s.id, label: tr(s.label), icon: STATUS_ICON[s.id] }))}
                      />
                      {statusFailed && <p role="alert" className="text-sm text-bad">{t.clients.api.failed}</p>}
                    </Prop>
                    <Prop label={t.list.assignee}>
                      <Select
                        aria-label={t.list.assignee}
                        value={e.assignee ?? ""}
                        onChange={(v) => actions.assign(e.id, v || null)}
                        buttonClassName="h-10 rounded-lg px-3 text-sm font-medium"
                        options={[{ value: "", label: t.list.unassigned, icon: UserRoundX }, ...firm.team.map((m) => ({ value: m.id, label: m.name, icon: UserRound }))]}
                      />
                    </Prop>
                  </RailCard>

                  {/* The client: how to reach them, whether they confirmed who they are */}
                  <RailCard title={t.file.contact} icon={Contact}>
                    <ul className="flex flex-col gap-2 text-[13.5px]">
                      <li className="flex items-center gap-2.5">
                        <Phone size={15} className="shrink-0 text-muted" aria-hidden="true" />
                        {typeof a.telefono === "string" && a.telefono ? <a href={`tel:${a.telefono.replace(/\s+/g, "")}`} className="truncate hover:text-accent hover:underline">{a.telefono}</a> : <span className="text-muted">—</span>}
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Mail size={15} className="shrink-0 text-muted" aria-hidden="true" />
                        {typeof a.email === "string" && a.email ? <a href={`mailto:${a.email}`} className="truncate hover:text-accent hover:underline">{a.email}</a> : <span className="text-muted">—</span>}
                      </li>
                    </ul>
                    {FEATURES.identityCheck && (
                      <RailRow label={t.file.identity}>
                        {e.identityConfirmedAt ? <Pill tone="ok" icon={ShieldCheck}>{fmtTime(e.identityConfirmedAt, locale)}</Pill> : <Pill tone="warn" icon={Clock}>{t.file.identityNo}</Pill>}
                      </RailRow>
                    )}
                  </RailCard>

                  {/* Signatures and payment, each a coloured tag */}
                  {(FEATURES.signing || FEATURES.payments) && (
                    <RailCard title={FEATURES.signing ? t.file.signatures : t.file.payment} icon={FEATURES.signing ? FileSignature : CreditCard}>
                      {FEATURES.signing &&
                        LEGAL_KINDS.map((k) => {
                          const st = signState(e, firm, k);
                          return (
                            <RailRow key={k} label={k === "privacy" ? t.settings.legal.privacy : t.settings.legal.mandate}>
                              <Pill tone={SIGN_TONE[st]}>{t.sign.state[st]}</Pill>
                            </RailRow>
                          );
                        })}
                      {FEATURES.payments && (
                        <RailRow label={t.file.payment} divided={FEATURES.signing}>
                          {e.payment ? (
                            <Pill tone="ok" icon={Check}>{fmtEuros(e.payment.amount, locale)}</Pill>
                          ) : fee ? (
                            <span className="flex items-center gap-2">
                              <span className="figures text-[13.5px] font-semibold">{fmtEuros(fee.total, locale)}</span>
                              <Pill tone="warn" icon={Clock}>{t.cobros.pending}</Pill>
                            </span>
                          ) : (
                            <Pill>—</Pill>
                          )}
                        </RailRow>
                      )}
                    </RailCard>
                  )}

                  {/* The questionnaire at a glance; the section list opens on demand. */}
                  <RailCard title={t.file.sectionsNav} icon={ListChecks} aside={<span className={cx("figures text-[13px] font-semibold", tt.pct === 100 ? "text-ok" : "text-accent")}>{tt.pct}%</span>}>
                    <div className="h-2 overflow-hidden rounded-full bg-sunk" aria-hidden="true">
                      <div className={cx("h-full rounded-full transition-[width]", tt.pct === 100 ? "bg-ok" : "bg-accent")} style={{ width: `${tt.pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] text-muted">{t.q.sectionsDone(SCHEMA.length - openSecs, SCHEMA.length)}</p>
                      <button type="button" aria-expanded={showSecs} onClick={() => setShowSecs(!showSecs)} className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-accent underline-offset-4 hover:underline">
                        {showSecs ? p.rail.hideSections : p.rail.showSections}
                        <ChevronDown size={14} className={cx("motion-safe:transition-transform motion-safe:duration-200", showSecs && "rotate-180")} aria-hidden="true" />
                      </button>
                    </div>
                    {showSecs && (
                      <nav aria-label={t.file.sectionsNav}>
                        <ol className="flex flex-col">
                          {SCHEMA.map((s, i) => {
                            const pr = progressOf(s.fields, a);
                            const st = sectionState(pr);
                            return (
                              <li key={s.slug}>
                                <a
                                  href={`#sec-${s.slug}`}
                                  onClick={(ev) => {
                                    ev.preventDefault();
                                    openSection(s.slug);
                                  }}
                                  className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] transition-colors hover:bg-hover"
                                >
                                  <StepDot n={i + 1} state={st} size={20} />
                                  <span className="min-w-0 flex-1 truncate">{tr(s.short)}</span>
                                  {st === "partial" && <span className="text-[12px] font-medium text-copper-text">{t.q.leftN(pr.total - pr.done)}</span>}
                                </a>
                              </li>
                            );
                          })}
                        </ol>
                      </nav>
                    )}
                  </RailCard>

                  {/* What the gestor does with the case */}
                  <RailCard title={p.rail.actions} icon={Zap}>
                    <ButtonLink href={`/expedientes/${e.id}/vista-cliente`} variant="primary" className="h-11 w-full justify-center gap-2 rounded-lg text-[14px]">
                      <Eye size={17} strokeWidth={2} aria-hidden="true" />
                      {t.file.viewAsClient}
                    </ButtonLink>
                    {(FEATURES.signing || FEATURES.resultApproval) && (
                      <ButtonLink href={`/expedientes/${e.id}/constancia`} variant="outline" className="h-11 w-full justify-center gap-2 rounded-lg text-[14px]">
                        <FileDown size={17} strokeWidth={2} aria-hidden="true" />
                        {t.extra.record.link}
                      </ButtonLink>
                    )}
                  </RailCard>

                  {FEATURES.prefill && (
                    <RailCard title={t.years.otherYears} icon={History}>
                      {years.filter((y) => y.id !== e.id).map((y) => (
                        <Link key={y.id} href={`/expedientes/${y.id}`} className="text-[13.5px] font-medium text-accent hover:underline">
                          {t.years.goYear(y.ejercicio)}
                        </Link>
                      ))}
                      {!years.some((y) => y.ejercicio > e.ejercicio) && (
                        <>
                          <Button size="sm" onClick={() => { const nid = actions.openNextYear(e.id); if (nid) router.push(`/expedientes/${nid}`); }}>
                            {t.years.nextYear(e.ejercicio + 1)}
                          </Button>
                          <p className="text-[12px] text-muted">{t.years.nextHint}</p>
                        </>
                      )}
                    </RailCard>
                  )}
                </div>
                <p className="mt-3 flex items-center gap-1.5 px-1 text-[12px] text-muted">
                  <CalendarDays size={13} aria-hidden="true" />
                  {t.file.created}: {fmtTime(e.createdAt, locale)}
                </p>
          {e.example && <p className="mt-4 text-xs text-muted">{t.file.exampleNote}</p>}
          <p className="mt-3 hidden text-[11.5px] text-muted xl:block">{t.file.keys}</p>
              </>
            )}

            {tab === "chat" && (
              <div className="flex flex-col gap-2">
                <p className="text-[12.5px] text-muted">{t.file.chatAside}</p>
                {/* a white card on the panel's grey ground, the conversation on white inside it */}
                <div className="overflow-clip rounded-xl border border-line bg-surface shadow-sm">
                  <ChatBox exp={e} side="gestor" height="h-[min(520px,calc(100dvh-330px))] min-h-[280px] bg-surface" />
                </div>
              </div>
            )}

            {tab === "notes" && (
              // one white card: the private note, then (under a hairline) what the client wrote
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
                <div>
                  <label htmlFor={"notes-" + e.id} className="flex items-center gap-2 text-[14px] font-semibold">
                    <LockKeyhole size={15} className="text-accent" aria-hidden="true" />
                    {t.file.notes}
                  </label>
                  <p className="mt-0.5 text-[12.5px] text-muted">{t.file.notesAside}</p>
                </div>
                <textarea id={"notes-" + e.id} rows={8} value={e.notes} onChange={(ev) => actions.setNotes(e.id, ev.target.value)} placeholder={t.file.notesPh} className="field py-2 max-sm:min-h-32" />
                <div className="border-t border-line pt-3 text-[13px]">
                  <b className="block text-ink">{t.file.fromClient.trim()}</b>
                  <span className="text-muted">{typeof a.obs === "string" && a.obs ? a.obs : p.rail.fromClientNone}</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="order-1 flex w-full min-w-0 flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5 xl:py-6">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="display-serif text-[clamp(24px,2.4vw,28px)] leading-tight font-semibold break-words max-sm:leading-6">{name}</h1>
              <span className="max-sm:hidden"><StatusPill status={e.status} /></span>
              {waiting && <span className="max-sm:hidden"><WaitingLabel who={waiting} /></span>}
            </div>
            <p className="text-[14px] text-muted max-sm:hidden">
              {[e.sentAt && t.home.sentOn(fmtTime(e.sentAt, locale)), t.q.sectionsDone(SCHEMA.length - openSecs, SCHEMA.length), tt.pending > 0 && t.home.answersPending(tt.pending), t.file.docsAside(nDocs, nPend)].filter(Boolean).join(" · ")}
            </p>
            {/* Phones: one quiet metadata line under the name (no box, so the tabs and figures below carry the
                weight): on the left when it was sent (or, not sent yet, when it was created), on the right the
                status with its icon and colour. */}
            <div className="mb-2 flex items-center justify-between gap-3 text-[12.5px] sm:hidden">
              <span className="figures min-w-0 truncate text-muted">{e.sentAt ? t.home.sentOn(fmtTime(e.sentAt, locale)) : `${t.file.created}: ${fmtTime(e.createdAt, locale)}`}</span>
              <span className="shrink-0"><StatusPill status={e.status} /></span>
            </div>
          </header>
          {/* Tabs: one part of the case at a time instead of one long page; chat and notes are in the side panel. */}
          <div role="tablist" aria-label={t.file.tabs.label} className="no-scrollbar sticky top-[104px] z-[9] -mx-4 -mt-2 flex gap-1.5 overflow-x-auto border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur-sm max-sm:border-t max-sm:py-2 sm:-mx-6 sm:px-6 lg:top-12">
            {mainTabs.map(([key, Icon, label, n, hot]) => {
              const on = main === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`main-${key}`}
                  aria-selected={on}
                  aria-controls="main-panel"
                  onClick={() => {
                    setMain(key);
                    history.replaceState(null, "", `#${TAB_ANCHOR[key]}`);
                  }}
                  className={cx(
                    // the active tab: a soft navy capsule with bold navy text; the others quiet until hovered
                    "flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[14px] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
                    on ? "bg-accent-soft font-semibold text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent-rgb)/0.12)]" : "font-medium text-muted hover:bg-sunk hover:text-ink",
                  )}
                >
                  <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                  {label}
                  {n > 0 && <span className={cx("figures grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold", hot ? "bg-copper text-white" : on ? "bg-surface text-accent" : "bg-sunk text-muted")}>{n}</span>}
                </button>
              );
            })}
          </div>

          {/* phones: 16px between the panel's parts, the same as from the tab bar to the first one */}
          <div id="main-panel" role="tabpanel" aria-labelledby={`main-${main}`} className="flex flex-col gap-6 max-sm:gap-4">
          {main === "overview" && (
            <>
              {/* The case at a glance: four figures, each a way into its tab */}
              <div className="@container"><div className="grid grid-cols-2 gap-3 max-sm:gap-2 @[680px]:grid-cols-4">
                <Kpi icon={ListChecks} tone={tt.pct === 100 ? "ok" : "accent"} label={t.file.kpi.questionnaire} value={`${tt.pct} %`} sub={<Tooltip plain inline text={t.q.sectionsDone(SCHEMA.length - openSecs, SCHEMA.length) + (tt.pending ? ` · ${t.home.answersPending(tt.pending)}` : "")}><span className="cursor-help">{t.file.kpi.sections(SCHEMA.length - openSecs, SCHEMA.length)}</span></Tooltip>} onClick={() => setMain("answers")} />
                <Kpi icon={FileText} tone="info" zero={!nDocs} label={t.file.kpi.docs} value={String(nDocs)} sub={t.file.kpi.docsOf(nDocs, nPend)} onClick={() => setMain("docs")} />
                <Kpi icon={TriangleAlert} tone={alBad ? "bad" : alWarn ? "warn" : al.length ? "info" : "ok"} zero={!al.length} label={t.file.kpi.alerts} value={String(al.length)} sub={al.length ? (
                  <span className="flex flex-wrap gap-1.5 max-sm:gap-1">
                    {(["bad", "warn", "info"] as const).map((lv) => [lv, al.filter((x) => x.level === lv).length] as const).filter(([, n]) => n > 0).map(([lv, n]) => (
                      <Tooltip
                        key={lv}
                        plain
                        inline
                        title={`${t.file.alertLevel[lv]} · ${n}`}
                        text={al.filter((x) => x.level === lv).map((x) => tr(x.title)).join(" · ")}
                        body={<AlertList alerts={al.filter((x) => x.level === lv)} />}
                      >
                        <span className={cx("inline-flex h-5 cursor-help items-center gap-1 rounded-full px-2 text-[11.5px] leading-none font-semibold max-sm:h-4 max-sm:px-1.5 max-sm:text-[10.5px]", KPI_CHIP[lv])}>
                          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                          {n}
                          <span className="sr-only">{t.file.alertLevel[lv]}: {al.filter((x) => x.level === lv).map((x) => tr(x.title)).join("; ")}</span>
                        </span>
                      </Tooltip>
                    ))}
                  </span>
                ) : t.file.kpi.none} href="#avisos" />
                <Kpi icon={ClipboardList} tone={openTasks(e).length ? "copper" : "neutral"} zero={!openTasks(e).length} label={t.file.kpi.requests} value={String(openTasks(e).length)} sub={tasksToCheck(e).length ? t.tasks.aside(openTasks(e).length, tasksToCheck(e).length) : t.file.kpi.none} href="#peticiones" />
              </div></div>


          <Block id="avisos" icon={TriangleAlert} title={t.file.alerts} aside={al.length || undefined}>
            <p className="-mt-1 text-[13px] text-muted">
              <span className="font-medium">{t.file.auto}.</span> {t.file.suggest}
            </p>
            {al.length ? (
              <ul className="flex flex-col">
                {al.map((x, i) => {
                  const Icon = ALERT_ICON[x.level];
                  const sec = SCHEMA.find((s) => s.slug === x.target.section);
                  return (
                    <li key={i} className="border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
                      <div className={cx("flex flex-col gap-3 border-l-[3px] pl-4 max-sm:pl-3", ALERT_CARD[x.level])}>
                      {/* Severity in a fixed place, top left; where it comes from, top right */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Tooltip title={t.file.alertHelp[x.level].title} text={t.file.alertHelp[x.level][x.target.kind === "docs" ? "docs" : "answers"]}>
                          <span className={cx("inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold tracking-[0.01em]", ALERT_BADGE[x.level])}>
                            <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
                            {t.file.alertLevel[x.level]}
                          </span>
                        </Tooltip>
                        {sec && <span className="text-[12.5px] text-muted">{tr(sec.short)}</span>}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-[15px] leading-[22px] font-semibold text-ink max-sm:text-[14px] max-sm:leading-5">{tr(x.title)}</p>
                        {x.detail && <p className="text-[13.5px] leading-5 text-muted max-sm:line-clamp-2 max-sm:text-[12.5px] max-sm:leading-[18px]">{tr(x.detail)}</p>}
                      </div>
                      {/* Phones: one row, the main action labelled and the other two as icons */}
                      <div className="flex flex-wrap items-center gap-2 max-sm:gap-1.5">
                        <ButtonLink href={x.target.kind === "docs" ? "#documentos" : `#sec-${x.target.section}`} size="sm" className="max-sm:min-w-0 max-sm:flex-1">
                          {x.target.kind === "docs" ? t.file.goDocs : t.file.goAnswer}
                        </ButtonLink>
                        <AskButton exp={e} text={x.text} target={x.target} compact />
                        {FEATURES.requestTracking && (
                          <Button size="sm" variant="ghost" onClick={() => actions.reviewAlert(e.id, x.text.es, x.text, true)} aria-label={t.file.review} title={t.file.review} className="max-sm:w-(--control-h-sm) max-sm:px-0">
                            <Check size={14} aria-hidden="true" />
                            <span className="max-sm:sr-only">{t.file.review}</span>
                          </Button>
                        )}
                      </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t.file.noAlerts}</p>
            )}
            {alDone.length > 0 && (
              <details className="text-[13.5px]">
                <summary className="cursor-pointer font-medium text-muted hover:text-ink">{t.file.reviewedN(alDone.length)}</summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {alDone.map((x) => (
                    <li key={x.text.es} className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-md border border-line bg-sunk px-3 py-2 text-muted">
                      <span className="min-w-0 flex-1 line-through decoration-line-strong">{tr(x.title)}</span>
                      <span className="flex items-center gap-3 whitespace-nowrap">
                        <span className="text-[12.5px]">{t.file.reviewed} · {fmtTime(e.reviewedAlerts![x.text.es].at, locale)}</span>
                        <button type="button" onClick={() => actions.reviewAlert(e.id, x.text.es, x.text, false)} className="font-medium text-accent hover:underline">{t.file.undo}</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Block>

          {hasSendChanges(e) && (
            <Block id="cambios" icon={GitCompareArrows} title={t.changes.title} wideAside aside={t.changes.aside}>
              <SendChanges exp={e} />
            </Block>
          )}

          <Block id="peticiones" icon={ClipboardList} title={t.tasks.title} wideAside aside={FEATURES.requestTracking ? t.tasks.aside(openTasks(e).length, tasksToCheck(e).length) : undefined}>
            <TaskPanel exp={e} />
          </Block>
            </>
          )}

          {main === "answers" && (

          <Block
            id="respuestas"
            icon={ListChecks}
            title={t.file.answers}
            aside={
              <span className="flex gap-3">
                <button type="button" onClick={() => foldAll(true)} className="font-medium text-accent hover:underline">{t.file.expandAll}</button>
                <button type="button" onClick={() => foldAll(false)} className="font-medium text-accent hover:underline">{t.file.collapseAll}</button>
              </span>
            }
          >
            <div className="-mt-2 flex flex-col">
              {SCHEMA.map((s, i) => {
                const pr = progressOf(s.fields, a);
                const st = sectionState(pr);
                // Only sections with questions still open start unfolded: complete and empty ones stay folded.
                return (
                  <details key={s.slug} id={`sec-${s.slug}`} open={st === "partial"} className="group scroll-mt-[124px] border-t border-line first:border-t-0">
                    <summary className="-mx-2 flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-3 font-semibold transition-colors hover:bg-hover/60 [&::-webkit-details-marker]:hidden">
                      <StepDot n={i + 1} state={st} />
                      <span className="min-w-0 flex-1 text-[15px]">{tr(s.title)}</span>
                      {st === "done" ? (
                        <Pill tone="ok" icon={Check}>{t.sectionState.done}</Pill>
                      ) : st === "partial" ? (
                        <Pill tone="copper" icon={CircleAlert}>{t.q.leftN(pr.total - pr.done)}</Pill>
                      ) : (
                        <Pill icon={Clock}>{t.sectionState.empty}</Pill>
                      )}
                      <ChevronDown size={16} className="text-muted motion-safe:transition-[rotate] motion-safe:duration-200 group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <dl className="grid gap-3 pt-1 pb-5 md:grid-cols-2">
                      <AnswersSummary fields={s.fields} scope={a} layout="grid" />
                    </dl>
                  </details>
                );
              })}
            </div>
          </Block>

          )}

          {main === "docs" && (
          <Block id="documentos" icon={FileText} title={t.file.docs} wideAside aside={<span className="flex flex-wrap items-center gap-3">{t.file.docsAside(nDocs, nPend)}<DownloadAll exp={e} /></span>}>
            {docs.length ? (
              <div className="@container -m-5 sm:-m-6">
                <div className="table-head hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_7.5rem_minmax(0,1.5fr)] gap-4 pad-x-card @2xl:grid">
                  <span>{t.file.docCols.doc}</span>
                  <span>{t.file.docCols.where}</span>
                  <span>{t.file.docCols.state}</span>
                  <span>{t.file.docCols.files}</span>
                </div>
                <ul>
                  {docs.map((d, i) => {
                    const later = e.notYet?.[slotKey(d.field, d.item)];
                    const sec = SCHEMA.find((s) => s.slug === d.section);
                    return (
                      <li key={i} className={cx("grid gap-x-4 gap-y-2 border-t border-line pad-x-card py-3.5 text-[14px] transition-colors first:border-t-0 hover:bg-sunk/40 @2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_7.5rem_minmax(0,1.5fr)] @2xl:items-center", !d.files.length && !later && "bg-bad-soft/25")}>
                        <span className="font-medium leading-5 text-ink">{tr(d.label)}</span>
                        <span className="text-[13px] leading-5 text-muted">{[sec && tr(sec.short), d.context && tr(d.context)].filter(Boolean).join(" · ")}</span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {d.files.length ? <Pill tone="ok" icon={Check}>{t.upload.done}</Pill> : later ? <Pill icon={Clock}>{t.file.laterBadge}</Pill> : <Pill tone="bad" icon={CircleAlert}>{t.common.missing}</Pill>}
                          {!d.files.length && isAsked(e, docTask(d.label, d.context)) && <Pill tone="copper" icon={Clock}>{t.tasks.state.open}</Pill>}
                        </span>
                        <span className="grid min-w-0 gap-1.5 @lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                          {d.files.map((f) => <FileTile key={f.id} file={f} />)}
                          {!d.files.length && later?.note && <span className="text-[13px] text-muted">«{later.note}»</span>}
                          {!d.files.length && <span><AskButton exp={e} text={docTask(d.label, d.context)} target={{ section: d.section, kind: "docs", field: d.field, item: d.item }} /></span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted">{t.file.noDocs}</p>
            )}
          </Block>
          )}

          {FEATURES.resultApproval && main === "result" && (
            <Block id="resultado" icon={FileCheck2} title={t.resultG.title}>
              <ResultPanel exp={e} />
            </Block>
          )}

          {FEATURES.activityLog && main === "activity" && (
            <Block id="actividad" icon={History} title={t.activity.title} wideAside aside={t.activity.aside(e.activity?.length ?? 0)}>
              <ActivityLog exp={e} />
            </Block>
          )}
          </div>

        </div>
      </div>
    </>
  );
}

/** Request text for a missing document, in both languages. */
const docTask = (label: Text, context: Text | null) => {
  const ctx = (k: "es" | "va" | "en") => (context ? ` (${textIn(context, k)})` : "");
  return L(`Suba: ${label.es}${ctx("es")}`, `Upload: ${label.en}${ctx("en")}`, `Puge: ${textIn(label, "va")}${ctx("va")}`);
};

/** One section of the case as a panel (design system › Panel): header with icon, title and note, then the content. */
const GOTO = "case-goto";
type MainTab = "overview" | "answers" | "docs" | "result" | "activity";
/** Each tab's anchor, kept in the address so a reload or a shared link opens the same tab. */
const TAB_ANCHOR: Record<MainTab, string> = { overview: "avisos", answers: "respuestas", docs: "documentos", result: "resultado", activity: "actividad" };
/** The tab that holds a target on the page. */
const tabOf = (hash: string): MainTab =>
  hash === "respuestas" || hash.startsWith("sec-") ? "answers"
  : hash === "documentos" ? "docs"
  : hash === "resultado" ? "result"
  : hash === "actividad" ? "activity"
  : "overview";

/** Opens a questionnaire section on the case page (its tab, unfolded) and scrolls to it. */
function openSection(slug: string) {
  history.replaceState(null, "", `#sec-${slug}`);
  window.dispatchEvent(new CustomEvent(GOTO, { detail: `sec-${slug}` }));
}

/**
 * One figure of the overview, styled like the Cases metric cards: a coloured icon, the value, a
 * short line; it opens the part it counts. `bad`, `warn` and `copper` (something to act on) tint
 * the card and its figure in their colour; `ok` gets a quiet green edge; `zero` steps back.
 */
// The four cards share one white ground; the colour lives only in the icon box and the figure.
const KPI_TONE = {
  bad: { tile: "bg-bad-soft text-bad ring-1 ring-bad/15", n: "text-bad" },
  warn: { tile: "bg-warn-soft text-warn ring-1 ring-copper", n: "text-warn" },
  copper: { tile: "bg-copper-soft text-copper-text ring-1 ring-copper", n: "text-copper-text" },
  ok: { tile: "bg-ok-soft text-ok ring-1 ring-ok/15", n: "text-ok" },
  info: { tile: "bg-info-soft text-info ring-1 ring-info/15", n: "text-info" },
  accent: { tile: "bg-accent-soft text-accent ring-1 ring-accent/10", n: "text-ink" },
  neutral: { tile: "bg-sunk text-muted ring-1 ring-line", n: "text-disabled" },
} as const;

/** The alerts of one level as a short list, for a tooltip on dark ground: title, then its particulars. */
function AlertList({ alerts }: { alerts: Alert[] }) {
  const { tr } = useI18n();
  return (
    <ul className="flex flex-col gap-1.5">
      {alerts.map((a, i) => (
        <li key={i} className="flex gap-2">
          <span className={cx("mt-[7px] size-1.5 shrink-0 rounded-full", a.level === "bad" ? "bg-bad-soft" : a.level === "warn" ? "bg-warn-soft" : "bg-info-soft")} aria-hidden="true" />
          <span className="min-w-0">
            <span className="block font-medium text-white">{tr(a.title)}</span>
            {a.detail && <span className="block text-[12px] leading-[17px] text-white/70">{tr(a.detail)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const KPI_CHIP = { bad: "bg-bad-soft text-bad", warn: "bg-warn-soft text-warn", info: "bg-info-soft text-info" } as const;

function Kpi({ icon: Icon, tone, label, value, sub, href, onClick, zero }: { icon: LucideIcon; tone: keyof typeof KPI_TONE; label: string; value: string; sub: ReactNode; href?: string; onClick?: () => void; zero?: boolean }) {
  const k = KPI_TONE[zero ? "neutral" : tone];
  // Phones: one compact row (about 44px): the label over its line, the figure on the right (no icon there,
  // so the labels fit whole; the figure keeps the tone colour).
  // From sm: the icon beside label, figure and line, stacked.
  const body = (
    <>
      <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl max-sm:hidden", k.tile)} aria-hidden="true">
        <Icon size={20} strokeWidth={2} className="max-sm:size-[13px]" />
      </span>
      <span className="min-w-0 flex-1 max-sm:contents">
        <span className="block truncate text-[12.5px] font-medium text-muted max-sm:col-start-1 max-sm:row-start-1 max-sm:self-end max-sm:text-[11px] max-sm:leading-[14px] max-sm:font-semibold max-sm:tracking-[-0.01em] max-sm:text-ink">{label}</span>
        <span className={cx("figures block text-[22px] leading-7 font-bold max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:self-center max-sm:text-[17px] max-sm:leading-none", k.n)}>{value}</span>
        <span className="mt-1 block truncate text-[12px] leading-5 whitespace-nowrap text-muted max-sm:col-start-1 max-sm:row-start-2 max-sm:mt-0 max-sm:self-start max-sm:text-[11px] max-sm:leading-[14px]" title={typeof sub === "string" ? sub : undefined}>{sub}</span>
      </span>
    </>
  );
  const cls = "flex min-w-0 cursor-pointer items-center gap-3.5 rounded-xl border border-line bg-surface pad-tile text-left max-sm:grid max-sm:min-h-11 max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-2 max-sm:gap-y-0 max-sm:rounded-lg max-sm:px-2.5 max-sm:py-1.5 shadow-sm transition-[border-color,box-shadow,translate] hover:border-line-strong/60 hover:shadow-[0_10px_22px_-14px_rgb(var(--accent-rgb)/0.35)] motion-safe:hover:-translate-y-px";
  return href ? <a href={href} className={cls}>{body}</a> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

const foldAll = (open: boolean) => document.querySelectorAll<HTMLDetailsElement>("#respuestas details").forEach((d) => (d.open = open));

type RailTab = "details" | "chat" | "notes";

/** `wideAside`: the aside holds controls (e.g. Download all); on phones it takes its own line under the title. */
function Block({ id, icon: BlockIcon, title, aside, htmlFor, wideAside, children }: { id?: string; icon: LucideIcon; title: string; aside?: ReactNode; htmlFor?: string; wideAside?: boolean; children: ReactNode }) {
  // Phones: each block folds from a chevron in its head (open to start), to move between parts quickly.
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-line bg-surface lg:scroll-mt-24">
      {/* the aside drops under the title when they do not fit side by side (never over it) */}
      {/* Phones: title, a short aside and the fold chevron on one line (a wide aside on its own line below) */}
      <h2 className={cx("flex min-h-[52px] flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line pad-x-card py-3 text-[16px] font-semibold max-sm:min-h-12 max-sm:gap-x-2 max-sm:py-2 max-sm:text-[15px]", !wideAside && "max-sm:flex-nowrap", !open && "max-sm:border-b-0")}>
        <span className="flex min-w-0 shrink-0 items-center gap-2.5 max-sm:flex-1 max-sm:shrink">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <BlockIcon size={15} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="min-w-0 max-sm:truncate">{htmlFor ? <label htmlFor={htmlFor}>{title}</label> : title}</span>
        </span>
        {aside != null && <small className={cx("min-w-0 font-sans text-xs font-medium tracking-normal text-muted", wideAside ? "max-sm:order-3 max-sm:basis-full" : "max-sm:shrink-0")}>{aside}</small>}
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={title} className="-mr-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted hover:bg-sunk hover:text-ink max-sm:order-2 sm:hidden">
          <ChevronDown size={17} className={cx("transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </h2>
      <div className={cx("flex flex-col gap-4 pad-card max-sm:gap-3", !open && "max-sm:hidden")}>{children}</div>
    </section>
  );
}

const STATUS_ICON: Record<Status, LucideIcon> = { borrador: PencilLine, enviado: Send, revision: Eye, listo: CircleCheck };

/** One card of the side panel: optional title with its icon (and a figure on the right), then its rows. */
/** Whether the side panel stands beside the case (from 1180px); `null` until mounted. */
function useWideRail() {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1180px)");
    const on = () => setWide(mq.matches);
    const raf = requestAnimationFrame(on);
    mq.addEventListener("change", on);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", on);
    };
  }, []);
  return wide;
}

/**
 * One card of the side panel: optional title with its icon (and a figure on the right), then its rows.
 * Below 1180px, where the panel sits under the case, a titled card folds: its head is a button and
 * the rows open on demand, so the page stays short on phones.
 */
function RailCard({ title, icon: Icon, aside, children }: { title?: string; icon?: LucideIcon; aside?: ReactNode; children: ReactNode }) {
  const wide = useWideRail();
  const head = (
    <>
      {Icon && <span className="grid size-6 place-items-center rounded-md bg-accent-soft text-accent"><Icon size={13} strokeWidth={2.1} aria-hidden="true" /></span>}
      <span className="flex-1">{title}</span>
      {aside}
    </>
  );
  if (title && wide === false)
    return (
      <details className="group min-w-0 rounded-2xl border border-line bg-surface shadow-sm">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-2 text-[13.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          {head}
          <ChevronDown size={16} className="shrink-0 text-muted motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex flex-col gap-3 border-t border-line px-4 pt-3 pb-4">{children}</div>
      </details>
    );
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface pad-card shadow-sm">
      {title && <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">{head}</h3>}
      {children}
    </section>
  );
}

/** A label and its value (a tag) on one line inside a side-panel card. */
function RailRow({ label, divided, children }: { label: string; divided?: boolean; children: ReactNode }) {
  return (
    <div className={cx("flex items-center justify-between gap-3 text-[13px]", divided && "border-t border-line pt-3")}>
      <span className="min-w-0 truncate text-muted">{label}</span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[12px] font-medium text-muted">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function NavBtn({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  const cls = "grid size-8 place-items-center rounded-lg border border-transparent bg-accent-soft text-sm text-accent";
  if (!href)
    return (
      <span className={cx(cls, "opacity-35")} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  return (
    <Link href={href} aria-label={label} title={label} className={cx(cls, "hover:bg-accent-soft-hover")}>
      {children}
    </Link>
  );
}
