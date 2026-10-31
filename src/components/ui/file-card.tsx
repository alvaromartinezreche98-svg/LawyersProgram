"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Eye, FileImage, FileText, RefreshCw, X } from "lucide-react";
import type { FileRef } from "@/lib/questionnaire/types";
import { isHeic, isImage, useFileUrl } from "@/lib/data/files";
import { fileExt } from "@/lib/format";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "./primitives";

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

  const act = "grid size-9 cursor-pointer place-items-center rounded-full bg-surface/95 text-ink shadow-[0_2px_8px_rgb(0_0_0/0.18)] transition-[background-color,color,scale] hover:scale-105 hover:bg-surface hover:text-accent";
  return (
    <div className="group/file flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow,translate] duration-200 hover:border-line-strong/60 hover:shadow-[0_10px_24px_-14px_rgb(var(--accent-rgb)/0.45)] motion-safe:hover:-translate-y-0.5 focus-within:border-accent">
      {/* Preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sunk">
        {url && isImage(file) ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB, not optimisable
          <img src={url} alt="" className="size-full object-cover transition-transform duration-500 group-hover/file:scale-[1.04]" />
        ) : (
          <div className="grid size-full place-items-center">
            <span className={cx("relative grid h-16 w-13 place-items-center rounded-md border bg-surface shadow-sm", pdf ? "border-bad/20 text-bad" : "border-accent/15 text-accent")}>
              {pdf ? <FileText size={26} strokeWidth={1.5} aria-hidden="true" /> : <FileImage size={26} strokeWidth={1.5} aria-hidden="true" />}
              <span className={cx("absolute -bottom-2 rounded px-1.5 py-px font-mono text-[10px] font-bold uppercase text-white", pdf ? "bg-bad" : "bg-accent")}>{ext}</span>
            </span>
          </div>
        )}
        {file.example && <span className="absolute top-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-muted">{c.example}</span>}
        {/* Quick actions over the preview */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/35 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/file:opacity-100 group-focus-within/file:opacity-100">
          <button type="button" onClick={() => setOpen(true)} aria-label={`${c.preview}: ${file.name}`} title={c.preview} className={act}>
            <Eye size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
          {url && (
            <a href={url} download={file.name} aria-label={`${c.download}: ${file.name}`} title={c.download} className={act}>
              <Download size={17} strokeWidth={1.9} aria-hidden="true" />
            </a>
          )}
          {replaceHref && (
            <Link href={replaceHref} aria-label={`${c.replace}: ${file.name}`} title={c.replace} className={act}>
              <RefreshCw size={16} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
      {/* Name and details */}
      <div className="flex min-w-0 items-center gap-2.5 border-t border-line px-3 py-2.5">
        <span className={cx("grid size-7 shrink-0 place-items-center rounded-md", pdf ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent")} aria-hidden="true">
          {pdf ? <FileText size={14} /> : <FileImage size={14} />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-ink" title={file.name}>{file.name}</span>
          <span className="block text-[11.5px] text-muted uppercase">{ext}{file.size ? ` · ${kb(file.size)}` : ""}</span>
        </span>
      </div>
      {open && <PreviewDialog file={file} url={url} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Full preview in a dialog: images and PDFs shown in place, with download and open-in-tab. */
function PreviewDialog({ file, url, onClose }: { file: FileRef; url: string | null; onClose: () => void }) {
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
