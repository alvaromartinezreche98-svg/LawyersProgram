"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CalendarClock, Check, ChevronDown, ChevronRight, CircleCheck, ClipboardList, FileText, MessageCircle, PenLine, Send, type LucideIcon } from "lucide-react";
import { SCHEMA, REVIEW_SLUG, SIGN_SLUG } from "@/lib/questionnaire/schema";
import { collectDocs, overall, progressOf, sectionState } from "@/lib/questionnaire/progress";
import { signingDone } from "@/lib/data/legal";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { clientName, openTasks, unreadFor, useAppState } from "@/lib/data/store";
import { awaitingApproval, resultApproved } from "@/lib/data/types";
import { useFileUrl } from "@/lib/data/files";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtDayMonth, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Badge, ButtonLink, EmptyState, Pill, ProgressBar, cx } from "@/components/ui/primitives";
import { StepDot } from "@/components/ui/progress";
import { useClientExp } from "./client-shell";
import { AP_TONE } from "./client-appointment";
import { ClientTasks, hrefOf } from "./client-tasks";
import h from "./client-home.module.scss";
import { FirmEmblem } from "@/components/ui/firm-mark";

/** Initials for the gestoría's mark ("Gestoría Turia" → "GT"). */
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "G";

type Kind = "approval" | "request" | "message" | "plain" | "sent" | "resolved";
interface Task {
  key: string;
  kind: Kind;
  icon: LucideIcon | null;
  label: string;
  title: string;
  meta?: string;
  href: string;
}

/**
 * C2 · Inicio (design system › Screens › Client home). "Lo siguiente" leads
 * with the single most useful action, in this order: conformidad, a request
 * from the gestoría, an unread message, then the client's own unfinished work.
 * "Para hacer" lists the rest; "Su declaración" lists every section; the side
 * column says where the case is and who the gestoría is.
 */
export function ClientHome() {
  const exp = useClientExp();
  const { firm } = useAppState();
  const { t, tr, locale, status } = useI18n();
  const [showDone, setShowDone] = useState(false);
  const a = exp.answers;
  const firmName = firm.name.trim() || t.home.yourFirm;
  const mark = initials(firmName);
  const sections = SCHEMA.map((s) => ({ s, p: progressOf(s.fields, a) })).map((x) => ({ ...x, st: sectionState(x.p) }));
  const ov = overall(a);
  const open = sections.filter((x) => x.st !== "done");
  const docs = collectDocs(a);
  const missing = docs.filter((d) => !d.files.length).length;
  const unread = unreadFor(exp, "cliente");
  const lastFromFirm = [...exp.chat].reverse().find((m) => m.from === "gestor" && !m.sys);
  const tasks = openTasks(exp);
  // Phones: the stage track scrolls sideways; bring the current stage into view (centred) on arrival.
  const trackRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = trackRef.current;
    const on = el?.querySelector<HTMLElement>("[aria-current=step]");
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    const a = on.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    el.scrollTo({ left: el.scrollLeft + a.left - b.left - (b.width - a.width) / 2 });
  }, []);
  const requested = new Set(tasks.map((x) => x.target?.section).filter(Boolean));
  const first = clientName(exp).split(" ")[0];
  const sent = exp.status !== "borrador";
  const approval = FEATURES.resultApproval && awaitingApproval(exp) && exp.result ? exp.result : null;
  const toSign = FEATURES.signing && !signingDone(exp, firm);
  const today = new Date().toISOString().slice(0, 10);
  const nextAp = FEATURES.appointments ? (exp.appointments ?? []).filter((x) => x.status !== "cancelada" && x.date >= today).sort((x, y) => x.date.localeCompare(y.date))[0] : undefined;
  const fee = FEATURES.payments ? feeFor(exp, firm) : null;

  // Everything that is waiting, most urgent first; the first one leads the page.
  const list: Task[] = [];
  if (approval) list.push({ key: "approval", kind: "approval", icon: PenLine, label: t.home.pendingApproval, title: `${t.result.kind[approval.kind]} ${approval.amount} €`, meta: t.home.resultMeta(approval.version, fmtDayMonth(approval.sentAt)), href: "/resultado" });
  for (const x of tasks)
    list.push({ key: x.id, kind: "request", icon: FileText, label: t.home.requestWho, title: tr(x.text), meta: [x.target && tr(SCHEMA.find((s) => s.slug === x.target!.section)?.short ?? { es: "", en: "" }), t.tasks.askedOn(fmtTime(x.createdAt, locale))].filter(Boolean).join(" · "), href: hrefOf(x) });
  if (toSign) list.push({ key: "sign", kind: "request", icon: PenLine, label: t.home.signKind, title: t.home.signTask, href: `/declaracion/${SIGN_SLUG}` });
  if (unread && lastFromFirm) list.push({ key: "unread", kind: "message", icon: MessageCircle, label: t.home.unreadKind, title: lastFromFirm.text ? `«${lastFromFirm.text.length > 90 ? lastFromFirm.text.slice(0, 88) + "…" : lastFromFirm.text}»` : `${t.chat.attach}: ${lastFromFirm.files?.map((f) => f.name).join(", ") ?? ""}`, meta: `${firmName} · ${fmtTime(lastFromFirm.at, locale)}`, href: "/mensajes" });
  // Requests the client answered stay listed until the gestoría checks them; resolved ones for two weeks.
  const nowMs = new Date(today).getTime();
  const recent = (iso?: string) => !!iso && nowMs - Date.parse(iso) < 15 * 864e5;
  for (const x of exp.tasks ?? []) {
    if (x.doneAt && !x.closedAt) list.push({ key: x.id, kind: "sent", icon: CircleCheck, label: t.home.answeredKind, title: tr(x.text), meta: [t.home.answeredMeta, x.reply].filter(Boolean).join(" · "), href: hrefOf(x) });
    else if (x.closedAt && recent(x.closedAt)) list.push({ key: x.id, kind: "resolved", icon: CircleCheck, label: t.home.resolvedKind, title: tr(x.text), href: hrefOf(x) });
  }
  if (open.length) list.push({ key: "continue", kind: "plain", icon: ClipboardList, label: t.home.continueKind, title: t.home.openSections(open.length), meta: open.map((x) => tr(x.s.short)).join(" · "), href: `/declaracion/${open[0].s.slug}` });
  else if (!sent) list.push({ key: "send", kind: "plain", icon: Send, label: t.home.continueKind, title: t.home.readyToSend, href: `/declaracion/${REVIEW_SLUG}` });
  // Answered or resolved requests never lead the page: they are information, not a next step.
  const actionable = list.filter((x) => x.kind !== "sent" && x.kind !== "resolved");
  const lead = actionable[0];
  // "Sections to finish" is the "Su declaración" list itself, so it only appears as the lead, never again under "Para hacer".
  const rest = list.filter((x) => x !== lead && x.key !== "continue");
  const leadTask = lead?.kind === "request" ? tasks.find((x) => x.id === lead.key) : undefined;

  // Five distinct stages, each from its own data: never one blended percentage.
  const pendingAnswers = sections.reduce((n, x) => n + (x.p.total - x.p.done), 0);
  const tr_ = t.home.track;
  const stages: Stage[] = [
    {
      key: "questionnaire",
      state: open.length ? "now" : "done",
      fact: open.length ? tr_.qLeft(sections.length - open.length, sections.length, pendingAnswers) : tr_.qDone(sections.length),
      href: open.length ? `/declaracion/${open[0].s.slug}` : `/declaracion/${REVIEW_SLUG}`,
    },
    {
      key: "documents",
      state: !docs.length ? "todo" : missing ? "now" : "done",
      fact: !docs.length ? tr_.dNone : missing ? tr_.dMissing(missing, docs.length - missing) : tr_.dAll(docs.length),
      href: "/documentos",
    },
    {
      key: "review",
      state: exp.status === "listo" || !!exp.result ? "done" : exp.status === "borrador" ? "todo" : "now",
      fact: exp.status === "listo" || !!exp.result ? tr_.rDone : exp.status === "borrador" ? tr_.rWait : exp.status === "enviado" ? tr_.rReceived : tr_.rDoing,
    },
    ...(FEATURES.resultApproval
      ? [
          {
            key: "approval" as const,
            state: resultApproved(exp) ? ("done" as const) : approval ? ("now" as const) : ("todo" as const),
            fact: resultApproved(exp) && exp.result?.approval ? tr_.aDone(fmtDayMonth(exp.result.approval.approvedAt)) : approval ? tr_.aNow : tr_.aWait,
            href: exp.result ? "/resultado" : undefined,
          },
        ]
      : []),
    { key: "filing", state: exp.status === "listo" ? "now" : "todo", fact: exp.status === "listo" ? tr_.fReady : tr_.fWait },
  ];
  const current = [...stages].reverse().find((x) => x.state === "now");
  const resumeSlug = open.find((x) => !requested.has(x.s.slug))?.s.slug;
  const doneN = sections.filter((x) => x.st === "done" && !requested.has(x.s.slug)).length;

  return (
    <div className={h.home}>
      <PageTitle>{t.titles.home}</PageTitle>

      <header className={h.header}>
        <p className={cx("eyebrow-tag", h.eyebrow)}>
          {t.home.eyebrow(exp.ejercicio)} · {firmName}
        </p>
        <h1 className={h.title}>{first ? t.home.hello(first) : t.titles.home}</h1>
        {current && <p className={h.statusLine}>{tr_.now(tr_.name[current.key])}</p>}
      </header>

      <div className={h.layout}>
        <div className={h.main}>
          {/* 1 · Lo siguiente: the one thing to do now */}
          {!lead ? (
            <EmptyState icon={CircleCheck} tone="ok" title={t.home.allClear} />
          ) : lead.kind === "approval" && approval ? (
            <section aria-labelledby="nx" className={h.lead} data-kind="approval">
              <p className={h.leadKind}>
                <PenLine size={15} aria-hidden="true" />
                {t.home.pendingApproval}
              </p>
              <h2 id="nx" className={h.leadTitle}>{t.home.readyTitle}</h2>
              <div>
                <p className={h.leadMeta}>{t.home.resultMeta(approval.version, fmtDayMonth(approval.sentAt))}</p>
                <p className={h.amount}>{t.result.kind[approval.kind]} {approval.amount} €</p>
              </div>
              <p className={h.leadBody}>{t.home.approvalBody(firmName)}</p>
              <p className={h.leadNote}>{t.result.notFiling}</p>
              <div className={h.actions}>
                <ButtonLink href="/resultado" variant="primary" size="lg">{t.home.approveCta}<ArrowRight size={18} aria-hidden="true" /></ButtonLink>
                <ButtonLink href="/mensajes" size="lg"><MessageCircle size={17} aria-hidden="true" />{t.home.doubts}</ButtonLink>
              </div>
            </section>
          ) : lead.kind === "request" && leadTask && !leadTask.target?.field ? (
            // A general request is answered here, with an optional comment.
            <div id="peticiones" className="scroll-mt-24"><ClientTasks exp={exp} /></div>
          ) : (
            <section aria-labelledby="nx" className={h.lead} data-kind={lead.kind}>
              <p className={h.leadKind}>
                {lead.kind === "request" ? <FirmMark mark={mark} /> : lead.icon && <lead.icon size={15} aria-hidden="true" />}
                {lead.label}
                {leadTask && <time className={h.leadTime}>{fmtDayMonth(leadTask.createdAt)}</time>}
              </p>
              <h2 id="nx" className={h.leadTitle}>{lead.title}</h2>
              {lead.meta && <p className={h.leadMeta}>{lead.meta}</p>}
              <div className={h.actions}>
                <ButtonLink href={lead.href} variant="primary" size="lg">
                  {lead.kind === "request" && leadTask?.target?.kind === "docs" ? t.home.uploadIt : lead.kind === "request" ? t.home.goField : lead.kind === "message" ? t.home.readReply : lead.key === "continue" ? t.home.continue(tr(open[0].s.short)) : t.home.review}
                  <ArrowRight size={18} aria-hidden="true" />
                </ButtonLink>
                {lead.kind === "request" && leadTask?.target?.kind === "docs" && <ButtonLink href={lead.href} size="lg">{t.upload.notYet}</ButtonLink>}
              </div>
              {/* Nothing requested: one quiet line here instead of an empty "Para hacer" section */}
              {!tasks.length && !rest.length && <p className={h.leadQuiet}><CircleCheck size={15} aria-hidden="true" />{t.home.noRequests}</p>}
            </section>
          )}

          {/* 2 · Where the return is: five stages, each with its own fact */}
          <section aria-labelledby="track" className={h.trackWrap}>
            <h2 id="track" className={h.sectionTitle}>{tr_.label}</h2>
            <ol ref={trackRef} className={h.track}>
              {stages.map((x) => {
                const body = (
                  <>
                    <span className={h.marker} aria-hidden="true">{x.state === "done" && <Check size={13} strokeWidth={3} />}</span>
                    <span className={h.stageName}>
                      {tr_.name[x.key]}
                      <span className="sr-only"> · {tr_.state[x.state]}</span>
                    </span>
                    <span className={h.stageFact}>{x.fact}</span>
                  </>
                );
                return (
                  <li key={x.key} className={h.stage} data-state={x.state} aria-current={x === current ? "step" : undefined}>
                    {x.href ? <Link href={x.href} className={h.stageLink}>{body}</Link> : <div className={h.stageLink}>{body}</div>}
                  </li>
                );
              })}
            </ol>
            {/* Phones: the stepper shows names only; the current stage's fact is written here once */}
            {current && <p className={h.currentFact}><b>{tr_.name[current.key]}</b> · {current.fact}</p>}
            {sent && <p className={h.trackNote}>{t.home.sentBody(status(exp.status))}</p>}
          </section>

          {/* 3 · Waiting for you: requests, messages, answered and resolved items */}
          {rest.length > 0 && (
            <section aria-labelledby="todo" className={h.block}>
              <div className={h.blockHead}>
                <h2 id="todo" className={h.sectionTitle}>{t.home.todo}</h2>
                <span className={h.count}>{t.home.things(rest.length)}</span>
              </div>
              <ul className={h.list}>
                {rest.map((x) => <TaskRow key={x.key} task={x} />)}
              </ul>
            </section>
          )}

          {/* 4 · The questionnaire, section by section */}
          <section aria-labelledby="secs" className={h.block}>
            <div className={h.blockHead}>
              <h2 id="secs" className={h.sectionTitle}>{t.home.yourReturn}</h2>
            </div>
            {/* The whole questionnaire in one figure: large, with its bar, so progress reads at a glance */}
            <div className={h.progress}>
              <div className={h.progressTop}>
                <span className={h.progressPct}>{ov.pct}<small>%</small></span>
                <span className={h.progressMeta}>{[t.q.sectionsDone(sections.length - open.length, sections.length), ov.pending > 0 && t.home.answersPending(ov.pending)].filter(Boolean).join(" · ")}</span>
              </div>
              <ProgressBar pct={ov.pct} className="h-2.5! rounded-full" />
            </div>
            <ul className={h.list} id="sec-list">
              {sections.map(({ s, p, st }, i) => {
                const req = requested.has(s.slug);
                const resume = s.slug === resumeSlug;
                // Completed sections fold away by default: the list shows what is left to do.
                if (st === "done" && !req && !showDone) return null;
                return (
                  <SectionRow key={s.slug} href={`/declaracion/${s.slug}`} dot={<StepDot n={i + 1} state={st} />} name={tr(s.short)} tone={req ? "request" : resume ? "resume" : st}>
                    {req ? t.q.requested : resume ? t.home.resumeHere : st === "partial" ? t.q.leftN(p.total - p.done) : t.sectionState[st]}
                  </SectionRow>
                );
              })}
              <SectionRow href={`/declaracion/${REVIEW_SLUG}`} dot={<StepDot state="none" icon={Send} />} name={sent ? t.home.reviewResend : t.home.review} />
            </ul>
            {doneN > 0 && (
              <button type="button" aria-expanded={showDone} aria-controls="sec-list" onClick={() => setShowDone(!showDone)} className={h.foldBtn}>
                <ChevronDown size={15} className={cx("motion-safe:transition-transform", showDone && "rotate-180")} aria-hidden="true" />
                {showDone ? t.home.hideDone : t.home.showDone(doneN)}
              </button>
            )}
          </section>
        </div>

        {/* Side column: who is preparing the return */}
        <aside className={h.aside}>
          <section className={h.firm} aria-labelledby="firm">
            <h2 id="firm" className={cx("t-label", h.asideLabel)}>{t.home.yourFirm}</h2>
            <div className={h.firmId}>
              <FirmLogo />
              <div className={h.firmText}>
                <p className={h.firmName}>{firmName}</p>
                <p className={h.firmMeta}>
                  {[firm.address, exp.assignee && firm.team.find((m) => m.id === exp.assignee)?.name && t.home.attends(firm.team.find((m) => m.id === exp.assignee)!.name)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className={h.firmActions}>
              <ButtonLink href="/mensajes" className="w-full">
                <MessageCircle size={16} aria-hidden="true" />
                {t.home.write}
                {unread > 0 && <Badge n={unread} />}
              </ButtonLink>
              {FEATURES.appointments && <ButtonLink href="/cita" variant="ghost" className="w-full"><CalendarClock size={16} aria-hidden="true" />{t.home.bookCall}</ButtonLink>}
            </div>
            {nextAp && (
              <Link href="/cita" className={h.appointment}>
                <span className={h.apHead}>
                  <b>{t.home.nextAp}</b>
                  <Pill tone={AP_TONE[nextAp.status]}>{t.cita.status[nextAp.status]}</Pill>
                </span>
                <span className="figures">{t.cita.kind[nextAp.kind]} · {t.cita.when(fmtDate(nextAp.date), t.cita.slot[nextAp.slot], nextAp.time)}</span>
              </Link>
            )}
            {FEATURES.payments && (
              <dl className={h.fees}>
                <dt>{t.home.fees}</dt>
                <dd className={cx("figures", !fee && h.mutedText)}>{fee ? fmtEuros(fee.total, locale) : t.home.feesNone}</dd>
              </dl>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

type Stage = { key: "questionnaire" | "documents" | "review" | "approval" | "filing"; state: "done" | "now" | "todo"; fact: string; href?: string };

/** The gestoría's voice: its initials on copper. */
function FirmMark({ mark }: { mark: string }) {
  return <span className="grid size-7 place-items-center rounded-full bg-copper text-[12px] font-semibold text-surface" aria-hidden="true">{mark}</span>;
}

/** The gestoría's logo from Ajustes › Despacho, or a labelled slot until it is uploaded. */
function FirmLogo() {
  const { firm } = useAppState();
  const url = useFileUrl(firm.logo);
  if (url)
    // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
    return <img src={url} alt="" className="size-10 shrink-0 rounded-md border border-line object-contain" />;
  return <FirmEmblem size={40} className="shrink-0" />;
}


function TaskRow({ task: x }: { task: Task }) {
  return (
    <li>
      <Link href={x.href} className={h.row} data-kind={x.kind}>
        <span className={h.rowMain}>
          <span className={h.rowKind}>{x.label}</span>
          <span className={h.rowTitle}>{x.title}</span>
          {x.meta && <span className={h.rowMeta}>{x.meta}</span>}
        </span>
        <ChevronRight size={18} className={h.chev} aria-hidden="true" />
      </Link>
    </li>
  );
}

function SectionRow({ href, dot, name, tone, children }: { href: string; dot: ReactNode; name: string; tone?: string; children?: ReactNode }) {
  return (
    <li>
      <Link href={href} className={h.secRow} data-tone={tone}>
        {dot}
        <span className={h.secName}>{name}</span>
        <span className={h.secState}>{children}</span>
        <ChevronRight size={16} className={h.chev} aria-hidden="true" />
      </Link>
    </li>
  );
}
