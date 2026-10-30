"use client";

import { Download, FileSignature, ShieldCheck, Upload, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { actions, useAppState } from "@/lib/data/store";
import { MAX_FILE_BYTES, deleteFile, putFile, useFileUrl } from "@/lib/data/files";
import type { FirmDoc, LegalKind } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fileExt, fmtDate, fmtSize, uid } from "@/lib/format";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, Notice } from "@/components/ui/primitives";
import { SectionHead } from "./settings-layout";

const ACCEPT = ".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OK_EXT = ["doc", "docx", "pdf"];
const KINDS: { kind: LegalKind; icon: LucideIcon }[] = [
  { kind: "privacy", icon: ShieldCheck },
  { kind: "mandate", icon: FileSignature },
];

/** G7 · Documentos legales: the firm's own data-protection notice and mandate, which clients sign. */
export function LegalSettings() {
  const { t } = useI18n();
  return (
    <>
      <SectionHead title={t.settings.legal.title} intro={t.settings.legal.intro} />
      <div className="flex flex-col gap-4">
        {KINDS.map((k) => (
          <DocCard key={k.kind} kind={k.kind} icon={k.icon} />
        ))}
      </div>
    </>
  );
}

function DocCard({ kind, icon }: { kind: LegalKind; icon: LucideIcon }) {
  const { firm } = useAppState();
  const { t } = useI18n();
  const l = t.settings.legal;
  const doc = firm.docs[kind];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = `legal-${kind}`;

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!OK_EXT.includes(fileExt(file.name).toLowerCase())) return setError(l.onlyDocs);
    if (file.size > MAX_FILE_BYTES) return setError(t.upload.tooBig);
    setBusy(true);
    const ref = { id: uid("legal-"), name: file.name, size: file.size, type: file.type || "application/octet-stream" };
    try {
      await putFile(ref.id, file);
      // Older versions stay stored: clients who already signed keep a record of what they signed.
      actions.setFirmDoc(kind, ref);
    } catch {
      setError(t.upload.failed(file.name));
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (doc) deleteFile(doc.file.id).catch(() => {});
    actions.removeFirmDoc(kind);
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <IconTile icon={icon} tone={doc ? "accent" : "warn"} />
        <div className="min-w-0 flex-1">
          <h2 className="display-tight text-[15px] font-semibold">{kind === "privacy" ? l.privacy : l.mandate}</h2>
          <p className="text-[13.5px] text-muted">{kind === "privacy" ? l.privacyDesc : l.mandateDesc}</p>
        </div>
      </div>

      {doc ? <DocRow doc={doc} /> : (
        <Notice tone="warn">{l.missing}</Notice>
      )}

      {error && <Notice tone="bad">{error}</Notice>}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className={(doc ? "border-line bg-surface hover:border-line-strong hover:bg-sunk" : "border-accent bg-accent text-accent-ink hover:bg-accent-hover") + " inline-flex h-(--control-h) cursor-pointer items-center gap-2 rounded-md border px-4 text-[14px] font-medium transition-colors"}>
          <Upload size={15} aria-hidden="true" />
          {busy ? t.upload.uploading : doc ? l.replace : l.upload}
        </label>
        <input id={inputId} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        {doc && (
          <Button size="sm" variant="ghost" onClick={remove} className="text-bad hover:bg-bad-soft">
            {l.remove}
          </Button>
        )}
        <span className="text-[12.5px] text-muted">{l.accept}</span>
      </div>
    </Card>
  );
}

function DocRow({ doc }: { doc: FirmDoc }) {
  const { t } = useI18n();
  const url = useFileUrl(doc.file);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-sunk px-3 py-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft font-mono text-[10px] font-bold text-accent uppercase">{fileExt(doc.file.name)}</span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[14px] font-semibold">{doc.file.name}</b>
        <span className="text-[12.5px] text-muted">
          {t.settings.legal.version(doc.version, fmtDate(doc.uploadedAt.slice(0, 10)))} · {fmtSize(doc.file.size)}
        </span>
      </div>
      {url && (
        <a href={url} download={doc.file.name} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-accent hover:bg-accent-soft">
          <Download size={15} aria-hidden="true" />
          {t.settings.legal.download}
        </a>
      )}
    </div>
  );
}
