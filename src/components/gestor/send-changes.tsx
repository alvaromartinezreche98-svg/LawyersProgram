"use client";

import { changesBetweenSends, type Activity } from "@/lib/data/activity";
import type { Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { useActivityLine } from "./activity-log";

/** G3: what the client changed since / in the last resubmission. Hidden when there is nothing new. */
export function SendChanges({ exp }: { exp: Expediente }) {
  const { t, locale } = useI18n();
  const line = useActivityLine();
  const ch = changesBetweenSends(exp);
  if (!ch || (!ch.pending.length && !ch.inLast.length)) return null;
  const when = fmtTime(ch.lastSend.at, locale);

  const group = (title: string, list: Activity[]) =>
    list.length > 0 && (
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[13px] font-semibold text-muted">{title}</h3>
        <ul className="flex flex-col gap-1 text-[14px]">
          {list.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="min-w-0">{line(a)}</span>
              <time dateTime={a.at} className="figures text-[12.5px] text-muted">{fmtTime(a.at, locale)}</time>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {group(t.changes.pending(when), ch.pending)}
      {group(t.changes.inLast(when), ch.inLast)}
    </div>
  );
}

export const hasSendChanges = (exp: Expediente) => {
  const ch = changesBetweenSends(exp);
  return !!ch && (ch.pending.length > 0 || ch.inLast.length > 0);
};
