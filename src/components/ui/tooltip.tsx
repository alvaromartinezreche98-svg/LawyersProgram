"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./primitives";

/**
 * A small dark help card on hover or keyboard focus: a bold title and a line or two of text.
 * The trigger becomes focusable and points at the card (aria-describedby). The card is
 * portalled and fixed above the trigger (below when there is no room), so no box clips it.
 */
export function Tooltip({ title, text, body, children, className, side = "top", disabled, plain, inline }: {
  title?: string;
  text: string;
  /** Richer content in place of `text` (a short list); `text` stays as its plain summary. */
  body?: ReactNode;
  children: ReactNode;
  className?: string;
  /** "right": beside the trigger, centred on it (the folded sidebar's labels). */
  side?: "top" | "right";
  disabled?: boolean;
  /** The trigger is already focusable (a link or button): no tab stop or help cursor of its own. */
  plain?: boolean;
  /** With `plain`: the trigger sits in a line of text (a chip), not as a block. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean; right?: boolean } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    if (side === "right") {
      setPos({ left: r.right + 12, top: r.top + r.height / 2, below: false, right: true });
      return;
    }
    const below = r.top < 140;
    // centred on the trigger, kept inside the window
    const left = Math.min(Math.max(r.left + r.width / 2, 152), window.innerWidth - 152);
    setPos({ left, top: below ? r.bottom + 8 : r.top - 8, below });
  }, [open, side]);

  return (
    <>
      <span
        ref={anchor}
        tabIndex={plain ? undefined : 0}
        aria-describedby={open && !disabled ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={cx(plain ? (inline ? "inline-flex" : "block") : "inline-flex cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus", className)}
      >
        {children}
      </span>
      {open &&
        pos &&
        !disabled &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ left: pos.left, top: pos.top, translate: pos.right ? "0 -50%" : pos.below ? "-50% 0" : "-50% -100%" }}
            className="pointer-events-none fixed z-[70] flex w-max max-w-72 flex-col gap-1 rounded-lg bg-ink px-3.5 py-2.5 text-left text-[13px] leading-[19px] text-white shadow-[0_10px_24px_-8px_rgb(0_0_0/0.45)] motion-safe:animate-[tip-in_140ms_ease-out]"
          >
            {title && <b className="font-semibold">{title}</b>}
            {body ?? <span className="text-white/80">{text}</span>}
            <i className={cx("absolute size-2.5 rotate-45 bg-ink", pos.right ? "top-1/2 -left-1 -translate-y-1/2" : cx("left-1/2 -translate-x-1/2", pos.below ? "-top-1" : "-bottom-1"))} aria-hidden="true" />
          </span>,
          document.body,
        )}
    </>
  );
}
