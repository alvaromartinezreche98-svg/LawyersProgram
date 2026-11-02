"use client";

import { useState } from "react";
import { CircleCheck, Hourglass, Send, Upload } from "lucide-react";
import { actions } from "@/lib/data/store";
import { putFile } from "@/lib/data/files";
import type { Expediente, TaxResult } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime, uid } from "@/lib/format";
import { FileChip } from "@/components/ui/file-chip";
import { Button, Notice, cx } from "@/components/ui/primitives";

const field = "field h-(--control-h) text-[15px]";

/** G3 · Result and approval: the gestoría sends the outcome; the client's approval shows here. */
export function ResultPanel({ exp }: { exp: Expediente }) {
  const { t, locale } = useI18n();
  const r = exp.result;
  const [editing, setEditing] = useState(false);
  const approved = !!r?.approval && r.approval.version === r.version;

  if (!r || editing) return <ResultForm exp={exp} initial={r} onDone={() => setEditing(false)} onCancel={r ? () => setEditing(false) : undefined} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className={cx("text-[12.5px] font-medium", r.kind === "devolver" ? "text-ok" : "text-warn")}>{t.result.kind[r.kind]}</span>
          <b className="figures block text-[22px] leading-tight font-semibold">{r.amount} €</b>
        </div>
        <span className="text-[12.5px] text-muted">{t.resultG.sentOn(fmtTime(r.sentAt, locale), r.version)}</span>
      </div>
      {r.file && <FileChip file={r.file} />}
      {r.note && <p className="text-[13.5px] text-muted">{r.note}</p>}
      {approved ? (
        <Notice tone="ok">{t.resultG.approvedBy(r.approval!.approvedBy || "—", fmtTime(r.approval!.approvedAt, locale))}</Notice>
      ) : (
        <p className="flex items-center gap-2 text-[13.5px] text-warn">
          <Hourglass size={15} aria-hidden="true" />
          {t.resultG.waiting}
        </p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        {approved && exp.status !== "listo" && (
          <Button size="sm" variant="primary" onClick={() => actions.setStatus(exp.id, "listo")}>
            <CircleCheck size={15} aria-hidden="true" />
            {t.resultG.markReady}
          </Button>
        )}
        <Button size="sm" onClick={() => setEditing(true)}>
          {t.resultG.resend}
        </Button>
      </div>
    </div>
  );
}

function ResultForm({ exp, initial, onDone, onCancel }: { exp: Expediente; initial?: TaxResult; onDone: () => void; onCancel?: () => void }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<TaxResult["kind"]>(initial?.kind ?? "devolver");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [file, setFile] = useState(initial?.file ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = `res-${exp.id}`;

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const ref = { id: uid("res-"), name: f.name, size: f.size, type: f.type || "application/pdf" };
    try {
      await putFile(ref.id, f);
      setFile(ref);
    } finally {
      setBusy(false);
    }
  }
  const send = () => {
    if (!amount.trim()) return setError(t.resultG.amountRequired);
    actions.sendResult(exp.id, { kind, amount: amount.trim(), file, note: note.trim() });
    onDone();
  };

  return (
    <div className="flex flex-col gap-4">
      {!initial && <p className="text-[13.5px] text-muted">{t.resultG.empty}</p>}
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,220px)] sm:items-end">
        <div role="radiogroup" aria-label={t.resultG.kind} className="flex gap-2">
          {(["devolver", "pagar"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cx("h-(--control-h) rounded-md border px-4 text-[14px] font-medium transition-colors", kind === k ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface shadow-field hover:border-line-strong")}>
              {t.result.kind[k]}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
          {t.resultG.amount}
          <span className="shadow-field flex h-(--control-h) items-center overflow-clip rounded-md border border-line-strong bg-surface focus-within:border-focus focus-within:ring-4 focus-within:ring-focus/15">
            <input inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} className="figures h-full w-full bg-transparent px-3 text-right font-normal outline-hidden" />
            <span className="grid h-full place-items-center border-l border-line bg-sunk px-3 font-normal text-muted">€</span>
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-medium">{t.resultG.file}</span>
        {file && <FileChip file={file} />}
        <label htmlFor={id} className="inline-flex h-(--control-h-sm) cursor-pointer items-center gap-2 rounded-md border border-accent/25 btn-fx btn-fx-soft bg-accent-soft hover:border-accent/45 text-accent hover:bg-accent-soft-hover px-3 text-[13px] font-medium transition-colors">
          <Upload size={14} aria-hidden="true" />
          {busy ? t.upload.uploading : file ? t.resultG.replace : t.resultG.upload}
        </label>
        <input id={id} type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        {t.resultG.note}
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field + " h-auto resize-y py-2 font-normal"} />
      </label>
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={send}>
          <Send size={15} aria-hidden="true" />
          {t.resultG.send}
        </Button>
        {onCancel && <Button onClick={onCancel}>{t.resultG.cancel}</Button>}
      </div>
    </div>
  );
}
