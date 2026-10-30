"use client";

import { useState } from "react";
import { Building2, UserRound } from "lucide-react";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { useAppState } from "@/lib/data/store";
import { fmtEuros } from "@/lib/data/fees";
import type { Activity } from "@/lib/data/activity";
import type { Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { cx } from "@/components/ui/primitives";

const SHOWN = 12;

/** Plain-language line for one history entry, in the current language. */
export function useActivityLine() {
  const { firm } = useAppState();
  const { t, tr, locale, status } = useI18n();
  const sec = (slug?: string) => {
    const s = SCHEMA.find((x) => x.slug === slug);
    return s ? tr(s.short) : "";
  };
  const member = (id?: string | null) => firm.team.find((m) => m.id === id)?.name ?? t.list.unassigned;
  const line = (a: Activity) => {
    const A = t.activity;
    switch (a.kind) {
      case "created": return a.year ? A.createdFrom(a.year) : A.created;
      case "accepted": return A.accepted;
      case "answers": return A.answers(sec(a.section));
      case "uploaded": return A.uploaded(a.files?.join(", ") ?? "", sec(a.section));
      case "removed": return A.removed(a.files?.join(", ") ?? "", sec(a.section));
      case "sent": return A.sent;
      case "resent": return A.resent;
      case "status": return A.status(a.from ? status(a.from) : "—", a.to ? status(a.to) : "—");
      case "assigned": return A.assigned(member(a.member));
      case "identity": return A.identity;
      case "signed": return A.signed(a.doc === "mandate" ? t.settings.legal.mandate : t.settings.legal.privacy);
      case "paid": return A.paid(fmtEuros(Number(a.amount ?? 0), locale));
      case "resultSent": return A.resultSent(`${a.amount ?? ""} €`);
      case "resultApproved": return A.resultApproved(`${a.amount ?? ""} €`);
      case "apRequested": return A.apRequested;
      case "apConfirmed": return A.apConfirmed;
      case "apCancelled": return A.apCancelled;
      case "prefillConfirmed": return A.prefillConfirmed(sec(a.section));
      case "nextYear": return A.nextYear(a.year ?? 0);
      case "taskAsked": return A.taskAsked(a.text ? tr(a.text) : "");
      case "taskDone": return A.taskDone(a.text ? tr(a.text) : "");
      case "taskClosed": return A.taskClosed(a.text ? tr(a.text) : "");
      case "taskReopened": return A.taskReopened(a.text ? tr(a.text) : "");
      case "taskRemoved": return A.taskRemoved(a.text ? tr(a.text) : "");
      case "notYet": return A.notYet(sec(a.section), a.text ? tr(a.text) : "");
      case "alertReviewed": return A.alertReviewed(a.text ? tr(a.text) : "");
    }
  };
  return line;
}

/** G3 · Historial de actividad: newest first, client and gestoría entries told apart. */
export function ActivityLog({ exp: e }: { exp: Expediente }) {
  const { t, locale } = useI18n();
  const line = useActivityLine();
  const [all, setAll] = useState(false);
  const list = [...(e.activity ?? [])].reverse();
  const shown = all ? list : list.slice(0, SHOWN);

  if (!list.length) return <p className="text-sm text-muted">{t.activity.none}</p>;
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col overflow-clip rounded-xl border border-line">
        {shown.map((a) => {
          const client = a.by === "cliente";
          const Icon = client ? UserRound : Building2;
          return (
            <li key={a.id} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 border-t border-line px-4 py-2.5 first:border-t-0 sm:grid-cols-[28px_minmax(0,1fr)_auto]">
              <span className={cx("grid size-7 place-items-center rounded-full", client ? "bg-info-soft text-info" : "bg-accent-soft text-accent")} title={client ? t.activity.byClient : t.activity.byGestoria}>
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 pt-0.5 text-[14px]">
                <span className="sr-only">{client ? t.activity.byClient : t.activity.byGestoria}: </span>
                {line(a)}
              </span>
              <time dateTime={a.at} className="figures col-start-2 text-[12.5px] text-muted sm:col-start-auto sm:pt-1">{fmtTime(a.at, locale)}</time>
            </li>
          );
        })}
      </ol>
      {list.length > SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="self-start text-[13px] font-medium text-accent hover:underline">
          {all ? t.activity.less : t.activity.all(list.length)}
        </button>
      )}
      <p className="text-[12.5px] text-muted">{t.activity.since}</p>
    </div>
  );
}
