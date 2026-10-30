import { Check, type LucideIcon } from "lucide-react";
import type { SectionState } from "@/lib/questionnaire/progress";
import { cx } from "./primitives";

/** Section glyph (design system › Progress): a green check when done, half-filled in progress, hollow not started. */
export function StepDot({ n, state, icon: Icon, size = 24 }: { n?: number; state: SectionState | "none"; icon?: LucideIcon; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cx(
        "grid shrink-0 place-items-center rounded-full border-[1.5px] text-[12px] font-semibold",
        state === "done" ? "border-ok bg-ok text-surface"
        : state === "partial" ? "border-accent bg-[linear-gradient(90deg,var(--accent-soft)_50%,var(--surface)_50%)] text-accent"
        : "border-line-strong bg-surface text-muted",
      )}
    >
      {state === "done" ? <Check size={13} strokeWidth={3} /> : Icon ? <Icon size={13} strokeWidth={2.2} /> : n}
    </span>
  );
}

/** One segment per section: green done, navy in progress, line not started. */
export function SegMeter({ states, className }: { states: SectionState[]; className?: string }) {
  return (
    <div className={cx("flex gap-[3px]", className)} aria-hidden="true">
      {states.map((st, i) => (
        <i key={i} className={cx("h-1.5 flex-1 rounded-[3px]", st === "done" ? "bg-ok" : st === "partial" ? "bg-accent" : "bg-line")} />
      ))}
    </div>
  );
}
