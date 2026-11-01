"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowRight, Check, ClipboardList } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { actions, openTasks, useAppState } from "@/lib/data/store";
import type { ClientTask, Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, CardTitle, Notice, cx } from "@/components/ui/primitives";

/** Where the client resolves a request: the exact question when the request names one. */
export const hrefOf = (x: ClientTask) =>
  !x.target ? "/mensajes"
  : x.target.field ? `/declaracion/${x.target.section}#q-${x.target.field}${x.target.item ? `-${x.target.item}` : ""}`
  : x.target.kind === "docs" ? "/documentos"
  : `/declaracion/${x.target.section}`;

/** C2: what the gestoría has asked for. Hidden when nothing is pending. */
export function ClientTasks({ exp }: { exp: Expediente }) {
  const { t } = useI18n();
  const list = openTasks(exp);
  const [justDone, setJustDone] = useState(false);
  if (!list.length) return justDone ? <Notice tone="ok">{t.tasks.sentBack}</Notice> : null;
  return (
    <Card className="border-copper">
      <CardTitle aside={t.tasks.yoursAside(list.length)}>
        <span className="flex items-center gap-3">
          <IconTile icon={ClipboardList} tone="copper" size="sm" />
          {t.tasks.yours}
        </span>
      </CardTitle>
      <ul className="flex flex-col">
        {list.map((x) => (
          <TaskRow key={x.id} exp={exp} task={x} onDone={() => setJustDone(true)} />
        ))}
      </ul>
    </Card>
  );
}

function TaskRow({ exp, task: x, onDone }: { exp: Expediente; task: ClientTask; onDone: () => void }) {
  const { t, tr, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const sec = x.target && SCHEMA.find((s) => s.slug === x.target!.section);
  return (
    <li className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium">{tr(x.text)}</p>
          <p className="text-[12.5px] text-muted">
            {sec ? `${tr(sec.short)} · ` : ""}
            {t.tasks.askedOn(fmtTime(x.createdAt, locale))}
          </p>
        </div>
        <div className={cx("flex flex-wrap items-center gap-2", open && "hidden")}>
          {x.target && (
            <Link href={hrefOf(x)} className="inline-flex items-center gap-1 px-1 text-[14px] font-medium text-accent hover:underline">
              {t.tasks.go}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
          {/* A request at a question is answered there (upload, or "No lo tengo todavía"). */}
          {!x.target?.field && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Check size={14} aria-hidden="true" />
              {t.tasks.markDone}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(ev) => {
            ev.preventDefault();
            actions.completeTask(exp.id, x.id, reply);
            onDone();
          }}
        >
          <label className="sr-only" htmlFor={`reply-${x.id}`}>{t.tasks.replyPh}</label>
          <input
            id={`reply-${x.id}`}
            autoFocus
            value={reply}
            onChange={(ev) => setReply(ev.target.value)}
            placeholder={t.tasks.replyPh}
            className="field h-(--control-h-sm) min-w-0 flex-1 text-[14px]"
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit" variant="primary">{t.tasks.confirmDone}</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{t.tasks.cancel}</Button>
          </div>
        </form>
      )}
    </li>
  );
}

/** C3: the open requests for one questionnaire step, in the gestoría's copper; each one links to its exact question. */
export function SectionTasks({ exp, section }: { exp: Expediente; section: string }) {
  const { t, tr } = useI18n();
  const { firm } = useAppState();
  const list = openTasks(exp).filter((x) => x.target?.section === section);
  if (!list.length) return null;
  const mark = (firm.name.trim() || "G").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <section className="mb-6 flex flex-col gap-3 rounded-md bg-copper-soft px-4 py-3.5">
      <p className="flex items-center gap-2.5 text-[13.5px] font-semibold text-copper-text">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-copper text-[12px] text-surface" aria-hidden="true">{mark}</span>
        {t.tasks.inSection}
      </p>
      <ul className="flex flex-col gap-2.5">
        {list.map((x) => (
          <li key={x.id} className="flex flex-col items-start gap-2">
            <span className="text-[15px] leading-[22px]">{tr(x.text)}</span>
            {x.target?.field ? (
              <a href={`#q-${x.target.field}${x.target.item ? `-${x.target.item}` : ""}`} className="inline-flex h-(--control-h-sm) items-center gap-1.5 rounded-md border border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover px-3 text-[13.5px] font-medium">
                {t.home.goField}
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            ) : (
              <Link href="/inicio" className="inline-flex h-(--control-h-sm) items-center rounded-md border border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover px-3 text-[13.5px] font-medium">
                {t.tasks.markDone}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
