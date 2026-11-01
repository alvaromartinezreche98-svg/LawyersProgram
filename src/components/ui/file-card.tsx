"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Eye, FileImage, FileText, RefreshCw, X } from "lucide-react";
import type { FileRef } from "@/lib/questionnaire/types";
import { isHeic, isImage, useFileUrl } from "@/lib/data/files";
import { fileExt } from "@/lib/format";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "./primitives";
import { FileThumb } from "./file-chip";

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * A file as a card, like a cloud drive: a preview on top (the image itself, or a page icon for
 * PDFs), the name and type/size below. Hovering (or focusing) shows quick actions over the
 * preview: preview in a dialog, download, and replace (the question it belongs to).
 */
export function FileCard({ file, replaceHref }: { file: FileRef; replaceHref?: string }) {
  const { t } = useI18n();
  const c = t.docs.card;
  const url = useFileUrl(file);
  const [open, setOpen] = useState(false);
  const pdf = !isImage(file) && !isHeic(file);
  const ext = fileExt(file.name);

  const act = "grid size-8 cursor-pointer place-items-center rounded-full bg-surface/95 text-ink shadow-[0_2px_8px_rgb(0_0_0/0.18)] transition-[background-color,color,scale] hover:scale-105 hover:bg-surface hover:text-accent";
  return (
    <div className="group/file flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow,translate] duration-200 hover:border-line-strong/60 hover:shadow-[0_10px_24px_-14px_rgb(var(--accent-rgb)/0.45)] motion-safe:hover:-translate-y-0.5 focus-within:border-accent">
      {/* Preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-sunk">
        {url && isImage(file) ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB, not optimisable
          <img src={url} alt="" className="size-full object-cover transition-transform duration-500 group-hover/file:scale-[1.04]" />
        ) : (
          <div className="grid size-full place-items-center">
            <span className={cx("relative grid h-11 w-9 place-items-center rounded-md border bg-surface shadow-sm", pdf ? "border-bad/20 text-bad" : "border-accent/15 text-accent")}>
              {pdf ? <FileText size={18} strokeWidth={1.6} aria-hidden="true" /> : <FileImage size={18} strokeWidth={1.6} aria-hidden="true" />}
              <span className={cx("absolute -bottom-1.5 rounded px-1 font-mono text-[8.5px] leading-[13px] font-bold uppercase text-white", pdf ? "bg-bad" : "bg-accent")}>{ext}</span>
            </span>
          </div>
        )}
        {file.example && <span className="absolute top-1.5 left-1.5 rounded-full bg-surface/90 px-1.5 py-px text-[10.5px] font-medium text-muted">{c.example}</span>}
        {/* Quick actions over the preview */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/35 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/file:opacity-100 group-focus-within/file:opacity-100">
          <button type="button" onClick={() => setOpen(true)} aria-label={`${c.preview}: ${file.name}`} title={c.preview} className={act}>
            <Eye size={15} strokeWidth={1.9} aria-hidden="true" />
          </button>
          {url && (
            <a href={url} download={file.name} aria-label={`${c.download}: ${file.name}`} title={c.download} className={act}>
              <Download size={15} strokeWidth={1.9} aria-hidden="true" />
            </a>
          )}
          {replaceHref && (
            <Link href={replaceHref} aria-label={`${c.replace}: ${file.name}`} title={c.replace} className={act}>
              <RefreshCw size={14} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
      {/* Name and details */}
      <div className="flex min-w-0 items-center gap-2 border-t border-line px-2.5 py-2">
        <span className={cx("grid size-6 shrink-0 place-items-center rounded-md", pdf ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent")} aria-hidden="true">
          {pdf ? <FileText size={12} /> : <FileImage size={12} />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] leading-[18px] font-medium text-ink" title={file.name}>{file.name}</span>
          <span className="block text-[11px] leading-4 text-muted uppercase">{ext}{file.size ? ` · ${kb(file.size)}` : ""}</span>
        </span>
      </div>
      {open && <PreviewDialog file={file} url={url} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Full preview in a dialog: images and PDFs shown in place, with download and open-in-tab. */
export function PreviewDialog({ file, url, onClose }: { file: FileRef; url: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const c = t.docs.card;
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) {
      d.showModal();
      d.focus(); // the dialog itself, not its first button (no ring on a mouse open)
    }
  }, []);
  const image = isImage(file);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-label={file.name}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cx("m-auto flex w-[min(960px,calc(100vw-32px))] flex-col", url ? "h-[min(88dvh,900px)]" : "h-auto max-w-[480px]", "overflow-hidden rounded-2xl border-0 bg-surface p-0 shadow-[0_32px_64px_-16px_rgb(0_0_0/0.5)] outline-none backdrop:bg-[rgb(15_23_32/0.6)] backdrop:backdrop-blur-[3px]")}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-line py-2.5 pr-2.5 pl-5">
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{file.name}</span>
        {url && (
          <>
            <a href={url} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-accent hover:bg-accent-soft">
              <ExternalLink size={15} aria-hidden="true" />
              <span className="max-sm:sr-only">{c.openTab}</span>
            </a>
            <a href={url} download={file.name} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-ink hover:bg-accent-hover">
              <Download size={15} aria-hidden="true" />
              <span className="max-sm:sr-only">{c.download}</span>
            </a>
          </>
        )}
        <button type="button" onClick={onClose} aria-label={c.close} className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted hover:bg-hover hover:text-ink">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center bg-sunk">
        {!url ? (
          <p className="max-w-[40ch] px-8 py-12 text-center text-[14px] text-muted">{c.exampleNote}</p>
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
          <img src={url} alt={file.name} className="max-h-full max-w-full object-contain p-4" />
        ) : isHeic(file) ? (
          <p className="p-8 text-center text-[14px] text-muted">{file.name}</p>
        ) : (
          <iframe src={url} title={file.name} className="size-full border-0 bg-surface" />
        )}
      </div>
    </dialog>
  );
}

/**
 * A file as a compact row (the gestoría's documents table): a thumbnail (the image itself, or a
 * coloured page for PDFs), name and type/size, and two quick actions: preview and download.
 */
export function FileTile({ file }: { file: FileRef }) {
  const { t } = useI18n();
  const c = t.docs.card;
  const url = useFileUrl(file);
  const [open, setOpen] = useState(false);
  const pdf = !isImage(file) && !isHeic(file);
  const act = "grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted pointer-coarse:size-10 transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-focus";
  return (
    <div className="group/tile flex w-full max-w-[280px] min-w-0 items-center gap-2.5 rounded-lg border border-line bg-surface py-1.5 pr-1.5 pl-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] hover:border-line-strong/60 hover:shadow-sm">
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 cursor-zoom-in rounded-md" aria-label={`${c.preview}: ${file.name}`}>
        {pdf ? (
          <span className="relative grid size-9 place-items-center rounded-md bg-bad-soft text-bad">
            <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="absolute -bottom-1 rounded-sm bg-bad px-1 font-mono text-[7.5px] leading-[11px] font-bold text-white uppercase">{fileExt(file.name)}</span>
          </span>
        ) : (
          <span className="block overflow-hidden rounded-md ring-1 ring-line">
            <FileThumb file={file} size={36} />
          </span>
        )}
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] leading-[18px] font-medium text-ink" title={file.name}>{file.name}</span>
        <span className="block text-[11px] leading-4 text-muted uppercase">
          {fileExt(file.name)}
          {file.size ? ` · ${kb(file.size)}` : file.example ? ` · ${c.example}` : ""}
        </span>
      </span>
      <button type="button" onClick={() => setOpen(true)} className={act} aria-label={`${c.preview}: ${file.name}`} title={c.preview}>
        <Eye size={15} aria-hidden="true" />
      </button>
      {url ? (
        <a href={url} download={file.name} className={act} aria-label={`${c.download}: ${file.name}`} title={c.download}>
          <Download size={15} aria-hidden="true" />
        </a>
      ) : (
        <span className={cx(act, "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted")} title={c.exampleNote} aria-hidden="true">
          <Download size={15} />
        </span>
      )}
      {open && <PreviewDialog file={file} url={url} onClose={() => setOpen(false)} />}
    </div>
  );
}
