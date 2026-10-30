"use client";

import { FEATURES } from "@/lib/features";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarClock, ChevronRight, CircleCheck, FileText, MessageCircle, PenLine, Send, type LucideIcon } from "lucide-react";
import { SCHEMA, REVIEW_SLUG, SIGN_SLUG } from "@/lib/questionnaire/schema";
import { collectDocs, progressOf, sectionState } from "@/lib/questionnaire/progress";
import { signingDone } from "@/lib/data/legal";
import { feeFor, fmtEuros } from "@/lib/data/fees";
import { clientName, openTasks, unreadFor, useAppState } from "@/lib/data/store";
import { awaitingApproval, resultApproved, type Expediente, type Status } from "@/lib/data/types";
import { useFileUrl } from "@/lib/data/files";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtDayMonth, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, EmptyState, Notice, Pill, cx } from "@/components/ui/primitives";
import { SegMeter, StepDot } from "@/components/ui/progress";
import { useClientExp } from "./client-shell";
import { AP_TONE } from "./client-appointment";
import { ClientTasks, hrefOf } from "./client-tasks";

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
  const a = exp.answers;
  const firmName = firm.name.trim() || t.home.yourFirm;
  const mark = initials(firmName);
  const sections = SCHEMA.map((s) => ({ s, p: progressOf(s.fields, a) })).map((x) => ({ ...x, st: sectionState(x.p) }));
  const open = sections.filter((x) => x.st !== "done");
  const docs = collectDocs(a);
  const missing = docs.filter((d) => !d.files.length).length;
  const uploaded = docs.reduce((n, d) => n + d.files.length, 0);
  const unread = unreadFor(exp, "cliente");
  const lastFromFirm = [...exp.chat].reverse().find((m) => m.from === "gestor" && !m.sys);
  const tasks = openTasks(exp);
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
  if (unread && lastFromFirm) list.push({ key: "unread", kind: "message", icon: MessageCircle, label: t.home.unreadKind, title: `«${lastFromFirm.text.length > 90 ? lastFromFirm.text.slice(0, 88) + "…" : lastFromFirm.text}»`, meta: `${firmName} · ${fmtTime(lastFromFirm.at, locale)}`, href: "/mensajes" });
  // Requests the client answered stay listed until the gestoría checks them; resolved ones for two weeks.
  const nowMs = new Date(today).getTime();
  const recent = (iso?: string) => !!iso && nowMs - Date.parse(iso) < 15 * 864e5;
  for (const x of exp.tasks ?? []) {
    if (x.doneAt && !x.closedAt) list.push({ key: x.id, kind: "sent", icon: CircleCheck, label: t.home.answeredKind, title: tr(x.text), meta: [t.home.answeredMeta, x.reply].filter(Boolean).join(" · "), href: hrefOf(x) });
    else if (x.closedAt && recent(x.closedAt)) list.push({ key: x.id, kind: "resolved", icon: CircleCheck, label: t.home.resolvedKind, title: tr(x.text), href: hrefOf(x) });
  }
  if (open.length) list.push({ key: "continue", kind: "plain", icon: null, label: t.home.continueKind, title: t.home.openSections(open.length), meta: open.map((x) => tr(x.s.short)).join(" · "), href: `/declaracion/${open[0].s.slug}` });
  else if (!sent) list.push({ key: "send", kind: "plain", icon: Send, label: t.home.continueKind, title: t.home.readyToSend, href: `/declaracion/${REVIEW_SLUG}` });
  // Answered or resolved requests never lead the page: they are information, not a next step.
  const actionable = list.filter((x) => x.kind !== "sent" && x.kind !== "resolved");
  const lead = actionable[0];
  const rest = list.filter((x) => x !== lead);
  const leadTask = lead?.kind === "request" ? tasks.find((x) => x.id === lead.key) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.titles.home}</PageTitle>

      <header className="flex flex-col gap-1.5">
        <p className="text-[13px] font-semibold tracking-[.04em] text-copper-text uppercase">
          {t.home.eyebrow(exp.ejercicio)} · {firmName}
        </p>
        <h1 className="display-serif text-[clamp(28px,3vw,36px)] leading-tight font-semibold">{first ? t.home.hello(first) : t.titles.home}</h1>
      </header>

      <div className="grid items-start gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Lo siguiente */}
          {!lead ? (
            <EmptyState icon={CircleCheck} tone="ok" title={t.home.allClear} />
          ) : lead.kind === "approval" && approval ? (
            <section aria-labelledby="nx" className="flex flex-col gap-4 rounded-xl border-2 border-accent bg-surface p-6 sm:p-8">
              <Pill tone="accent" icon={PenLine} className="self-start">{t.home.pendingApproval}</Pill>
              <h2 id="nx" className="text-[22px] leading-[30px] font-semibold">{t.home.readyTitle}</h2>
              <div>
                <p className="text-[13px] text-muted">{t.home.resultMeta(approval.version, fmtDayMonth(approval.sentAt))}</p>
                <p className="figures text-[clamp(26px,3vw,32px)] font-semibold">{t.result.kind[approval.kind]} {approval.amount} €</p>
              </div>
              <p className="max-w-[60ch] text-[17px] leading-[26px]">{t.home.approvalBody(firmName)}</p>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/resultado" variant="primary" size="lg">{t.home.approveCta}<ArrowRight size={18} aria-hidden="true" /></ButtonLink>
                <ButtonLink href="/mensajes" size="lg"><MessageCircle size={17} aria-hidden="true" />{t.home.doubts}</ButtonLink>
              </div>
            </section>
          ) : lead.kind === "request" && leadTask && !leadTask.target?.field ? (
            // A general request is answered here, with an optional comment.
            <div id="peticiones" className="scroll-mt-24"><ClientTasks exp={exp} /></div>
          ) : (
            <section aria-labelledby="nx" className={cx("flex flex-col gap-4 rounded-xl p-6 sm:p-8", lead.kind === "request" ? "bg-copper-soft" : "border border-line bg-surface shadow-sheet")}>
              {lead.kind === "request" ? (
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-copper-text">
                  <FirmMark mark={mark} />
                  {lead.label}
                  {leadTask && <time className="font-normal text-muted">{fmtDayMonth(leadTask.createdAt)}</time>}
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-muted">{lead.label}</p>
              )}
              <h2 id="nx" className="max-w-[34ch] text-[22px] leading-[30px] font-semibold">{lead.title}</h2>
              {lead.meta && <p className="max-w-[60ch] text-[15px] text-muted">{lead.meta}</p>}
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={lead.href} variant="primary" size="lg">
                  {lead.kind === "request" && leadTask?.target?.kind === "docs" ? t.home.uploadIt : lead.kind === "request" ? t.home.goField : lead.kind === "message" ? t.home.readReply : lead.key === "continue" ? t.home.continue(tr(open[0].s.short)) : t.home.review}
                  <ArrowRight size={18} aria-hidden="true" />
                </ButtonLink>
                {lead.kind === "request" && leadTask?.target?.kind === "docs" && <ButtonLink href={lead.href} size="lg">{t.upload.notYet}</ButtonLink>}
              </div>
            </section>
          )}
          {sent && <Notice tone="info" title={t.home.sentTitle}>{t.home.sentBody(status(exp.status))}</Notice>}

          {/* Para hacer */}
          <section aria-labelledby="todo" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="todo" className="text-[20px] font-semibold">{t.home.todo}</h2>
              {rest.length > 0 && <span className="text-[14px] text-muted">{t.home.things(rest.length)}</span>}
            </div>
            {rest.length > 0 && (
              <ul className="flex flex-col overflow-clip rounded-xl border border-line bg-surface">
                {rest.map((x) => <TaskRow key={x.key} task={x} />)}
              </ul>
            )}
            {!tasks.length && (
              <EmptyState icon={CircleCheck} tone="ok" title={t.home.noRequests}>{t.home.noRequestsBody}</EmptyState>
            )}
          </section>

          {/* Su declaración */}
          <section aria-labelledby="secs" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="secs" className="text-[20px] font-semibold">{t.home.yourReturn}</h2>
              <span className="text-[14px] text-muted">{t.q.sectionsDone(sections.length - open.length, sections.length)}</span>
            </div>
            <SegMeter states={sections.map((x) => x.st)} />
            <ul className="mt-1 flex flex-col overflow-clip rounded-xl border border-line bg-surface">
              {sections.map(({ s, p, st }, i) => {
                const req = requested.has(s.slug);
                return (
                  <SectionRow key={s.slug} href={`/declaracion/${s.slug}`} dot={<StepDot n={i + 1} state={st} />} name={tr(s.short)} request={req}>
                    {req ? t.q.requested : st === "partial" ? t.q.leftN(p.total - p.done) : t.sectionState[st]}
                  </SectionRow>
                );
              })}
              <SectionRow href={`/declaracion/${REVIEW_SLUG}`} dot={<StepDot state="none" icon={Send} />} name={sent ? t.home.reviewResend : t.home.review} />
            </ul>
          </section>
        </div>

        {/* Side column */}
        <aside className="flex min-w-0 flex-col gap-5">
          <Panel title={t.home.how}>
            <Timeline status={exp.status} exp={exp} />
          </Panel>

          <Panel title={t.home.yourFirm}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <FirmLogo mark={mark} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{firmName}</p>
                  <p className="text-[13px] text-muted">
                    {[firm.address, exp.assignee && firm.team.find((m) => m.id === exp.assignee)?.name && t.home.attends(firm.team.find((m) => m.id === exp.assignee)!.name)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <ButtonLink href="/mensajes" className="w-full"><MessageCircle size={16} aria-hidden="true" />{t.home.write}</ButtonLink>
                {FEATURES.appointments && <ButtonLink href="/cita" variant="ghost" className="w-full"><CalendarClock size={16} aria-hidden="true" />{t.home.bookCall}</ButtonLink>}
              </div>
              {nextAp && (
                <Link href="/cita" className="group flex flex-col gap-1 border-t border-line pt-3">
                  <span className="flex items-center justify-between gap-2">
                    <b className="text-[14px] font-semibold">{t.home.nextAp}</b>
                    <Pill tone={AP_TONE[nextAp.status]}>{t.cita.status[nextAp.status]}</Pill>
                  </span>
                  <span className="figures text-[13.5px] text-muted group-hover:text-ink">{t.cita.kind[nextAp.kind]} · {t.cita.when(fmtDate(nextAp.date), t.cita.slot[nextAp.slot], nextAp.time)}</span>
                </Link>
              )}
            </div>
          </Panel>

          <div className="rounded-xl border border-line bg-surface p-4">
            <dl className="grid grid-cols-[minmax(110px,40%)_1fr] gap-x-3 gap-y-1.5 text-[14.5px]">
              <dt className="text-muted">{t.nav.documents}</dt>
              <dd className="figures"><Link href="/documentos" className="hover:text-accent hover:underline">{t.home.docsSum(uploaded, missing)}</Link></dd>
              {FEATURES.payments && (
                <>
                  <dt className="text-muted">{t.home.fees}</dt>
                  <dd className={cx("figures", !fee && "text-muted")}>{fee ? fmtEuros(fee.total, locale) : t.home.feesNone}</dd>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <h2 className="flex min-h-[52px] items-center border-b border-line px-4 py-3 text-[17px] font-semibold">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** The gestoría's voice: its initials on copper. */
function FirmMark({ mark }: { mark: string }) {
  return <span className="grid size-7 place-items-center rounded-full bg-copper text-[12px] font-semibold text-surface" aria-hidden="true">{mark}</span>;
}

/** The gestoría's logo from Ajustes › Despacho, or a labelled slot until it is uploaded. */
function FirmLogo({ mark }: { mark: string }) {
  const { firm } = useAppState();
  const url = useFileUrl(firm.logo);
  if (url)
    // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
    return <img src={url} alt="" className="size-10 shrink-0 rounded-md border border-line object-contain" />;
  return <span className="grid size-10 shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-[12px] font-semibold text-muted" aria-hidden="true">{mark}</span>;
}

const TASK_ICON: Record<Kind, string> = {
  approval: "bg-accent text-accent-ink",
  request: "bg-copper-soft text-copper-text",
  message: "bg-info-soft text-info",
  plain: "bg-sunk text-muted",
  sent: "bg-info-soft text-info",
  resolved: "bg-ok-soft text-ok",
};

function TaskRow({ task: x }: { task: Task }) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link href={x.href} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-4 transition-colors hover:bg-hover">
        <span className={cx("grid size-9 place-items-center rounded-full", TASK_ICON[x.kind])}>
          {x.icon ? <x.icon size={17} strokeWidth={2} aria-hidden="true" /> : <span className="size-2.5 rounded-full border-[1.5px] border-accent bg-[linear-gradient(90deg,var(--accent)_50%,transparent_50%)]" aria-hidden="true" />}
        </span>
        <span className="min-w-0">
          <span className={cx("block text-[13px] leading-[18px] font-semibold", x.kind === "request" ? "text-copper-text" : x.kind === "sent" ? "text-info" : x.kind === "resolved" ? "text-ok" : "text-muted")}>{x.label}</span>
          <span className="block text-[17px] leading-6 font-medium">{x.title}</span>
          {x.meta && <span className="block text-[13px] leading-[18px] text-muted">{x.meta}</span>}
        </span>
        <ChevronRight size={18} className="text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

function SectionRow({ href, dot, name, request, children }: { href: string; dot: ReactNode; name: string; request?: boolean; children?: ReactNode }) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link href={href} className="grid min-h-[52px] grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
        {dot}
        <span className="text-[15px] font-medium">{name}</span>
        <span className={cx("text-right text-[14px] whitespace-nowrap", request ? "font-semibold text-copper-text" : "text-muted")}>{children}</span>
        <ChevronRight size={16} className="text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** "Cómo va": the four stages of the process and where this case is. */
function Timeline({ status, exp }: { status: Status; exp: Expediente }) {
  const { t } = useI18n();
  const at = status === "listo" || resultApproved(exp) ? 3 : FEATURES.resultApproval && awaitingApproval(exp) ? 2 : status === "borrador" ? 0 : 1;
  return (
    <ol className="flex flex-col">
      {t.home.timeline.map(([title, sub], i) => {
        const done = i < at;
        const now = i === at;
        return (
          <li key={title} aria-current={now ? "step" : undefined} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-4 text-[15px] leading-5 last:pb-0">
            {i < 3 && <span className="absolute top-5 bottom-0 left-[9px] w-0.5 bg-line" aria-hidden="true" />}
            <span className={cx("relative size-5 rounded-full border-2", done ? "border-ok bg-ok" : now ? "border-accent bg-accent shadow-[inset_0_0_0_3px_var(--surface)]" : "border-line-strong bg-surface")} aria-hidden="true" />
            <span>
              {now ? <b className="font-semibold text-accent">{title}</b> : <span className={done ? "" : "text-muted"}>{title}</span>}
              {sub && <small className="block text-[13px] text-muted">{sub}</small>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
