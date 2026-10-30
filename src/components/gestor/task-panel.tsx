"use client";

import { useState, type FormEvent } from "react";
import { Check, Clock, Eye, RotateCcw, Send, X } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { actions } from "@/lib/data/store";
import type { ClientTask, Expediente } from "@/lib/data/types";
import { L, type Text } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { Button, Pill, cx } from "@/components/ui/primitives";
import { inputCls } from "./settings/settings-layout";

const stateOf = (x: ClientTask) => (x.closedAt ? "closed" : x.doneAt ? "done" : "open");
/** Request badges (design system › StatusBadge): copper while the client owes it, amber when the gestoría must check, green when resolved. */
const TONE = { open: "copper", done: "warn", closed: "ok" } as const;
const ICON = { open: Clock, done: Eye, closed: Check } as const;

/** Whether the same request is already open, so the "Ask" buttons can show it was asked. */
export const isAsked = (e: Expediente, text: Text) => (e.tasks ?? []).some((x) => !x.closedAt && x.text.es === text.es);

/**
 * "Pedir al cliente" next to an alert or a missing document. It opens a small
 * composer under the button, prefilled with client-facing text the gestoría
 * can edit before sending (the internal alert wording is not sent as is).
 */
export function AskButton({ exp, text, target }: { exp: Expediente; text: Text; target: ClientTask["target"] }) {
  const { t, tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  if (isAsked(exp, text))
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap text-muted">
        <Check size={13} aria-hidden="true" />
        {t.tasks.asked}
      </span>
    );
  const start = () => {
    setDraft(tr(text));
    setOpen(true);
  };
  const send = (ev: FormEvent) => {
    ev.preventDefault();
    const v = draft.trim();
    if (!v) return;
    // Unchanged text keeps all its translations; edited text is sent as written.
    actions.askClient(exp.id, v === tr(text) ? text : L(v, v, v), target);
    setOpen(false);
  };
  return (
    <>
      <Button size="sm" aria-expanded={open} onClick={() => (open ? setOpen(false) : start())}>
        <Send size={14} aria-hidden="true" />
        {t.tasks.ask}
      </Button>
      {open && (
        <form onSubmit={send} className="flex w-full basis-full flex-col gap-2 rounded-lg border border-copper/40 bg-surface p-3 text-left">
          <label className="text-[12.5px] font-medium text-muted" htmlFor={`ask-${exp.id}-${text.es.length}`}>{t.file.clientText}</label>
          <textarea id={`ask-${exp.id}-${text.es.length}`} autoFocus rows={3} value={draft} onChange={(ev) => setDraft(ev.target.value)} className={cx(inputCls, "h-auto resize-y py-2 text-[14px] leading-snug")} />
          <span className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{t.tasks.cancel}</Button>
            <Button size="sm" variant="primary" type="submit">
              <Send size={14} aria-hidden="true" />
              {t.tasks.add}
            </Button>
          </span>
        </form>
      )}
    </>
  );
}

/** G3 · Peticiones: what the gestoría asked the client for, and a form for a new request. */
export function TaskPanel({ exp: e }: { exp: Expediente }) {
  const { t, tr, locale } = useI18n();
  const [text, setText] = useState("");
  const [where, setWhere] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const all = [...(e.tasks ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = all.filter((x) => !x.closedAt);
  const closed = all.filter((x) => x.closedAt);
  const shown = showClosed ? all : active;

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const v = text.trim();
    if (!v) return;
    const [kind, section] = where.split(":");
    actions.askClient(e.id, L(v, v, v), section ? { section, kind: kind as "answers" | "docs" } : null);
    setText("");
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-muted">{t.tasks.intro}</p>
      {shown.length > 0 ? (
        <ul className="flex flex-col overflow-clip rounded-xl border border-line">
          {shown.map((x) => {
            const st = stateOf(x);
            const sec = x.target && SCHEMA.find((s) => s.slug === x.target!.section);
            return (
              <li key={x.id} className={cx("flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0", st === "closed" && "bg-sunk")}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                  <span className={cx("min-w-0 flex-1 text-[14px]", st === "closed" && "text-muted line-through")}>{tr(x.text)}</span>
                  <Pill tone={TONE[st]} icon={ICON[st]}>{t.tasks.state[st]}</Pill>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  {sec && <span>{x.target!.kind === "docs" ? t.tasks.docsIn(tr(sec.short)) : t.tasks.answersIn(tr(sec.short))}</span>}
                  <span>{t.tasks.askedOn(fmtTime(x.createdAt, locale))}</span>
                  {x.doneAt && <span>{t.tasks.doneOn(fmtTime(x.doneAt, locale))}</span>}
                </div>
                {x.reply && (
                  <p className="rounded-md border border-line bg-sunk px-3 py-2 text-[13.5px]">
                    <span className="font-medium">{t.tasks.reply}: </span>
                    {x.reply}
                  </p>
                )}
                {st !== "closed" && (
                  <div className="flex flex-wrap gap-2">
                    {st === "done" && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => actions.closeTask(e.id, x.id)}>
                          <Check size={14} aria-hidden="true" />
                          {t.tasks.close}
                        </Button>
                        <Button size="sm" onClick={() => actions.reopenTask(e.id, x.id)}>
                          <RotateCcw size={14} aria-hidden="true" />
                          {t.tasks.reopen}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => actions.removeTask(e.id, x.id)}>
                      <X size={14} aria-hidden="true" />
                      {t.tasks.remove}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">{all.length ? t.tasks.aside(0, 0) : t.tasks.none}</p>
      )}
      {closed.length > 0 && (
        <button type="button" onClick={() => setShowClosed(!showClosed)} className="self-start text-[13px] font-medium text-accent hover:underline">
          {showClosed ? t.tasks.hideClosed : t.tasks.showClosed(closed.length)}
        </button>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl border border-line bg-sunk p-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor={`task-${e.id}`}>{t.tasks.ask}</label>
        <input id={`task-${e.id}`} value={text} onChange={(ev) => setText(ev.target.value)} placeholder={t.tasks.newPh} autoComplete="off" className={cx(inputCls, "min-w-0 flex-1")} />
        <label className="sr-only" htmlFor={`task-where-${e.id}`}>{t.tasks.where}</label>
        <select id={`task-where-${e.id}`} value={where} onChange={(ev) => setWhere(ev.target.value)} className={cx(inputCls, "sm:w-[220px]")}>
          <option value="">{t.tasks.general}</option>
          {SCHEMA.map((s) => (
            <optgroup key={s.slug} label={tr(s.short)}>
              <option value={`answers:${s.slug}`}>{t.tasks.answersIn(tr(s.short))}</option>
              <option value={`docs:${s.slug}`}>{t.tasks.docsIn(tr(s.short))}</option>
            </optgroup>
          ))}
        </select>
        <Button type="submit" variant="primary" disabled={!text.trim()}>
          <Send size={15} aria-hidden="true" />
          {t.tasks.add}
        </Button>
      </form>
    </div>
  );
}
