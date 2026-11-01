"use client";

import { createContext, Fragment, useContext, useState, type DragEvent } from "react";
import { ArrowRight, Camera, Check, ChevronDown, CircleAlert, Clock, FileText, Plus, RotateCw, Upload, X } from "lucide-react";
import { ITEM_ID, type AnswerValue, type Answers, type Field, type FileRef, type Path } from "@/lib/questionnaire/types";
import { asFiles, asItems, asText, getIn, progressOf, sectionState, showsKids } from "@/lib/questionnaire/progress";
import { actions, useAppState } from "@/lib/data/store";
import { slotKey, type ClientTask, type Expediente } from "@/lib/data/types";
import { ACCEPTED, MAX_FILE_BYTES, deleteFile, isAccepted, isHeic, putFile, typeOf, useFileUrl } from "@/lib/data/files";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDayMonth, uid } from "@/lib/format";
import { FileThumb } from "@/components/ui/file-chip";
import { StepDot } from "@/components/ui/progress";
import { API_MODE } from "@/lib/auth/config";
import { sectionKey, slotPath } from "@/lib/api/mapping";
import { Pill, cx } from "@/components/ui/primitives";
import { DateField } from "@/components/ui/date-field";
import { FieldIcon } from "@/components/ui/field-icon";
import { Select } from "@/components/ui/select";

interface Ctx {
  set: (path: Path, value: AnswerValue | undefined) => void;
  /** Changes one answer from its current stored value (uploads that finish later); falls back to `set` on the given answers. */
  update: (path: Path, fn: (cur: AnswerValue | undefined) => AnswerValue | undefined) => void;
  readOnly: boolean;
  notify: (msg: string) => void;
  /** The client's case, when the form is the client's own questionnaire: requests pinned on fields, "No lo tengo todavía". */
  exp?: Expediente;
  section?: string;
}
const FormCtx = createContext<Ctx | null>(null);
const useForm = () => {
  const c = useContext(FormCtx);
  if (!c) throw new Error("FieldList outside QuestionnaireForm");
  return c;
};

/** Renders a list of schema fields bound to `answers`. */
export function QuestionnaireForm({ fields, answers, onChange, onUpdate, readOnly = false, notify = () => {}, idBase, exp, section }: {
  fields: Field[];
  answers: Answers;
  onChange: (path: Path, value: AnswerValue | undefined) => void;
  onUpdate?: (path: Path, fn: (cur: AnswerValue | undefined) => AnswerValue | undefined) => void;
  readOnly?: boolean;
  notify?: (msg: string) => void;
  idBase: string;
  exp?: Expediente;
  section?: string;
}) {
  return (
    <FormCtx.Provider value={{ set: onChange, update: onUpdate ?? ((path, fn) => onChange(path, fn(getIn(answers, path)))), readOnly, notify, exp, section }}>
      <div className="@container flex flex-col">
        <FieldList fields={fields} scope={answers} path={[]} idBase={idBase} />
      </div>
    </FormCtx.Provider>
  );
}

/**
 * Fields in order. A field that opens a named group starts a group section
 * (design system › QuestionGroup): heading and one sentence of why on the left
 * when the form is wide enough, the questions on the right.
 */
function FieldList({ fields, scope, path, idBase, itemId = null, listKey = null, depth = 0 }: { fields: Field[]; scope: Answers; path: Path; idBase: string; itemId?: string | null; listKey?: string | null; depth?: number }) {
  const { tr } = useI18n();
  const rows = (list: Field[]) => list.map((x) => <FieldRow key={x.id} field={x} scope={scope} path={path} id={`${idBase}-${x.id}`} itemId={itemId} listKey={listKey} depth={depth} />);
  if (!fields.some((x) => x.group)) return rows(fields);
  const parts: { group?: Field["group"]; list: Field[] }[] = [];
  for (const x of fields) {
    if (x.group || !parts.length) parts.push({ group: x.group, list: [] });
    parts[parts.length - 1].list.push(x);
  }
  // Each group list measures its own width, so groups nested in a follow-up stay stacked.
  return <div className="@container flex flex-col">{parts.map((g, i) => (
    <section key={i} className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 last:pb-0 @[820px]:grid-cols-[250px_minmax(0,1fr)] @[820px]:gap-6">
      {g.group ? (
        <div className="flex flex-col gap-1 @[820px]:sticky @[820px]:top-[calc(var(--app-header,64px)+1.5rem)] @[820px]:self-start">
          <h3 className="text-[20px] leading-7 font-semibold">{tr(g.group.title)}</h3>
          {g.group.why && <p className="max-w-[60ch] text-[15px] leading-[22px] text-muted">{tr(g.group.why)}</p>}
        </div>
      ) : <span className="hidden @[820px]:block" />}
      <div className="flex min-w-0 flex-col">{rows(g.list)}</div>
    </section>
  ))}</div>;
}

/** Open requests from the gestoría aimed at this exact question. */
const pinnedTasks = (exp: Expediente | undefined, field: string, item: string | null): ClientTask[] =>
  exp ? (exp.tasks ?? []).filter((x) => x.target?.field === field && (x.target.item ?? null) === item && (!x.closedAt || Date.now() - Date.parse(x.closedAt) < 14 * 864e5)) : [];

// Every text field, select and textarea spans the form column, so the questions line up (see .field in globals.css).
const inputCls = "field";

function FieldRow({ field: x, scope, path, id, itemId, listKey, depth }: { field: Field; scope: Answers; path: Path; id: string; itemId: string | null; listKey: string | null; depth: number }) {
  const { set, update, readOnly, exp } = useForm();
  const [err, setErr] = useState("");
  const pinned = pinnedTasks(exp, x.id, itemId);
  const { firm } = useAppState();
  const firmMark = (firm.name.trim() || "G").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const { t, tr } = useI18n();
  const v = scope[x.id];
  const at = [...path, x.id];
  const grouped = x.type === "yn" || x.type === "choice" || x.type === "upload" || x.type === "repeat";
  const label = (
    <>
      {tr(x.label)}
      {x.opt && <span className="font-normal text-muted">({t.common.optional.toLowerCase()})</span>}
    </>
  );
  const labelCls = "flex max-w-[68ch] flex-wrap items-baseline gap-2 text-[15px] font-semibold";

  let control = null;
  switch (x.type) {
    case "text":
    case "tel":
    case "email":
      control = <input id={id} type={x.type} autoComplete={x.ac ?? "off"} disabled={readOnly} value={asText(v)} onChange={(e) => set(at, e.target.value)} className={cx(inputCls, x.mono && "font-mono")} />;
      // phone and email carry their icon inside the field
      if (x.type === "tel" || x.type === "email") control = <FieldIcon kind={x.type}>{control}</FieldIcon>;
      break;
    case "date":
      // dd/mm/yyyy with a calendar; the answer is still stored as yyyy-mm-dd.
      control = <DateField id={id} disabled={readOnly} value={asText(v)} onChange={(iso) => set(at, iso)} className="max-w-[240px]" />;
      break;
    case "money":
    case "number":
    case "pct": {
      const unit = x.type === "money" ? "€" : x.type === "pct" ? "%" : x.unit && tr(x.unit);
      // Checked on blur, never while typing; the message says what to write (design system › Field).
      const check = (raw: string) => {
        const s = raw.trim();
        if (!s) return "";
        // A percentage has no thousands: "50,5" and "50.5" are both fifty and a half.
        if (x.type === "pct") {
          if (!/^[0-9]+([.,][0-9]+)?$/.test(s)) return t.q.errPct;
          const p = Number(s.replace(",", "."));
          return p > 0 && p <= 100 ? "" : t.q.errPct;
        }
        // Amounts: dots group thousands, the comma is the decimal ("1.250,40"); "1250.40" is accepted too.
        if (!/^[0-9.\s]*(,[0-9]+)?$/.test(s) && !/^[0-9]+(\.[0-9]+)?$/.test(s)) return t.q.errNum;
        return "";
      };
      control = (
        <div data-invalid={!!err || undefined} className="field-group max-w-[260px]">
          <input id={id} type="text" inputMode="decimal" disabled={readOnly} aria-invalid={!!err || undefined} aria-describedby={err ? id + "-err" : undefined} placeholder={x.type === "money" ? "0,00" : ""} value={asText(v)} onChange={(e) => { set(at, e.target.value); if (err) setErr(check(e.target.value)); }} onBlur={(e) => setErr(check(e.target.value))} className="figures text-right disabled:text-muted" />
          {unit && <span className="field-unit">{unit}</span>}
        </div>
      );
      break;
    }
    case "textarea":
      control = <textarea id={id} rows={5} disabled={readOnly} value={asText(v)} onChange={(e) => set(at, e.target.value)} className={inputCls} />;
      break;
    case "select":
      control = (
        <Select id={id} disabled={readOnly} value={asText(v)} onChange={(val) => set(at, val)} placeholder={t.common.chooseOption} options={(x.choices ?? []).map(([val, l]) => ({ value: val, label: tr(l) }))} />
      );
      break;
    case "yn":
    case "choice": {
      const opts = x.type === "yn" ? ([["si", t.common.yes], ["no", t.common.no]] as const) : (x.choices ?? []).map(([val, l]) => [val, tr(l)] as const);
      control = (
        // Separate option buttons, 48px tall (easy to tap): each reads as a button before it is chosen
        // (white, field border, soft shadow); the chosen one fills navy with a check.
        <div role="radiogroup" aria-labelledby={id + "-l"} className={cx("max-w-full gap-3", x.type === "yn" ? "grid w-[300px] grid-cols-2" : "flex flex-wrap")}>
          {opts.map(([val, l]) => {
            const on = v === val;
            return (
              <button
                key={val}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={readOnly}
                onClick={() => set(at, on ? undefined : val)}
                className={cx(
                  "inline-flex h-12 min-w-[112px] items-center justify-center gap-2 rounded-md border px-5 text-[15.5px] font-medium whitespace-nowrap shadow-field transition-[background-color,border-color,color] outline-none focus-visible:ring-4 focus-visible:ring-focus/25 disabled:cursor-default",
                  x.type === "yn" && "w-full",
                  on ? "border-accent bg-accent text-accent-ink" : "border-field-line bg-surface text-ink hover:border-accent hover:bg-accent-soft/50 disabled:hover:border-field-line disabled:hover:bg-surface",
                )}
              >
                {on && <Check size={16} strokeWidth={2.4} className="-ml-1" aria-hidden="true" />}
                {l}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case "upload":
      control = <Uploader id={id} files={asFiles(v)} onUpdate={(fn) => update(at, (cur) => fn(asFiles(cur)))} field={x.id} item={itemId} listKey={listKey} />;
      break;
    case "repeat":
      control = <Repeater field={x} items={asItems(v)} path={at} id={id} />;
      break;
  }

  return (
    <div id={`q-${x.id}${itemId ? `-${itemId}` : ""}`} className="-mx-3 flex scroll-mt-40 flex-col gap-2 rounded-md px-3 py-4 transition-[background-color,box-shadow] duration-700 first:-mt-4 last:-mb-4 data-[flash]:bg-copper-soft/70 data-[flash]:shadow-[inset_3px_0_0_var(--copper)] data-[flash]:duration-150 lg:scroll-mt-32">
      {grouped ? (
        <div id={id + "-l"} className={labelCls}>
          {label}
        </div>
      ) : (
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
      )}
      {x.help && <p className="-mt-1 max-w-[68ch] text-[14px] leading-5 text-ink/80">{tr(x.help)}</p>}
      {/* The gestoría's request, pinned on the question it concerns (design system › Request, inline). */}
      {pinned.map((task) => (
        <div key={task.id} className={cx("grid max-w-[620px] grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-md px-4 py-3", task.closedAt ? "bg-sunk" : task.doneAt ? "bg-info-soft" : "bg-copper-soft")}>
          <span className={cx("grid size-7 place-items-center rounded-full text-[12px] font-semibold text-surface", task.closedAt ? "bg-ok" : task.doneAt ? "bg-info" : "bg-copper")} aria-hidden="true">
            {task.closedAt || task.doneAt ? <Check size={14} strokeWidth={3} /> : firmMark}
          </span>
          <p className={cx("flex flex-wrap items-center gap-2 self-center text-[13px] font-semibold", task.closedAt ? "text-ok" : task.doneAt ? "text-info" : "text-copper-text")}>
            {task.closedAt ? t.q.pinnedResolved : task.doneAt ? t.home.answeredKind : t.home.requestWho}
            <time className="font-normal text-muted">{fmtDayMonth(task.closedAt ?? task.doneAt ?? task.createdAt)}</time>
          </p>
          <p className="col-span-2 text-[15px] leading-[22px]">{tr(task.text)}</p>
          {task.doneAt && !task.closedAt && <p className="col-span-2 text-[14px] text-muted">{t.q.pinnedAnswered}</p>}
        </div>
      ))}
      {control}
      {err && (
        <p id={id + "-err"} className="flex items-center gap-1.5 text-[14px] font-medium text-bad">
          <CircleAlert size={15} aria-hidden="true" />
          {err}
        </p>
      )}
      {showsKids(x, v) && (
        <div aria-live="polite" className="mt-2 flex flex-col gap-1 border-l-2 border-line pl-4 sm:pl-6">
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <ArrowRight size={13} aria-hidden="true" />
            {t.q.because(x.type === "yn" ? (v === "si" ? t.common.yes : t.common.no) : tr(x.choices?.find(([c]) => c === v)?.[1] ?? { es: String(v), en: String(v) }))}
          </span>
          <FieldList fields={x.kids ?? []} scope={scope} path={path} idBase={id} itemId={itemId} listKey={listKey} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function Repeater({ field: x, items, path, id }: { field: Field; items: Answers[]; path: Path; id: string }) {
  const { set, readOnly } = useForm();
  const { t, tr } = useI18n();
  const item = x.item ? tr(x.item) : "";
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => {
        const itemId = typeof it[ITEM_ID] === "string" ? (it[ITEM_ID] as string) : null;
        return (
          <RepeatItem key={itemId ?? i} n={i + 1} itemId={itemId} label={`${item} ${i + 1}`} fields={x.fields ?? []} scope={it} onRemove={readOnly ? undefined : () => set(path, items.filter((_, k) => k !== i))}>
            <FieldList fields={x.fields ?? []} scope={it} path={[...path, i]} idBase={`${id}-${i}`} itemId={itemId} listKey={x.id} />
          </RepeatItem>
        );
      })}
      {!readOnly && (
        <button type="button" onClick={() => set(path, [...items, { [ITEM_ID]: uid("i-") }])} className="inline-flex h-(--control-h) items-center gap-2 self-start rounded-md bg-accent-soft px-4 font-semibold text-accent transition-colors hover:bg-accent-soft-hover">
          {t.common.add(item)}
        </button>
      )}
      {readOnly && !items.length && <p className="text-sm text-muted">{t.common.noneAdded}</p>}
    </div>
  );
}

/** One repeated item ("Inmueble 2 · Av. del Port 112"): folds to a summary line once it is complete. */
function RepeatItem({ n, itemId, label, fields, scope, onRemove, children }: { n: number; itemId: string | null; label: string; fields: Field[]; scope: Answers; onRemove?: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  const { exp } = useForm();
  const requested = !!itemId && !!exp?.tasks?.some((x) => !x.doneAt && !x.closedAt && x.target?.item === itemId);
  const p = progressOf(fields, scope);
  const st = sectionState(p);
  // Folded once complete, unless a link (a request) points at a question inside it.
  const [open, setOpen] = useState(() => st !== "done" || (!!itemId && typeof window !== "undefined" && window.location.hash.endsWith(`-${itemId}`)));
  const name = asText(scope.dir) || asText(scope.nombre) || asText(scope.valor);
  return (
    <div className="rounded-xl border border-line-strong/40 bg-surface pad-x-card pb-2 shadow-sheet">
      <div className="flex items-center gap-3 py-2.5">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <StepDot n={n} state={st} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{label}</span>
            {name && <span className="block truncate text-[13px] text-muted">{name}</span>}
          </span>
          <Pill tone={requested ? "copper" : st === "done" ? "ok" : "neutral"} icon={st === "done" && !requested ? Check : undefined}>
            {requested ? t.q.requested : st === "done" ? t.sectionState.done : t.q.leftN(p.total - p.done)}
          </Pill>
          <ChevronDown size={18} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        {onRemove && (
          <button type="button" className="shrink-0 text-sm font-semibold text-bad" onClick={onRemove}>
            {t.common.remove}
          </button>
        )}
      </div>
      {open && <div className="border-t border-line pt-3">{children}</div>}
    </div>
  );
}

/** Deletes a stored file: on the API for API files, in this browser otherwise. Example files have nothing stored. */
function dropFile(f: FileRef) {
  if (f.example) return;
  if (f.remote) {
    const caseId = f.remote;
    void import("@/lib/api/remote").then((m) => m.removeDocument(caseId, f.id)).catch(() => {});
  } else deleteFile(f.id).catch(() => {});
}

/** One file waiting for, or failing, its upload. */
interface Pending { key: string; file: File; failed?: boolean }

/**
 * Upload inside the question that asks for it (design system › FileUpload):
 * requirements stated up front, a photo or files, each file's state (uploaded,
 * uploading, failed with a retry), and "No lo tengo todavía" with a note.
 */
function Uploader({ id, files, onUpdate, field, item, listKey }: { id: string; files: FileRef[]; onUpdate: (fn: (cur: FileRef[]) => FileRef[]) => void; field: string; item: string | null; listKey: string | null }) {
  const { readOnly, notify, exp, section } = useForm();
  const { t } = useI18n();
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false);
  const [noting, setNoting] = useState(false);
  const later = exp?.notYet?.[slotKey(field, item)];
  const [note, setNote] = useState(later?.note ?? "");

  /** Stores the files; the ones that fail stay listed with "Reintentar". */
  async function store(list: File[]) {
    const ok = list.filter(isAccepted);
    if (ok.length < list.length) notify(t.upload.onlyImgPdf);
    const fit = ok.filter((fl) => fl.size <= MAX_FILE_BYTES);
    if (fit.length < ok.length) notify(t.upload.tooBig);
    if (!fit.length) return [];
    const batch = fit.map((file) => ({ key: uid("p-"), file }));
    setPending((p) => [...p, ...batch]);
    const added: FileRef[] = [];
    for (const b of batch) {
      try {
        let ref: FileRef;
        if (API_MODE && exp) {
          // The API stores the file in its question's slot: section.field, or section.list.field for a repeated item.
          const { upload } = await import("@/lib/api/remote");
          ref = await upload(exp.id, slotPath(sectionKey(section ?? ""), field, listKey), item, b.file);
        } else {
          ref = { id: uid("f-"), name: b.file.name, size: b.file.size, type: typeOf(b.file) };
          await putFile(ref.id, b.file);
        }
        added.push(ref);
        setPending((p) => p.filter((x) => x.key !== b.key));
      } catch {
        setPending((p) => p.map((x) => (x.key === b.key ? { ...x, failed: true } : x)));
      }
    }
    return added;
  }

  async function add(list: File[]) {
    const added = await store(list);
    if (!added.length) return;
    // added to the files there are now, not to the list this upload started from
    onUpdate((cur) => [...cur, ...added]);
    // Uploading at the requested question answers the request.
    if (exp) {
      actions.answerSlot(exp.id, field, item, t.upload.uploadedReply(added.map((f) => f.name).join(", ")));
      if (later) actions.setNotYet(exp.id, field, item, section ?? "", null);
    }
  }

  async function retry(p: Pending) {
    setPending((list) => list.filter((x) => x.key !== p.key));
    await add([p.file]);
  }

  async function replace(i: number, file: File | undefined) {
    if (!file) return;
    const [ref] = await store([file]);
    if (!ref) return;
    const old = files[i];
    if (old) dropFile(old);
    onUpdate((cur) => (old ? cur.map((f) => (f.id === old.id ? ref : f)) : [...cur, ref]));
  }

  function remove(i: number) {
    const f = files[i];
    if (f) dropFile(f);
    const gone = files[i];
    onUpdate((cur) => cur.filter((f) => f.id !== gone?.id));
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files.length) add([...e.dataTransfer.files]);
  };
  const pick = (ev: React.ChangeEvent<HTMLInputElement>) => {
    add([...(ev.target.files ?? [])]);
    ev.target.value = "";
  };
  const empty = !files.length && !pending.length;
  const btn = "inline-flex h-(--control-h) items-center justify-center gap-2 rounded-md border px-4 text-[15px] font-medium whitespace-nowrap transition-colors";

  return (
    <div className="flex max-w-[620px] flex-col gap-2.5">
      {!readOnly && (
        <>
          <input id={id} type="file" multiple accept={ACCEPTED} className="sr-only" onChange={pick} />
          <input id={id + "-cam"} type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} />
        </>
      )}

      {!readOnly && empty && !later && (
        <div
          role="group"
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={cx("flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border-[1.5px] p-4", over ? "border-solid border-focus bg-info-soft" : "border-dashed border-line-strong bg-surface")}
        >
          <div className="flex min-w-[min(100%,220px)] flex-[1_1_220px] flex-col gap-0.5">
            <strong className="text-[15px] font-medium">{t.upload.dropTitle}</strong>
            <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-[18px] text-muted">
              <span className="inline-flex items-center gap-1"><FileText size={13} aria-hidden="true" />{t.upload.reqPhoto}</span>
              <span>{t.upload.reqMany}</span>
              <span>{t.upload.reqSize}</span>
            </span>
          </div>
          <label htmlFor={id + "-cam"} className={cx(btn, "flex-auto cursor-pointer border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover")}>
            <Camera size={17} aria-hidden="true" />
            {t.upload.camera}
          </label>
          <label htmlFor={id} className={cx(btn, "flex-auto cursor-pointer border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover")}>
            <Upload size={17} aria-hidden="true" />
            {t.upload.choose}
          </label>
        </div>
      )}

      {/* Uploaded files: one sheet, a row per file on hairlines, "Add more" as its last row. */}
      {!empty && (
        <div className="overflow-hidden rounded-md border border-line bg-surface">
        <ul className="divide-y divide-line">
          {files.map((fl, i) => (
            <FileRow key={fl.id} file={fl} inputId={`${id}-r${i}`} readOnly={readOnly} onReplace={(f) => replace(i, f)} onRemove={() => remove(i)} />
          ))}
          {pending.map((p) => (
            <li key={p.key} role={p.failed ? "alert" : undefined} className={cx("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 pr-2 pl-3", p.failed && "bg-bad-soft")}>
              <span className="grid size-9 place-items-center rounded-sm bg-sunk text-[11px] font-semibold text-muted uppercase">{p.file.name.split(".").pop()?.slice(0, 4)}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.file.name}</span>
                {p.failed ? (
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-bad"><CircleAlert size={13} aria-hidden="true" />{t.upload.failedShort}</span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-[13px] text-info"><span className="size-3 rounded-full border-2 border-info/30 border-t-info motion-safe:animate-spin" aria-hidden="true" />{t.upload.uploading}</span>
                    <span className="mt-1.5 block h-1 overflow-clip rounded-sm bg-line"><i className="block h-full w-1/2 bg-accent motion-safe:animate-pulse" /></span>
                  </>
                )}
              </span>
              {p.failed && (
                <span className="flex gap-1">
                  <button type="button" onClick={() => retry(p)} className="inline-flex h-(--control-h-sm) items-center gap-1.5 rounded-md border border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover px-3 text-[13.5px] font-medium"><RotateCw size={13} aria-hidden="true" />{t.sync.retry}</button>
                  <button type="button" aria-label={t.common.removeFile(p.file.name)} onClick={() => setPending((l) => l.filter((x) => x.key !== p.key))} className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"><X size={16} aria-hidden="true" /></button>
                </span>
              )}
            </li>
          ))}
        </ul>

          {!readOnly && (
            <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-line px-3 text-[14px] font-medium text-accent transition-colors hover:bg-accent-soft">
              <Plus size={16} aria-hidden="true" />
              {t.upload.addMore}
            </label>
          )}
        </div>
      )}

      {exp && !readOnly && !files.length && (
        later && !noting ? (
          <div className="flex items-start gap-3 rounded-md bg-sunk px-4 py-3 text-[15px]">
            <Clock size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-2.5">
              <div>
                <p className="font-semibold">{t.upload.laterTitle}</p>
                {later.note && <p className="text-muted">{t.upload.laterNote(later.note)}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <label htmlFor={id + "-cam"} className={cx(btn, "cursor-pointer border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover")}><Camera size={17} aria-hidden="true" />{t.upload.uploadNow}</label>
                <button type="button" onClick={() => { setNote(later.note); setNoting(true); }} className={cx(btn, "border-transparent text-accent hover:bg-accent-soft")}>{t.upload.changeNote}</button>
              </div>
            </div>
          </div>
        ) : noting ? (
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(ev) => {
              ev.preventDefault();
              actions.setNotYet(exp.id, field, item, section ?? "", note);
              actions.answerSlot(exp.id, field, item, t.upload.notYetReply(note.trim()));
              setNoting(false);
            }}
          >
            <label className="sr-only" htmlFor={id + "-later"}>{t.upload.notYetPh}</label>
            <input id={id + "-later"} autoFocus value={note} onChange={(ev) => setNote(ev.target.value)} placeholder={t.upload.notYetPh} className={cx(inputCls, "min-w-0 flex-1")} />
            <span className="flex gap-2">
              <button type="submit" className={cx(btn, "btn-fx btn-fx-primary border-accent bg-accent text-accent-ink hover:bg-accent-hover")}>{t.upload.notYetSave}</button>
              <button type="button" onClick={() => setNoting(false)} className={cx(btn, "border-transparent text-muted hover:text-ink")}>{t.tasks.cancel}</button>
            </span>
          </form>
        ) : (
          <button type="button" onClick={() => setNoting(true)} className="self-start text-[15px] font-medium text-accent underline underline-offset-4 hover:decoration-2">{t.upload.notYet}</button>
        )
      )}
      {readOnly && !files.length && <p className="text-sm font-semibold text-bad">{t.common.missing}</p>}
    </div>
  );
}

/** An uploaded file: type, name, "Subido", and Ver / Sustituir / Quitar. */
function FileRow({ file, inputId, readOnly, onReplace, onRemove }: { file: FileRef; inputId: string; readOnly: boolean; onReplace: (f: File | undefined) => void; onRemove: () => void }) {
  const { t } = useI18n();
  const url = useFileUrl(file);
  const quiet = "inline-flex h-(--control-h-sm) items-center rounded-md px-2.5 text-[14px] font-medium text-accent hover:bg-accent-soft";
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 pr-2 pl-3">
      <FileThumb file={file} size={36} />
      <span className="min-w-0">
        <span className="block truncate font-medium" title={file.name}>{file.name}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[18px] text-muted">
          <span className="inline-flex items-center gap-1 text-ok"><Check size={13} strokeWidth={2.4} aria-hidden="true" />{t.upload.done}</span>
        </span>
      </span>
      <span className="flex items-center gap-0.5">
        {url && (
          <a href={url} {...(isHeic(file) ? { download: file.name } : { target: "_blank", rel: "noopener" })} className={cx(quiet, "max-sm:hidden")}>{t.upload.view}</a>
        )}
        {!readOnly && (
          <>
            <input id={inputId} type="file" accept={ACCEPTED} className="sr-only" onChange={(e) => { onReplace(e.target.files?.[0]); e.target.value = ""; }} />
            <label htmlFor={inputId} className={cx(quiet, "cursor-pointer max-sm:hidden")}>{t.upload.replace}</label>
            <button type="button" aria-label={t.common.removeFile(file.name)} onClick={onRemove} className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunk hover:text-ink"><X size={16} aria-hidden="true" /></button>
          </>
        )}
      </span>
    </li>
  );
}
