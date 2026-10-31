"use client";

import type { ReactNode } from "react";
import type { AnswerValue, Answers, Field } from "@/lib/questionnaire/types";
import { asItems, isFilled, showsKids } from "@/lib/questionnaire/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate } from "@/lib/format";

const mono = (x: Field) => x.type === "money" || x.type === "pct" || x.type === "number" || !!x.mono;

/** Read-only list of answers for the gestoría, with missing answers flagged. */
/**
 * `layout="grid"` (the gestoría's case page): each answer is a small label over its value, laid out
 * in two columns by the caller's grid; groups and follow-up questions span the full width as soft
 * cards. The default is one row per answer, label and value side by side.
 */
export function AnswersSummary({ fields, scope, layout = "rows" }: { fields: Field[]; scope: Answers; layout?: "rows" | "grid" }) {
  const grid = layout === "grid";
  const Row = grid ? Cell : Line;
  const { t, tr } = useI18n();

  const display = (x: Field, v: AnswerValue | undefined): string | null => {
    if (!isFilled(x, v)) return null;
    switch (x.type) {
      case "yn":
        return v === "si" ? t.common.yes : t.common.no;
      case "choice":
      case "select": {
        const c = x.choices?.find((c) => c[0] === v);
        return c ? tr(c[1]) : String(v);
      }
      case "upload":
        return t.common.nFiles((v as unknown[]).length);
      case "money":
        return `${v} €`;
      case "pct":
        return `${v} %`;
      case "date":
        return fmtDate(v as string);
      default:
        return String(v);
    }
  };

  return (
    <>
      {fields.map((x) => {
        const v = scope[x.id];
        if (x.type === "repeat") {
          const items = asItems(v);
          if (!items.length)
            return (
              <Row key={x.id} label={tr(x.label)}>
                <span className="font-semibold text-bad">{t.common.noneAdded}</span>
              </Row>
            );
          return items.map((it, i) =>
            grid ? (
              <div key={x.id + i} className="col-span-full my-2 rounded-lg border border-line bg-sunk/40 px-4 pt-3 pb-2">
                <div className="mb-1 text-[13px] font-semibold text-ink">
                  {x.item && tr(x.item)} {i + 1}
                </div>
                <div className="grid gap-x-8 md:grid-cols-2">
                  <AnswersSummary fields={x.fields ?? []} scope={it} layout="grid" />
                </div>
              </div>
            ) : (
              <div key={x.id + i} className="my-1 border-l-2 border-line pl-3.5">
                <div className="display-tight pt-1.5 pb-0.5 text-sm font-semibold">
                  {x.item && tr(x.item)} {i + 1}
                </div>
                <AnswersSummary fields={x.fields ?? []} scope={it} />
              </div>
            ),
          );
        }
        const val = display(x, v);
        return (
          <div key={x.id} className={grid ? "contents" : undefined}>
            {!(x.opt && val == null) && (
              <Row label={tr(x.label)}>
                {val == null ? (
                  grid ? <span className="inline-flex items-center gap-1 rounded-sm bg-bad-soft px-1.5 py-0.5 text-[12px] font-semibold text-bad">{t.common.notAnswered}</span> : <span className="font-semibold text-bad">{t.common.notAnswered}</span>
                ) : (
                  <span className={mono(x) ? "font-mono" : undefined}>{val}</span>
                )}
              </Row>
            )}
            {showsKids(x, v) &&
              (grid ? (
                <div className="col-span-full my-2 grid gap-x-8 rounded-lg border-l-2 border-accent/20 bg-sunk/40 py-1 pr-4 pl-4 md:grid-cols-2">
                  <AnswersSummary fields={x.kids ?? []} scope={scope} layout="grid" />
                </div>
              ) : (
                <div className="my-1 border-l-2 border-line pl-3.5">
                  <AnswersSummary fields={x.kids ?? []} scope={scope} />
                </div>
              ))}
          </div>
        );
      })}
    </>
  );
}

/** Grid layout: a small muted label over the value. */
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line/70 py-2.5">
      <dt className="text-[12.5px] leading-[18px] text-muted">{label}</dt>
      <dd className="mt-0.5 min-w-0 text-[14px] font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0 border-t border-dashed border-line py-1.5 text-[13.5px] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-3 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-6">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}
