"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, CalendarDays, Phone } from "lucide-react";
import { actions, clientName, useAppState } from "@/lib/data/store";
import type { Appointment, Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, EmptyState, Pill, cx } from "@/components/ui/primitives";
import { AP_TONE } from "@/components/client/client-appointment";
import { TopBar } from "./gestor-shell";

type Filter = "solicitada" | "confirmada" | "all";
const ctl = "h-(--control-h-sm) rounded-md border border-line-strong bg-surface px-2 text-[13px] outline-hidden focus:border-focus focus:ring-1 focus:ring-focus";

/** G5 · Citas: requests from every case; confirm with a time and an accountant, or cancel. */
export function Appointments() {
  const { exps } = useAppState();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("solicitada");
  const all = Object.values(exps).flatMap((e) => (e.appointments ?? []).map((a) => ({ e, a })));
  const count = (f: Filter) => (f === "all" ? all.length : all.filter((x) => x.a.status === f).length);
  const shown = all.filter((x) => filter === "all" || x.a.status === filter).sort((x, y) => x.a.date.localeCompare(y.a.date) || x.a.slot.localeCompare(y.a.slot));

  return (
    <>
      <PageTitle>{t.titles.citas}</PageTitle>
      <TopBar crumbs={[{ label: t.citas.title }]} />
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div>
          <h1 className="display-tight text-[clamp(20px,2vw,24px)] font-semibold">{t.citas.title}</h1>
          <p className="mt-1 text-[14px] text-muted">{t.citas.intro}</p>
        </div>
        <div role="group" aria-label={t.citas.title} className="flex gap-0.5 self-start rounded-md border border-line bg-sunk p-0.5">
          {(["solicitada", "confirmada", "all"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cx("flex h-(--control-h-sm) items-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium", filter === f ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink")}>
              {t.citas.filter[f]}
              <span className="figures text-[11.5px] text-muted">{count(f)}</span>
            </button>
          ))}
        </div>
        <div className="overflow-clip rounded-lg border border-line bg-surface">
          {shown.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t.citas.none} />
          ) : (
            <ul>
              {shown.map(({ e, a }) => (
                <Row key={a.id} e={e} a={a} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ e, a }: { e: Expediente; a: Appointment }) {
  const { firm } = useAppState();
  const { t, locale } = useI18n();
  const [time, setTime] = useState(a.time ?? (a.slot === "manana" ? "10:00" : "17:00"));
  const [who, setWho] = useState(a.assignee ?? e.assignee ?? "");
  return (
    <li className="grid gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
      <div className="min-w-0">
        <Link href={`/expedientes/${e.id}`} className="block truncate font-medium hover:underline">
          {clientName(e) || t.common.unnamedClient}
        </Link>
        <span className="text-[12.5px] text-muted">{typeof e.answers.telefono === "string" && e.answers.telefono ? e.answers.telefono : t.citas.requested(fmtTime(a.createdAt, locale))}</span>
      </div>
      <div className="min-w-0">
        <span className="flex items-center gap-2 text-[14px]">
          {a.kind === "llamada" ? <Phone size={14} aria-hidden="true" /> : <Building2 size={14} aria-hidden="true" />}
          {t.cita.kind[a.kind]}
          <Pill tone={AP_TONE[a.status]}>{t.cita.status[a.status]}</Pill>
        </span>
        <span className="figures block text-[13px] text-muted">{t.cita.when(fmtDate(a.date), t.cita.slot[a.slot], a.time)}</span>
        {a.note && <span className="block text-[13px]">{a.note}</span>}
      </div>
      {a.status === "solicitada" ? (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="sr-only" htmlFor={`t-${a.id}`}>{t.citas.time}</label>
          <input id={`t-${a.id}`} type="time" value={time} onChange={(ev) => setTime(ev.target.value)} className={ctl} />
          <label className="sr-only" htmlFor={`w-${a.id}`}>{t.citas.assignee}</label>
          <select id={`w-${a.id}`} value={who} onChange={(ev) => setWho(ev.target.value)} className={ctl}>
            <option value="">{t.list.unassigned}</option>
            {firm.team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="primary" disabled={!time} onClick={() => actions.confirmAppointment(e.id, a.id, time, who || null)}>
            {t.citas.confirm}
          </Button>
          <Button size="sm" variant="danger" onClick={() => actions.cancelAppointment(e.id, a.id)}>
            {t.citas.cancel}
          </Button>
        </div>
      ) : (
        <span className="text-[13px] text-muted lg:text-right">{a.status === "confirmada" ? firm.team.find((m) => m.id === a.assignee)?.name ?? t.list.unassigned : ""}</span>
      )}
    </li>
  );
}
