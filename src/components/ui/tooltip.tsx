"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./primitives";

/**
 * A small dark help card on hover or keyboard focus: a bold title and a line or two of text.
 * The trigger becomes focusable and points at the card (aria-describedby). The card is
 * portalled and fixed above the trigger (below when there is no room), so no box clips it.
 */
export function Tooltip({ title, text, children, className }: { title?: string; text: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const below = r.top < 140;
    // centred on the trigger, kept inside the window
    const left = Math.min(Math.max(r.left + r.width / 2, 152), window.innerWidth - 152);
    setPos({ left, top: below ? r.bottom + 8 : r.top - 8, below });
  }, [open]);

  return (
    <>
      <span
        ref={anchor}
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={cx("inline-flex cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus", className)}
      >
        {children}
      </span>
      {open &&
        pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ left: pos.left, top: pos.top, translate: pos.below ? "-50% 0" : "-50% -100%" }}
            className="pointer-events-none fixed z-[70] flex w-max max-w-72 flex-col gap-1 rounded-lg bg-ink px-3.5 py-2.5 text-left text-[13px] leading-[19px] text-white shadow-[0_10px_24px_-8px_rgb(0_0_0/0.45)] motion-safe:animate-[tip-in_140ms_ease-out]"
          >
            {title && <b className="font-semibold">{title}</b>}
            <span className="text-white/80">{text}</span>
            <i className={cx("absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-ink", pos.below ? "-top-1" : "-bottom-1")} aria-hidden="true" />
          </span>,
          document.body,
        )}
    </>
  );
}
