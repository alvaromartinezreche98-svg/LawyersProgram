"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "./primitives";

/** Read-only value with a copy button. `compact`: on phones the button is the icon alone, leaving the value room. */
export function CopyField({ value, label, copyLabel, copiedLabel, compact }: { value: string; label: string; copyLabel: string; copiedLabel: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="shadow-field flex min-w-0 items-stretch overflow-clip rounded-md border border-line-strong bg-surface">
      <input readOnly aria-label={label} value={value} onFocus={(e) => e.target.select()} className="h-(--control-h) min-w-0 flex-1 bg-transparent px-3 font-mono text-[12.5px] outline-hidden" />
      <button type="button" onClick={copy} aria-label={copied ? copiedLabel : copyLabel} title={copyLabel} className={cx("inline-flex shrink-0 items-center gap-1.5 border-l border-line bg-sunk px-3 text-[13px] font-medium transition-colors hover:bg-accent-soft", compact && "max-sm:w-(--control-h) max-sm:justify-center max-sm:px-0")}>
        {copied ? <Check size={14} className="text-ok" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        <span className={cx(compact && "max-sm:sr-only")}>{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}
