"use client";

import { useEffect, useState } from "react";
import type { FileRef } from "@/lib/questionnaire/types";
import { isHeic, isImage, useFileUrl } from "@/lib/data/files";
import { fileExt } from "@/lib/format";
import { useI18n } from "@/lib/i18n/use-i18n";

/** Small preview of a file: image thumbnail, or its extension. */
export function FileThumb({ file, size = 40 }: { file: FileRef; size?: number }) {
  const url = useFileUrl(file);
  if (url && isImage(file))
    // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB, not optimisable
    return <img src={url} alt="" width={size} height={size} className="rounded-md object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="grid shrink-0 place-items-center rounded-md bg-accent-soft font-mono text-[10px] font-bold text-accent uppercase" style={{ width: size, height: size }}>
      {fileExt(file.name)}
    </span>
  );
}

/** A file the gestoría can open: images in a viewer, PDFs in a new tab. */
export function FileChip({ file }: { file: FileRef }) {
  const url = useFileUrl(file);
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const base = "flex max-w-full items-center gap-2 rounded-md border border-line bg-sunk py-1 pr-2.5 pl-1 font-mono text-[11.5px]";
  if (!url)
    return (
      <span className={base} title={file.example ? t.common.exampleFile : file.name}>
        <FileThumb file={file} size={28} />
        <span className="truncate">{file.name}</span>
      </span>
    );
  if (!isImage(file))
    return (
      <a href={url} {...(isHeic(file) ? { download: file.name } : { target: "_blank", rel: "noopener" })} className={base + " text-accent hover:border-line-strong"}>
        <FileThumb file={file} size={28} />
        <span className="truncate">{file.name}</span>
      </a>
    );
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={base + " cursor-zoom-in text-accent hover:border-line-strong"}>
        <FileThumb file={file} size={28} />
        <span className="truncate">{file.name}</span>
      </button>
      {open && <Lightbox src={url} name={file.name} onClose={() => setOpen(false)} />}
    </>
  );
}

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={name} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[var(--scrim)] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-w-full items-center gap-4 rounded-md border border-line bg-surface py-1.5 pr-2 pl-4">
        <span className="truncate text-[13px]">{name}</span>
        <a href={src} target="_blank" rel="noopener" className="text-sm font-semibold text-accent">
          {t.common.openSeparately}
        </a>
        <button type="button" autoFocus aria-label={t.common.close} onClick={onClose} className="px-2 text-xl text-muted">
          ×
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB */}
      <img src={src} alt={name} className="max-h-[calc(100%-64px)] max-w-full rounded-lg bg-surface object-contain" />
    </div>
  );
}
