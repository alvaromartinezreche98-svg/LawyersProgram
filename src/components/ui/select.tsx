"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cx } from "./primitives";

export interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Options with the same group are listed under its name (like <optgroup>). */
  group?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  name?: string;
  /** Shown (muted) while the value matches no option. */
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Layout of the control in its row (width, flex). */
  className?: string;
  /** Extra classes for the button, on top of the shared .field look (height, text size). */
  buttonClassName?: string;
  /** A custom button face (e.g. the team role chip): replaces the .field look entirely. */
  trigger?: { className: string; content: (open: boolean) => ReactNode };
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Marks the floating list, so menus that close on an outside click can let clicks in it through. */
export const SELECT_PANEL_ATTR = "data-select-panel";

/**
 * The app's dropdown (replaces the native <select>): a .field button with the chosen option and a
 * chevron, and a floating list with one row per option (its icon on a small tile, a check on the
 * chosen one). The list is portalled and fixed, so no scrolling box clips it; it flips above
 * when there is no room below. Keyboard: ↑ ↓ / Enter / Space open, ↑ ↓ Home End move, Enter picks,
 * Escape or Tab closes. A hidden input carries `name` and `required` for forms.
 */
export function Select({ value, onChange, options, id, name, placeholder, disabled, required, className, buttonClassName, trigger, ...aria }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean; max: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 220 && above > below;
    setPos({ left: r.left, top: up ? r.top - 6 : r.bottom + 6, width: r.width, up, max: Math.min(320, Math.max(140, up ? above : below)) });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const chosen = panel.current?.querySelector<HTMLButtonElement>("[aria-selected=true]");
    (chosen ?? panel.current)?.focus({ preventScroll: true });
    chosen?.scrollIntoView({ block: "nearest" });
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const follow = () => place();
    document.addEventListener("pointerdown", away);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };
  const pick = (v: string) => {
    if (v !== value) onChange(v);
    close();
  };
  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };
  const onPanelKey = (e: KeyboardEvent) => {
    const items = [...(panel.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? [])];
    let i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (i < 0) i = items.findIndex((b) => b.getAttribute("aria-selected") === "true");
      const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  };

  const Icon = current?.icon;
  return (
    <div className={cx("relative min-w-0", className)}>
      <button
        ref={btn}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        {...aria}
        onClick={() => setOpen(!open)}
        onKeyDown={onButtonKey}
        className={
          trigger
            ? trigger.className
            : cx("field flex w-full cursor-pointer items-center gap-2 text-left disabled:cursor-not-allowed disabled:text-muted", open && "border-accent shadow-[inset_0_0_0_1px_var(--accent),0_0_0_4px_rgb(var(--accent-rgb)/0.2)]", buttonClassName)
        }
      >
        {trigger ? (
          trigger.content(open)
        ) : (
          <>
            {Icon && <Icon size={15} className="shrink-0 text-accent" aria-hidden="true" />}
            <span className={cx("min-w-0 flex-1 truncate", !current && "text-disabled")}>{current?.label ?? placeholder ?? ""}</span>
            <ChevronDown size={16} strokeWidth={2.2} className={cx("shrink-0 text-muted motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")} aria-hidden="true" />
          </>
        )}
      </button>
      {(name || required) && <input tabIndex={-1} aria-hidden="true" className="sr-only" name={name} required={required} value={value} onChange={() => {}} onFocus={() => btn.current?.focus()} />}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panel}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={aria["aria-label"]}
            aria-labelledby={aria["aria-labelledby"]}
            {...{ [SELECT_PANEL_ATTR]: "" }}
            onKeyDown={onPanelKey}
            style={{ left: pos.left, top: pos.top, minWidth: pos.width, maxHeight: pos.max, translate: pos.up ? "0 -100%" : undefined }}
            className="fixed z-[60] flex w-max max-w-[min(420px,calc(100vw-24px))] flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface p-1.5 shadow-[0_10px_15px_-3px_rgb(var(--accent-rgb)/0.12),0_4px_6px_-4px_rgb(var(--accent-rgb)/0.1)] outline-none [scrollbar-width:thin]"
          >
            {options.map((o, i) => {
              const on = o.value === value;
              const heading = o.group && o.group !== options[i - 1]?.group;
              return (
                <Fragment key={o.value}>
                {heading && <span className="t-label shrink-0 px-3 pt-2.5 pb-1 text-muted" aria-hidden="true">{o.group}</span>}
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  tabIndex={-1}
                  onClick={() => pick(o.value)}
                  className={cx(
                    "group flex min-h-10 w-full shrink-0 cursor-pointer items-center gap-3 rounded-md px-3 text-left text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                    o.icon && "pl-1.5",
                    on ? "bg-accent-soft font-semibold text-accent" : "text-ink hover:bg-hover",
                  )}
                >
                  {o.icon && (
                    <span className={cx("grid size-7 shrink-0 place-items-center rounded-md transition-colors", on ? "bg-accent text-accent-ink" : "bg-sunk text-muted group-hover:text-accent")} aria-hidden="true">
                      <o.icon size={15} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {on && <Check size={15} className="shrink-0 text-accent" aria-hidden="true" />}
                </button>
                </Fragment>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
