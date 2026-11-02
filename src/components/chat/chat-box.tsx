"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, ClipboardList, FileText, MessageSquareText, MessagesSquare, Paperclip, SendHorizontal, X } from "lucide-react";
import { IconTile } from "@/components/ui/icons";
import type { ChatMessage, ClientTask, Expediente, Side } from "@/lib/data/types";
import { actions, clientName, useAppState } from "@/lib/data/store";
import { ACCEPTED, MAX_FILE_BYTES, isAccepted, putFile, typeOf, useFileUrl } from "@/lib/data/files";
import { API_MODE } from "@/lib/auth/config";
import type { FileRef } from "@/lib/questionnaire/types";
import { uid } from "@/lib/format";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtClock } from "@/lib/format";
import { Button, Pill, cx } from "@/components/ui/primitives";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
const dayKey = (iso: string) => iso.slice(0, 10);
type Entry = { at: string; m?: ChatMessage; task?: ClientTask };
const TASK_TONE = { open: "copper", done: "warn", closed: "ok" } as const;

/** Client ⇄ gestoría messages for one case. Marks messages as seen while open. */
export function ChatBox({ exp, side, height = "h-[340px]", header = side === "cliente", initialDraft = "" }: { exp: Expediente; side: Side; height?: string; header?: boolean; initialDraft?: string }) {
  const { firm } = useAppState();
  const { t, tr, locale } = useI18n();
  const [draft, setDraft] = useState(initialDraft);
  // Attachments waiting to go with the next message (demo only: the API has no message attachments yet).
  const [att, setAtt] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState("");
  const fileIn = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const count = exp.chat.length;
  // Requests appear in the thread as cards with their live state, at the moment they were sent.
  const entries: Entry[] = [...exp.chat.map((m) => ({ at: m.at, m })), ...(exp.tasks ?? []).map((x) => ({ at: x.createdAt, task: x }))].sort((a, b) => a.at.localeCompare(b.at));
  // Who is on the other side of the conversation.
  const other = side === "cliente" ? firm.name.trim() || t.landing.yourFirm : clientName(exp) || t.common.unnamedClient;
  // When the other side last opened the conversation: my messages up to then are read.
  const otherSeen = side === "gestor" ? exp.clientSeen : exp.gestorSeen;

  useEffect(() => {
    actions.markSeen(exp.id, side);
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [exp.id, side, count, exp.remote?.unread]);

  const pick = (list: File[]) => {
    const ok = list.filter(isAccepted);
    const fit = ok.filter((f) => f.size <= MAX_FILE_BYTES);
    setWarn(ok.length < list.length ? t.upload.onlyImgPdf : fit.length < ok.length ? t.upload.tooBig : "");
    setAtt((a) => [...a, ...fit]);
  };

  const send = async () => {
    const text = draft.trim();
    if ((!text && !att.length) || busy) return;
    setBusy(true);
    try {
      const files: FileRef[] = [];
      for (const f of att) {
        const ref: FileRef = { id: uid("f-"), name: f.name, size: f.size, type: typeOf(f) };
        await putFile(ref.id, f);
        files.push(ref);
      }
      if (!await actions.sendMessage(exp.id, side, text, false, files)) {
        setWarn(t.clients.api.failed);
        return;
      }
      setDraft("");
      setAtt([]);
      setWarn("");
    } catch {
      setWarn(t.upload.failedShort);
    } finally {
      setBusy(false);
    }
  };

  const today = dayKey(new Date().toISOString());
  const dayLabel = (iso: string) => (dayKey(iso) === today ? t.chat.today : new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long" }));

  return (
    <div className="flex min-h-0 flex-col">
      {header && (
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-accent-ink" aria-hidden="true">
            {initials(other)}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-[14.5px] font-semibold">{other}</b>
            <span className="block truncate text-[12.5px] text-muted">{t.common.taxYear(exp.ejercicio)}</span>
          </span>
        </div>
      )}

      <div ref={list} aria-live="polite" className={cx("flex flex-col gap-1 overflow-y-auto bg-chat px-4 py-4 sm:px-5", height)}>
        {entries.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-2 text-center">
            <IconTile icon={MessagesSquare} tone="neutral" size="lg" />
            <p className="max-w-[32ch] text-[13px] text-muted">{side === "cliente" ? t.chat.emptyClient : t.chat.emptyGestor}</p>
          </div>
        )}
        {entries.map((en, i) => {
          const prevEntry = entries[i - 1];
          const newDay = !prevEntry || dayKey(prevEntry.at) !== dayKey(en.at);
          if (en.task) {
            const x = en.task;
            const st = x.closedAt ? "closed" : x.doneAt ? "done" : "open";
            return (
              <Fragment key={x.id}>
                {newDay && <DaySep label={dayLabel(en.at)} />}
                <div className="my-2 flex max-w-[min(90%,520px)] flex-col gap-1.5 self-start rounded-2xl border border-copper border-l-[3px] border-l-copper bg-surface px-4 py-3 text-[14px] shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-copper-text">
                      <ClipboardList size={14} aria-hidden="true" />
                      {t.chat.request}
                    </span>
                    <Pill tone={TASK_TONE[st]}>{t.tasks.state[st]}</Pill>
                  </span>
                  <p className="break-words">{tr(x.text)}</p>
                  {x.reply && <p className="text-[13px] text-muted">{x.reply}</p>}
                </div>
              </Fragment>
            );
          }
          const m = en.m!;
          const prev = prevEntry?.m;
          const mine = m.from === side;
          // Group consecutive messages from the same side: the name and avatar show once.
          const first = newDay || !prev || prev.from !== m.from || !!prev.sys;
          return (
            <Fragment key={m.id}>
              {newDay && <DaySep label={dayLabel(m.at)} />}
              {m.request ? (
                // API mode: an information request from the gestoría, shown as a request card.
                <div className="my-2 flex max-w-[min(90%,520px)] flex-col gap-1.5 self-start rounded-2xl border border-copper border-l-[3px] border-l-copper bg-surface px-4 py-3 text-[14px] shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
                  <span className="flex items-center justify-between gap-3 text-[12px] font-semibold text-copper-text">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList size={14} aria-hidden="true" />
                      {t.chat.request}
                    </span>
                    <span className="font-normal text-muted">{fmtClock(m.at, locale)}</span>
                  </span>
                  <p className="break-words whitespace-pre-wrap">{m.text}</p>
                </div>
              ) : m.sys ? (
                <p className="my-2 self-center rounded-full bg-surface/80 px-3 py-1 text-center text-[12px] text-muted ring-1 ring-line">
                  {t.chat.sys[typeof m.sys === "string" ? m.sys : "sent"]} · {fmtClock(m.at, locale)}
                </p>
              ) : (
                <div className={cx("flex max-w-[min(85%,640px)] items-end gap-2", mine ? "self-end" : "self-start", first && "mt-3")}>
                  {!mine && (
                    <span className={cx("grid size-7 shrink-0 place-items-center rounded-full bg-surface text-[10.5px] font-semibold text-accent shadow-sm ring-1 ring-line", !first && "invisible")} aria-hidden="true">
                      {initials(other)}
                    </span>
                  )}
                  <div className={cx("flex min-w-0 flex-col gap-1", mine && "items-end")}>
                    {first && <span className="px-1 text-[11.5px] font-semibold text-muted">{mine ? t.chat.you : other}</span>}
                    {/* the gestoría speaks in the brand's navy; the client on white */}
                    <div className={cx("rounded-2xl px-3.5 py-2.5 text-[14px] leading-[21px] shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_-8px_rgb(0_0_0/0.18)]", mine ? "rounded-br-md" : "rounded-bl-md", m.from === "gestor" ? "bg-accent text-accent-ink" : "border border-line bg-surface text-ink")}>
                      {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
                      {m.files?.length ? (
                        <ul className={cx("flex flex-col gap-1", m.text && "mt-2")}>
                          {m.files.map((f) => <li key={f.id}><Attachment file={f} onBrand={m.from === "gestor"} /></li>)}
                        </ul>
                      ) : null}
                      <span className={cx("mt-1 flex items-center justify-end gap-1 text-[11px]", m.from === "gestor" ? "text-accent-ink/70" : "text-muted")}>
                        <time dateTime={m.at}>{fmtClock(m.at, locale)}</time>
                        {mine && (otherSeen && otherSeen >= m.at ? (
                          <CheckCheck size={14} strokeWidth={2.2} role="img" aria-label={t.chat.seen} />
                        ) : (
                          <Check size={14} strokeWidth={2.2} role="img" aria-label={t.chat.delivered} />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="@container flex flex-col gap-2 border-t border-line bg-surface p-3">
        {side === "gestor" && (
          <div className="flex flex-wrap gap-1.5">
            {(firm.replies?.length ? firm.replies : t.chat.quick).filter((q) => q.label.trim()).map((q, i) => (
              <button key={i} type="button" disabled={busy} onClick={() => { setDraft(q.text); ta.current?.focus(); }} className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-line bg-sunk/60 px-2.5 text-[12px] font-medium text-ink/80 transition-[background-color,border-color,color] hover:border-accent/30 hover:bg-accent-soft hover:text-accent">
                <MessageSquareText size={13} className="text-muted" aria-hidden="true" />
                {q.label}
              </button>
            ))}
          </div>
        )}
        {att.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t.chat.attach}>
            {att.map((f, i) => (
              <li key={i} className="flex max-w-full items-center gap-1.5 rounded-md border border-line bg-sunk py-1 pr-1 pl-2 text-[13px]">
                <FileText size={14} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => setAtt((a) => a.filter((_, j) => j !== i))} aria-label={t.common.removeFile(f.name)} className="grid size-6 shrink-0 place-items-center rounded text-muted hover:bg-hover hover:text-ink">
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {warn && <p role="alert" className="text-[13px] text-bad">{warn}</p>}
        <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_6px_18px_-10px_rgb(var(--accent-rgb)/0.35)] transition-[border-color,box-shadow] hover:border-line-strong focus-within:border-focus focus-within:ring-4 focus-within:ring-focus/15">
          {!API_MODE && (
            <>
              <input ref={fileIn} type="file" accept={ACCEPTED} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pick([...(e.target.files ?? [])]); e.target.value = ""; }} />
              <button type="button" onClick={() => fileIn.current?.click()} aria-label={t.chat.attach} title={t.chat.attach} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-accent-soft hover:text-accent">
                <Paperclip size={18} aria-hidden="true" />
              </button>
            </>
          )}
          <textarea
            ref={ta}
            rows={1}
            aria-label={t.chat.label}
            value={draft}
            disabled={busy}
            maxLength={API_MODE ? 5000 : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={side === "cliente" ? t.chat.phClient : t.chat.phGestor}
            className="max-h-40 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-[14.5px] outline-hidden [field-sizing:content] pointer-coarse:text-[16px]"
          />
          <Button variant="primary" className="rounded-xl max-@[400px]:w-10 max-@[400px]:px-0" onClick={send} disabled={(!draft.trim() && !att.length) || busy} loading={busy} aria-label={t.chat.send}>
            <SendHorizontal size={16} aria-hidden="true" />
            <span className="hidden @[400px]:inline">{t.chat.send}</span>
          </Button>
        </div>
        <p className="hidden px-1 text-[11.5px] text-muted @[300px]:block">{t.chat.hint}</p>
      </div>
    </div>
  );
}

/** A file in a message: opens in a new tab (downloads for HEIC, which browsers cannot show). */
function Attachment({ file, onBrand }: { file: FileRef; onBrand?: boolean }) {
  const url = useFileUrl(file);
  const body = (
    <>
      <FileText size={15} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{file.name}</span>
    </>
  );
  const cls = cx("flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[13px] font-medium", onBrand ? "border-white/20 bg-white/10" : "border-line bg-sunk/60");
  return url ? (
    <a href={url} target="_blank" rel="noopener" download={/\.hei[cf]$/i.test(file.name) ? file.name : undefined} className={cx(cls, onBrand ? "text-accent-ink hover:underline" : "text-accent hover:underline")}>{body}</a>
  ) : (
    <span className={cx(cls, onBrand ? "text-accent-ink/70" : "text-muted")}>{body}</span>
  );
}

function DaySep({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center justify-center" role="separator">
      <span className="rounded-full border border-line bg-surface/90 px-3 py-0.5 text-[11.5px] font-semibold text-muted shadow-sm">{label}</span>
    </div>
  );
}
