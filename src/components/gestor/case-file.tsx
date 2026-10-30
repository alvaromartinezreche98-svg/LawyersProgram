"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Check, ChevronDown, CircleAlert, Clock, GitCompareArrows, ClipboardList, FileCheck2, History, FileText, Info, ListChecks, LockKeyhole, MessageCircle, TriangleAlert, type LucideIcon } from "lucide-react";
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
import { Button, ButtonLink, Pill, StatusPill, cx } from "@/components/ui/primitives";
import { StepDot } from "@/components/ui/progress";
import { WaitingLabel } from "./case-list";
import { TopBar } from "./gestor-shell";
import { alertsOf, triage } from "@/lib/gestor/triage";
import { ResultPanel } from "./result-panel";
import { AskButton, TaskPanel, isAsked } from "./task-panel";
import { ActivityLog } from "./activity-log";
import { SendChanges, hasSendChanges } from "./send-changes";
import { L, textIn, type Text } from "@/lib/i18n";
import { LEGAL_KINDS, signState } from "@/lib/data/legal";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { casesOfClient } from "@/lib/data/years";
import { SIGN_TONE } from "@/components/client/sign-step";

const ALERT_PILL = { bad: "bad", warn: "warn", info: "info" } as const;
const ALERT_ICON = { bad: CircleAlert, warn: TriangleAlert, info: Info } as const;
const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** G3 · Ficha del expediente: content in the middle, properties on the right, ↑/↓ to move between cases. */
export function CaseFile({ id }: { id: string }) {
  const { exps, firm } = useAppState();
  const { t, tr, locale } = useI18n();
  const router = useRouter();
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
  const loaded = !!e;
  useEffect(() => {
    if (!loaded) return;
    const jump = () => {
      const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ block: "start" });
    };
    const raf = requestAnimationFrame(jump);
    window.addEventListener("hashchange", jump);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", jump);
    };
  }, [loaded, id]);

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
        <aside className="order-2 border-t border-line px-4 py-5 sm:px-6 min-[1180px]:sticky min-[1180px]:top-12 min-[1180px]:max-h-[calc(100dvh-74px)] min-[1180px]:overflow-y-auto min-[1180px]:border-t-0 min-[1180px]:border-l min-[1180px]:py-6">
          <h2 className="mb-3 text-[13px] font-semibold text-muted">{t.file.properties}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:max-[1179px]:grid-cols-3 min-[1180px]:grid-cols-1">
            <Prop label={t.file.status}>
              <select id="st-sel" aria-label={t.file.status} value={e.status} onChange={(ev) => actions.setStatus(e.id, ev.target.value as Status)} className="h-(--control-h-sm) w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-hidden focus:border-focus focus:ring-1 focus:ring-focus">
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {tr(s.label)}
                  </option>
                ))}
              </select>
            </Prop>
            <Prop label={t.list.assignee}>
              <select aria-label={t.list.assignee} value={e.assignee ?? ""} onChange={(ev) => actions.assign(e.id, ev.target.value || null)} className="h-(--control-h-sm) w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-hidden focus:border-focus focus:ring-1 focus:ring-focus">
                <option value="">{t.list.unassigned}</option>
                {firm.team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Prop>
            <Prop label={t.file.contact}>
              <span className="block truncate text-sm">{typeof a.telefono === "string" && a.telefono ? a.telefono : "—"}</span>
              <span className="block truncate text-sm text-muted">{typeof a.email === "string" && a.email ? a.email : ""}</span>
            </Prop>
            {FEATURES.identityCheck && <Prop label={t.file.identity}>
              <span className={cx("text-sm", e.identityConfirmedAt ? "text-ok" : "text-muted")}>{e.identityConfirmedAt ? t.file.identityOk(fmtTime(e.identityConfirmedAt, locale)) : t.file.identityNo}</span>
            </Prop>}
            {FEATURES.signing && <Prop label={t.file.signatures}>
              <ul className="flex flex-col gap-1">
                {LEGAL_KINDS.map((k) => {
                  const st = signState(e, firm, k);
                  return (
                    <li key={k} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate">{k === "privacy" ? t.settings.legal.privacy : t.settings.legal.mandate}</span>
                      <Pill tone={SIGN_TONE[st]}>{t.sign.state[st]}</Pill>
                    </li>
                  );
                })}
              </ul>
            </Prop>}
            {FEATURES.payments && <Prop label={t.file.payment}>
              {e.payment ? (
                <span className="text-sm text-ok">
                  {fmtEuros(e.payment.amount, locale)} · {t.pay.paid(fmtTime(e.payment.paidAt, locale))}
                </span>
              ) : (
                <span className="text-sm text-muted">{fee ? `${fmtEuros(fee.total, locale)} · ${t.cobros.pending}` : "—"}</span>
              )}
            </Prop>}
            <Prop label={t.file.created}>
              <span className="text-sm">{fmtTime(e.createdAt, locale)}</span>
            </Prop>
          </dl>
          {FEATURES.prefill && <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
            <span className="text-xs text-muted">{t.years.otherYears}</span>
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
          </div>}
          <ButtonLink href={`/expedientes/${e.id}/vista-cliente`} size="sm" className="mt-4 w-full">
            {t.file.viewAsClient}
          </ButtonLink>
          {e.example && <p className="mt-3 text-xs text-muted">{t.file.exampleNote}</p>}
          <p className="mt-4 hidden text-[11.5px] text-muted xl:block">{t.file.keys}</p>
          <div className="mt-6 flex flex-col gap-6 border-t border-line pt-5">
            <Block id="chat" icon={MessageCircle} title={t.file.chat} aside={t.file.chatAside}>
              <div className="overflow-clip rounded-xl border border-line">
                <ChatBox exp={e} side="gestor" height="h-[300px]" />
              </div>
            </Block>

            <Block icon={LockKeyhole} title={t.file.notes} aside={t.file.notesAside} htmlFor={"notes-" + e.id}>
              {typeof a.obs === "string" && a.obs && (
                <p className="mb-2.5 text-[13px] text-muted">
                  <b className="text-ink">{t.file.fromClient}</b>
                  {a.obs}
                </p>
              )}
              <textarea id={"notes-" + e.id} rows={4} value={e.notes} onChange={(ev) => actions.setNotes(e.id, ev.target.value)} placeholder={t.file.notesPh} className="w-full resize-y rounded-md border border-line-strong bg-neutral-soft px-3 py-2 outline-hidden focus:border-focus focus:ring-1 focus:ring-focus" />
            </Block>
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
          <nav aria-label={t.file.anchors.label} className="no-scrollbar sticky top-[104px] z-[9] -mx-4 -mt-3 flex gap-1 overflow-x-auto border-b border-line bg-surface/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-12">
            {([
              ["avisos", t.file.anchors.attention, al.length],
              ["peticiones", t.file.anchors.requests, openTasks(e).length + tasksToCheck(e).length],
              ["respuestas", t.file.anchors.answers, 0],
              ["documentos", t.file.anchors.docs, nPend],
              ["chat", t.file.anchors.chat, unreadFor(e, "gestor")],
              ...(FEATURES.resultApproval ? [["resultado", t.file.anchors.result, 0] as const] : []),
              ...(FEATURES.activityLog ? [["actividad", t.file.anchors.history, 0] as const] : []),
            ] as const).map(([id, label, n]) => (
              <a key={id} href={`#${id}`} className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13.5px] font-medium whitespace-nowrap text-muted transition-colors hover:bg-hover hover:text-ink">
                {label}
                {n > 0 && <span className="figures rounded-full bg-copper-soft px-1.5 text-[11.5px] font-semibold text-copper-text">{n}</span>}
              </a>
            ))}
          </nav>

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
                        <Pill tone={ALERT_PILL[x.level]} icon={Icon}>{t.file.alertLevel[x.level]}</Pill>
                        <span className="min-w-0 flex-1 basis-[16rem] text-[15px] leading-[22px]">{tr(x.text)}</span>
                      </span>
                      <span className="text-[13px] text-muted">{[SCHEMA.find((s) => s.slug === x.target.section) && tr(SCHEMA.find((s) => s.slug === x.target.section)!.short), t.file.auto.toLowerCase()].filter(Boolean).join(" · ")}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <ButtonLink href={x.target.kind === "docs" ? "#documentos" : `#sec-${x.target.section}`} size="sm">
                          {x.target.kind === "docs" ? t.file.goDocs : t.file.goAnswer}
                        </ButtonLink>
                        <AskButton exp={e} text={x.text} target={x.target} />
                        <Button size="sm" variant="ghost" onClick={() => actions.reviewAlert(e.id, x.text.es, x.text, true)}>
                          <Check size={14} aria-hidden="true" />
                          {t.file.review}
                        </Button>
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

          <Block id="peticiones" icon={ClipboardList} title={t.tasks.title} aside={t.tasks.aside(openTasks(e).length, tasksToCheck(e).length)}>
            <TaskPanel exp={e} />
          </Block>

          <Block id="respuestas" icon={ListChecks} title={t.file.answers}>
            <div className="-my-2">
              {SCHEMA.map((s, i) => {
                const st = sectionState(progressOf(s.fields, a));
                return (
                  <details key={s.slug} id={`sec-${s.slug}`} open={st !== "empty"} className="group scroll-mt-16 border-t border-line first-of-type:border-t-0">
                    <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 py-2.5 font-semibold [&::-webkit-details-marker]:hidden">
                      <StepDot n={i + 1} state={st} />
                      <span className="min-w-0 flex-1">{tr(s.title)}</span>
                      <span className={cx("text-[13px] font-medium", st === "done" ? "text-ok" : "text-muted")}>{st === "partial" ? t.q.leftN(progressOf(s.fields, a).total - progressOf(s.fields, a).done) : t.sectionState[st]}</span>
                      <ChevronDown size={16} className="text-muted motion-safe:transition-[rotate] motion-safe:duration-200 group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <dl className="mb-3">
                      <AnswersSummary fields={s.fields} scope={a} />
                    </dl>
                  </details>
                );
              })}
            </div>
          </Block>

          <Block id="documentos" icon={FileText} title={t.file.docs} aside={t.file.docsAside(nDocs, nPend)}>
            {docs.length ? (
              <div className="@container -mx-4 -my-4">
                <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_minmax(0,1.2fr)] gap-4 border-b border-line bg-sunk px-4 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase @2xl:grid">
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


          {FEATURES.resultApproval && (
            <Block id="resultado" icon={FileCheck2} title={t.resultG.title}>
              <ResultPanel exp={e} />
            </Block>
          )}

          {FEATURES.activityLog && (
            <Block id="actividad" icon={History} title={t.activity.title} aside={t.activity.aside(e.activity?.length ?? 0)}>
              <ActivityLog exp={e} />
            </Block>
          )}

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

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function NavBtn({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  const cls = "grid size-8 place-items-center rounded-lg border border-line text-sm";
  if (!href)
    return (
      <span className={cx(cls, "opacity-35")} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  return (
    <Link href={href} aria-label={label} title={label} className={cx(cls, "hover:border-line-strong hover:bg-sunk")}>
      {children}
    </Link>
  );
}
