"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cx } from "./primitives";
import s from "./date-field.module.scss";

/*
 * DateField: the app's date input. The value is ISO ("yyyy-mm-dd", or "" when
 * empty), the same as the native input it replaces, so stored answers do not
 * change. The field shows and accepts dd/mm/yyyy (typed, with the slashes added
 * as you go); the button opens a calendar that starts on Monday, in the user's
 * language, fully usable from the keyboard.
 */

type Props = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};
const show = (iso: string) => {
  const d = fromIso(iso);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "";
};
/** "31/10/2026" → "2026-10-31"; null when it is not a real date. */
const parse = (text: string) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? toIso(d) : null;
};
/** Adds the slashes while typing: "3110" → "31/10", "31102026" → "31/10/2026". */
const mask = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
/** Monday-first weekday index (0 = Monday). */
const dow = (d: Date) => (d.getDay() + 6) % 7;

export function DateField({ id, value, onChange, min, max, required, disabled, className, ...aria }: Props) {
  const { t, locale } = useI18n();
  const dp = t.common.datePicker;
  const auto = useId();
  const inputId = id ?? auto;
  const [text, setText] = useState(show(value));
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [focus, setFocus] = useState<Date>(() => fromIso(value) ?? new Date());
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  // A new value from outside (another field, a reset) shows in the field.
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(show(value));
  }

  const allowed = (d: Date) => (!min || toIso(d) >= min) && (!max || toIso(d) <= max);
  const commit = (iso: string) => {
    onChange(iso);
    setText(show(iso));
  };

  const openAt = () => {
    const start = fromIso(value) ?? new Date();
    setFocus(start);
    // Opens upwards when there is not enough room below.
    const r = box.current?.getBoundingClientRect();
    setUp(!!r && window.innerHeight - r.bottom < 380 && r.top > 380);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keeps keyboard focus on the focused day while the calendar is open.
  useEffect(() => {
    if (!open) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${toIso(focus)}"]`)?.focus();
  }, [open, focus]);

  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -dow(focus)),
      End: () => addDays(focus, 6 - dow(focus)),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocus(moves[e.key]());
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  // The month on screen: six weeks from the Monday on or before the 1st.
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const start = addDays(first, -dow(first));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const todayIso = toIso(new Date());
  // "agosto de 2027" → "Agosto de 2027": only the first letter, so "de"/"del" stay lowercase.
  const rawTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(first);
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short" }).format(addDays(new Date(2024, 0, 1), i)));
  const longDate = (d: Date) => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  const invalid = text !== "" && !parse(text);

  return (
    <div ref={box} className={cx(s.root, className)} onKeyDown={(e) => e.key === "Escape" && open && close()}>
      <div className={s.control}>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={dp.placeholder}
          value={text}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          onChange={(e) => {
            const next = mask(e.target.value);
            setText(next);
            const iso = parse(next);
            if (iso) onChange(iso);
            else if (next === "") onChange("");
          }}
          onBlur={() => {
            // A half-typed or impossible date goes back to the last good value.
            if (text && !parse(text)) setText(show(value));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && e.altKey) {
              e.preventDefault();
              openAt();
            }
          }}
          className={cx("field", s.input)}
        />
        <button
          ref={trigger}
          type="button"
          disabled={disabled}
          aria-label={dp.open}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openAt())}
          className={s.trigger}
        >
          <CalendarDays size={17} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div role="dialog" aria-modal="false" aria-label={title} className={cx(s.panel, up && s.up)}>
          <div className={s.head}>
            <button type="button" aria-label={dp.prev} onClick={() => setFocus(addMonths(focus, -1))} className={s.nav}>
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <p className={s.title} aria-live="polite">{title}</p>
            <button type="button" aria-label={dp.next} onClick={() => setFocus(addMonths(focus, 1))} className={s.nav}>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>

          <div ref={grid} role="grid" aria-label={title} className={s.grid} onKeyDown={onGridKey}>
            <div role="row" className={s.week}>
              {weekdays.map((w) => (
                <span key={w} role="columnheader" className={s.weekday} title={w}>
                  {w.replace(".", "").slice(0, 2)}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, r) => (
              <div key={r} role="row" className={s.week}>
                {days.slice(r * 7, r * 7 + 7).map((d) => {
                  const iso = toIso(d);
                  const outside = d.getMonth() !== first.getMonth();
                  const ok = allowed(d);
                  return (
                    <span key={iso} role="gridcell" aria-selected={iso === value}>
                      <button
                        type="button"
                        data-iso={iso}
                        tabIndex={iso === toIso(focus) ? 0 : -1}
                        disabled={!ok}
                        aria-label={longDate(d)}
                        aria-current={iso === todayIso ? "date" : undefined}
                        onClick={() => {
                          commit(iso);
                          close();
                        }}
                        className={s.day}
                        data-outside={outside || undefined}
                        data-selected={iso === value || undefined}
                        data-today={iso === todayIso || undefined}
                      >
                        {d.getDate()}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={s.foot}>
            <button
              type="button"
              onClick={() => {
                commit("");
                close();
              }}
              className={s.footBtn}
            >
              {dp.clear}
            </button>
            <button
              type="button"
              disabled={!allowed(new Date())}
              onClick={() => {
                commit(todayIso);
                close();
              }}
              className={cx(s.footBtn, s.footToday)}
            >
              {dp.today}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
