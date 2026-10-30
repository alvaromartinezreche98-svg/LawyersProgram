"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Read-only value with a copy button. */
export function CopyField({ value, label, copyLabel, copiedLabel }: { value: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="flex min-w-0 items-stretch overflow-clip rounded-md border border-line-strong bg-surface">
      <input readOnly aria-label={label} value={value} onFocus={(e) => e.target.select()} className="h-(--control-h) min-w-0 flex-1 bg-transparent px-3 font-mono text-[12.5px] outline-hidden" />
      <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 border-l border-line bg-sunk px-3 text-[13px] font-medium transition-colors hover:bg-accent-soft">
        {copied ? <Check size={14} className="text-ok" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
