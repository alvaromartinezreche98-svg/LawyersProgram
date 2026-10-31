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
import { FileChip } from "@/components/ui/file-chip";
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

const ALERT_PILL = { bad: "bad", warn: "warn", info: "info" } as const;
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
  const tt = overall(a);
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
        <aside id="chat" aria-label={p.rail.label} className="order-2 scroll-mt-28 border-t border-line min-[1180px]:sticky min-[1180px]:top-12 min-[1180px]:flex min-[1180px]:max-h-[calc(100dvh-74px)] min-[1180px]:flex-col min-[1180px]:border-t-0 min-[1180px]:border-l">
          <div role="tablist" aria-label={p.rail.label} className="flex gap-1 border-b border-line bg-surface px-4 py-2 sm:px-6">
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

          <div id="rail-panel" role="tabpanel" aria-labelledby={`rail-${tab}`} className={cx("thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5", tab === "details" && "bg-sunk/50")}>
            {tab === "details" && (
              <>
                {/* Inspector: the case's facts in separate cards, the actions last. */}
                <div className="grid gap-3 sm:max-[1179px]:grid-cols-2">
                  {/* Status and who handles it */}
                  <RailCard>
                    <Prop label={t.file.status}>
                      <Select
                        id="st-sel"
                        aria-label={t.file.status}
                        value={e.status}
                        onChange={(v) => actions.setStatus(e.id, v as Status)}
                        buttonClassName="h-10 rounded-lg px-3 text-sm font-medium"
                        options={STATUSES.map((s) => ({ value: s.id, label: tr(s.label), icon: STATUS_ICON[s.id] }))}
                      />
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
                <div className="overflow-clip rounded-xl border border-line">
                  <ChatBox exp={e} side="gestor" height="h-[min(520px,calc(100dvh-330px))] min-h-[280px]" />
                </div>
              </div>
            )}

            {tab === "notes" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor={"notes-" + e.id} className="flex items-center gap-2 text-[14px] font-semibold">
                    <LockKeyhole size={15} className="text-accent" aria-hidden="true" />
                    {t.file.notes}
                  </label>
                  <p className="mt-0.5 text-[12.5px] text-muted">{t.file.notesAside}</p>
                </div>
                <textarea id={"notes-" + e.id} rows={8} value={e.notes} onChange={(ev) => actions.setNotes(e.id, ev.target.value)} placeholder={t.file.notesPh} className="field bg-neutral-soft py-2" />
                <div className="rounded-lg bg-sunk px-3.5 py-3 text-[13px]">
                  <b className="block text-ink">{t.file.fromClient.trim()}</b>
                  <span className="text-muted">{typeof a.obs === "string" && a.obs ? a.obs : p.rail.fromClientNone}</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="order-1 flex w-full min-w-0 flex-col gap-6 px-4 py-5 sm:px-6 xl:py-6">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="display-serif text-[clamp(24px,2.4vw,28px)] leading-tight font-semibold break-words">{name}</h1>
              <StatusPill status={e.status} />
              {waiting && <WaitingLabel who={waiting} />}
            </div>
            <p className="text-[14px] text-muted">
              {[e.sentAt && t.home.sentOn(fmtTime(e.sentAt, locale)), t.q.sectionsDone(SCHEMA.length - openSecs, SCHEMA.length), tt.pending > 0 && t.home.answersPending(tt.pending), t.file.docsAside(nDocs, nPend)].filter(Boolean).join(" · ")}
            </p>
          </header>
          {/* Tabs: one part of the case at a time instead of one long page; chat and notes are in the side panel. */}
          <div role="tablist" aria-label={t.file.tabs.label} className="no-scrollbar sticky top-[104px] z-[9] -mx-4 -mt-2 flex gap-1.5 overflow-x-auto border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-12">
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

          <div id="main-panel" role="tabpanel" aria-labelledby={`main-${main}`} className="flex flex-col gap-6">
          {main === "overview" && (
            <>
              {/* The case at a glance: four figures, each a way into its tab */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Kpi icon={ListChecks} tone={tt.pct === 100 ? "ok" : "info"} label={t.file.kpi.questionnaire} value={`${tt.pct} %`} sub={t.q.sectionsDone(SCHEMA.length - openSecs, SCHEMA.length)} onClick={() => setMain("answers")} />
                <Kpi icon={FileText} tone={nPend ? "warn" : "ok"} label={t.file.kpi.docs} value={String(nDocs)} sub={t.file.kpi.docsOf(nDocs, nPend)} onClick={() => setMain("docs")} />
                <Kpi icon={TriangleAlert} tone={alBad ? "bad" : alWarn ? "warn" : al.length ? "info" : "ok"} zero={!al.length} label={t.file.kpi.alerts} value={String(al.length)} sub={al.length ? (["bad", "warn", "info"] as const).map((lv) => [lv, al.filter((x) => x.level === lv).length] as const).filter(([, n]) => n > 0).map(([lv, n]) => `${n} ${t.file.alertLevel[lv].toLowerCase()}`).join(" · ") : t.file.kpi.none} href="#avisos" />
                <Kpi icon={ClipboardList} tone={openTasks(e).length ? "copper" : "neutral"} zero={!openTasks(e).length} label={t.file.kpi.requests} value={String(openTasks(e).length)} sub={tasksToCheck(e).length ? t.tasks.aside(openTasks(e).length, tasksToCheck(e).length) : t.file.kpi.none} href="#peticiones" />
              </div>


          <Block id="avisos" icon={TriangleAlert} title={t.file.alerts} aside={al.length || undefined}>
            <p className="-mt-1 text-[13px] text-muted">
              <span className="font-medium">{t.file.auto}.</span> {t.file.suggest}
            </p>
            {al.length ? (
              <ul className="flex flex-col gap-1.5">
                {al.map((x, i) => {
                  const Icon = ALERT_ICON[x.level];
                  return (
                    <li key={i} className="flex flex-col gap-2 border-t border-line py-3 first:border-t-0 first:pt-0">
                      <span className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                        <Tooltip title={t.file.alertHelp[x.level].title} text={t.file.alertHelp[x.level][x.target.kind === "docs" ? "docs" : "answers"]}>
                          <Pill tone={ALERT_PILL[x.level]} icon={Icon}>{t.file.alertLevel[x.level]}</Pill>
                        </Tooltip>
                        <span className="min-w-0 flex-1 basis-[16rem] text-[15px] leading-[22px]">{tr(x.text)}</span>
                      </span>
                      <span className="text-[13px] text-muted">{[SCHEMA.find((s) => s.slug === x.target.section) && tr(SCHEMA.find((s) => s.slug === x.target.section)!.short), t.file.auto.toLowerCase()].filter(Boolean).join(" · ")}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <ButtonLink href={x.target.kind === "docs" ? "#documentos" : `#sec-${x.target.section}`} size="sm">
                          {x.target.kind === "docs" ? t.file.goDocs : t.file.goAnswer}
                        </ButtonLink>
                        <AskButton exp={e} text={x.text} target={x.target} />
                        {FEATURES.requestTracking && (
                          <Button size="sm" variant="ghost" onClick={() => actions.reviewAlert(e.id, x.text.es, x.text, true)}>
                            <Check size={14} aria-hidden="true" />
                            {t.file.review}
                          </Button>
                        )}
                      </span>
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
                      <span className="min-w-0 flex-1 line-through decoration-line-strong">{tr(x.text)}</span>
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
            <Block id="cambios" icon={GitCompareArrows} title={t.changes.title} aside={t.changes.aside}>
              <SendChanges exp={e} />
            </Block>
          )}

          <Block id="peticiones" icon={ClipboardList} title={t.tasks.title} aside={FEATURES.requestTracking ? t.tasks.aside(openTasks(e).length, tasksToCheck(e).length) : undefined}>
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
            <div className="flex flex-col gap-3">
              {SCHEMA.map((s, i) => {
                const pr = progressOf(s.fields, a);
                const st = sectionState(pr);
                // Only sections with questions still open start unfolded: complete and empty ones stay folded.
                return (
                  <details key={s.slug} id={`sec-${s.slug}`} open={st === "partial"} className={cx("group scroll-mt-[124px] rounded-xl border bg-surface transition-colors open:shadow-sheet", st === "partial" ? "border-copper/30" : "border-line")}>
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors hover:bg-hover/60 [&::-webkit-details-marker]:hidden">
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
                    <dl className="grid gap-x-8 border-t border-line px-4 pt-1 pb-4 md:grid-cols-2">
                      <AnswersSummary fields={s.fields} scope={a} layout="grid" />
                    </dl>
                  </details>
                );
              })}
            </div>
          </Block>

          )}

          {main === "docs" && (
          <Block id="documentos" icon={FileText} title={t.file.docs} aside={<span className="flex flex-wrap items-center gap-3">{t.file.docsAside(nDocs, nPend)}<DownloadAll exp={e} /></span>}>
            {docs.length ? (
              <div className="@container -mx-4 -my-4">
                <div className="table-head hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_minmax(0,1.2fr)] gap-4 @2xl:grid">
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
                      <li key={i} className="grid gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 text-[14px] first:border-t-0 @2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_minmax(0,1.2fr)] @2xl:items-center">
                        <span className="font-medium">{tr(d.label)}</span>
                        <span className="text-[13px] text-muted">{[sec && tr(sec.short), d.context && tr(d.context)].filter(Boolean).join(" · ")}</span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {d.files.length ? <Pill tone="ok" icon={Check}>{t.upload.done}</Pill> : later ? <Pill icon={Clock}>{t.file.laterBadge}</Pill> : <Pill tone="bad" icon={CircleAlert}>{t.common.missing}</Pill>}
                          {!d.files.length && isAsked(e, docTask(d.label, d.context)) && <Pill tone="copper" icon={Clock}>{t.tasks.state.open}</Pill>}
                        </span>
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {d.files.map((f) => <FileChip key={f.id} file={f} />)}
                          {!d.files.length && later?.note && <span className="text-[13px] text-muted">«{later.note}»</span>}
                          {!d.files.length && <AskButton exp={e} text={docTask(d.label, d.context)} target={{ section: d.section, kind: "docs", field: d.field, item: d.item }} />}
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
            <Block id="actividad" icon={History} title={t.activity.title} aside={t.activity.aside(e.activity?.length ?? 0)}>
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
const KPI_TONE = {
  bad: { tile: "bg-bad text-white", card: "border-bad/35 bg-[linear-gradient(135deg,var(--bad-soft),var(--surface)_70%)]", n: "text-bad" },
  warn: { tile: "bg-warn-soft text-warn", card: "border-warn/35 bg-[linear-gradient(135deg,var(--warn-soft),var(--surface)_70%)]", n: "text-warn" },
  copper: { tile: "bg-copper-soft text-copper-text", card: "border-copper/35 bg-[linear-gradient(135deg,var(--copper-soft),var(--surface)_70%)]", n: "text-copper-text" },
  ok: { tile: "bg-ok-soft text-ok", card: "border-ok/25 bg-surface", n: "text-ok" },
  info: { tile: "bg-info-soft text-info", card: "border-line bg-surface", n: "text-ink" },
  accent: { tile: "bg-icon-soft text-icon", card: "border-line bg-surface", n: "text-ink" },
  neutral: { tile: "bg-sunk text-muted", card: "border-line bg-surface", n: "text-disabled" },
} as const;

function Kpi({ icon: Icon, tone, label, value, sub, href, onClick, zero }: { icon: LucideIcon; tone: keyof typeof KPI_TONE; label: string; value: string; sub: string; href?: string; onClick?: () => void; zero?: boolean }) {
  const k = KPI_TONE[zero ? "neutral" : tone];
  const body = (
    <>
      <span className={cx("grid size-10 shrink-0 place-items-center rounded-lg", k.tile)} aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium text-muted">{label}</span>
        <span className={cx("figures block text-[22px] leading-7 font-bold", k.n)}>{value}</span>
        <span className="block truncate text-[12.5px] text-muted">{sub}</span>
      </span>
    </>
  );
  const cls = cx("flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left shadow-sheet transition-[border-color,box-shadow,translate] hover:shadow-[0_10px_22px_-14px_rgb(var(--accent-rgb)/0.35)] motion-safe:hover:-translate-y-px", k.card);
  return href ? <a href={href} className={cls}>{body}</a> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

const foldAll = (open: boolean) => document.querySelectorAll<HTMLDetailsElement>("#respuestas details").forEach((d) => (d.open = open));

type RailTab = "details" | "chat" | "notes";

function Block({ id, icon: BlockIcon, title, aside, htmlFor, children }: { id?: string; icon: LucideIcon; title: string; aside?: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-line bg-surface lg:scroll-mt-24">
      <h2 className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3 text-[16px] font-semibold">
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent">
            <BlockIcon size={15} strokeWidth={2} aria-hidden="true" />
          </span>
          {htmlFor ? <label htmlFor={htmlFor}>{title}</label> : title}
        </span>
        {aside != null && <small className="font-sans text-xs font-medium tracking-normal text-muted">{aside}</small>}
      </h2>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </section>
  );
}

const STATUS_ICON: Record<Status, LucideIcon> = { borrador: PencilLine, enviado: Send, revision: Eye, listo: CircleCheck };

/** One card of the side panel: optional title with its icon (and a figure on the right), then its rows. */
function RailCard({ title, icon: Icon, aside, children }: { title?: string; icon?: LucideIcon; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      {title && (
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          {Icon && <span className="grid size-6 place-items-center rounded-md bg-accent-soft text-accent"><Icon size={13} strokeWidth={2.1} aria-hidden="true" /></span>}
          <span className="flex-1">{title}</span>
          {aside}
        </h3>
      )}
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
