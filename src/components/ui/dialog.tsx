"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";

/**
 * Modal dialog (design system › Dialog), only for decisions that are hard to
 * undo. Built on <dialog>: focus moves in and back, Escape and the backdrop close it.
 */
export function Dialog({ open, title, children, footer, onClose }: { open: boolean; title: string; children: ReactNode; footer: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dlg-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(520px,calc(100vw-32px))] rounded-xl bg-surface p-0 text-ink shadow-card backdrop:bg-[var(--scrim)]"
    >
      <div className="flex items-start gap-3 px-6 pt-6">
        <h2 id="dlg-title" className="flex-1 text-[20px] leading-7 font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={t.common.close} className="grid size-8 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-6 py-4 text-[15px]">{children}</div>
      <div className="flex flex-wrap justify-end gap-2 px-6 pt-2 pb-6">{footer}</div>
    </dialog>
  );
}
