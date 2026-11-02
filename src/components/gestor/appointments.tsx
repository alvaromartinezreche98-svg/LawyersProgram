"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Building2, Check, CalendarDays, CalendarPlus, Phone, X } from "lucide-react";
import { actions, caseOrder, clientName, useAppState } from "@/lib/data/store";
import type { Appointment, Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, EmptyState, Notice, Pill, cx } from "@/components/ui/primitives";
import { AP_TONE } from "@/components/client/client-appointment";
import { Chip, Chips, PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";
import { DateField } from "@/components/ui/date-field";
import { Select } from "@/components/ui/select";

type Filter = "solicitada" | "confirmada" | "all";
const ctl = "field w-auto h-(--control-h-sm) text-[13px]";

/** G5 · Citas: requests from every case; confirm with a time and an accountant, or cancel. */
export function Appointments() {
  const { exps } = useAppState();
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("solicitada");
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const all = Object.values(exps).flatMap((e) => (e.appointments ?? []).map((a) => ({ e, a })));
  const count = (f: Filter) => (f === "all" ? all.length : all.filter((x) => x.a.status === f).length);
  const shown = all.filter((x) => filter === "all" || x.a.status === filter).sort((x, y) => x.a.date.localeCompare(y.a.date) || x.a.slot.localeCompare(y.a.slot));

  return (
    <>
      <PageTitle>{t.titles.citas}</PageTitle>
      <TopBar crumbs={[{ label: t.citas.title }]} />
      <div className="flex min-w-0 flex-col gap-4 overflow-x-clip px-4 py-5 max-sm:pt-4 sm:px-6">
        <PageHead
          title={t.citas.title}
          intro={t.citas.intro}
          actions={
            !adding && (
              <Button size="sm" onClick={() => { setAdding(true); setSaved(null); }}>
                <CalendarPlus size={15} aria-hidden="true" />
                {t.citas.newBtn}
              </Button>
            )
          }
        />
        {saved && <Notice tone="ok">{saved}</Notice>}
        {adding && (
          <NewAppointment
            onClose={() => setAdding(false)}
            onSaved={(n) => {
              setAdding(false);
              setSaved(t.citas.saved(n));
              setFilter("confirmada");
            }}
          />
        )}
        <Chips label={t.citas.title} scroll>
          {(["solicitada", "confirmada", "all"] as const).map((f) => (
            <Chip key={f} on={filter === f} count={count(f)} alert={f === "solicitada"} onClick={() => setFilter(f)}>
              {t.citas.filter[f]}
            </Chip>
          ))}
        </Chips>
        <div className="overflow-clip rounded-lg border border-line bg-surface">
          {shown.length === 0 ? (
            <EmptyState inset icon={CalendarDays} title={t.citas.none}>
              {all.length === 0 && <p>{t.citas.emptyHelp}</p>}
            </EmptyState>
          ) : (
            <ul>
              {shown.map(({ e, a }) => (
                <Row key={`${e.id}:${a.id}`} e={e} a={a} />
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
    // Phones and tablets: name and status on one line, the kind and date small under it, then one row of
    // controls (time, accountant, confirm and cancel as icon buttons). From lg: three columns.
    <li className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 max-lg:gap-y-2.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <Link href={`/expedientes/${e.id}`} className="block truncate font-medium hover:underline">
            {clientName(e) || t.common.unnamedClient}
          </Link>
          <span className="block truncate text-[12.5px] text-muted">{typeof e.answers.telefono === "string" && e.answers.telefono ? e.answers.telefono : t.citas.requested(fmtTime(a.createdAt, locale))}</span>
        </span>
        <span className="shrink-0 lg:hidden"><Pill tone={AP_TONE[a.status]}>{t.cita.status[a.status]}</Pill></span>
      </div>
      <div className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] max-lg:text-[13px] max-lg:text-muted">
          <span className="inline-flex items-center gap-1.5 max-lg:font-medium max-lg:text-ink">
            {a.kind === "llamada" ? <Phone size={14} aria-hidden="true" /> : <Building2 size={14} aria-hidden="true" />}
            {t.cita.kind[a.kind]}
          </span>
          <span className="max-lg:hidden"><Pill tone={AP_TONE[a.status]}>{t.cita.status[a.status]}</Pill></span>
          <span aria-hidden="true" className="lg:hidden">·</span>
          <span className="figures lg:hidden">{t.cita.when(fmtDate(a.date), t.cita.slot[a.slot], a.time)}</span>
        </span>
        <span className="figures block text-[13px] text-muted max-lg:hidden">{t.cita.when(fmtDate(a.date), t.cita.slot[a.slot], a.time)}</span>
        {a.note && <span className="block text-[13px]">{a.note}</span>}
      </div>
      {a.status === "solicitada" ? (
        // Phones: time and accountant share the row; if the screen is too narrow for the two icon
        // buttons as well, they move to a second line on the right instead of squeezing the fields.
        <div className="flex min-w-0 flex-wrap items-center gap-2 max-lg:gap-1.5 lg:justify-end">
          <label className="sr-only" htmlFor={`t-${a.id}`}>{t.citas.time}</label>
          <input id={`t-${a.id}`} type="time" value={time} onChange={(ev) => setTime(ev.target.value)} className={cx(ctl, "max-lg:min-w-[7rem] max-lg:flex-1 max-lg:basis-[7rem] max-lg:px-2.5")} />
          <label className="sr-only" htmlFor={`w-${a.id}`}>{t.citas.assignee}</label>
          <Select id={`w-${a.id}`} value={who} onChange={setWho} buttonClassName="h-(--control-h-sm) text-[13px]" className="w-auto min-w-44 max-lg:min-w-[8.5rem] max-lg:flex-[1.4] max-lg:basis-[8.5rem]" options={[{ value: "", label: t.list.unassigned }, ...firm.team.map((m) => ({ value: m.id, label: m.name }))]} />
          <span className="flex shrink-0 gap-1.5 max-lg:ml-auto lg:contents">
          <Button size="sm" variant="primary" disabled={!time} onClick={() => actions.confirmAppointment(e.id, a.id, time, who || null)} aria-label={t.citas.confirm} title={t.citas.confirm} className="max-lg:w-(--control-h-sm) max-lg:px-0">
            <Check size={15} strokeWidth={2.4} aria-hidden="true" className="lg:hidden" />
            <span className="max-lg:sr-only">{t.citas.confirm}</span>
          </Button>
          <Button size="sm" variant="danger" onClick={() => actions.cancelAppointment(e.id, a.id)} aria-label={t.citas.cancel} title={t.citas.cancel} className="max-lg:w-(--control-h-sm) max-lg:px-0">
            <X size={15} strokeWidth={2.4} aria-hidden="true" className="lg:hidden" />
            <span className="max-lg:sr-only">{t.citas.cancel}</span>
          </Button>
          </span>
        </div>
      ) : (
        <span className="text-[13px] text-muted lg:text-right">{a.status === "confirmada" ? firm.team.find((m) => m.id === a.assignee)?.name ?? t.list.unassigned : ""}</span>
      )}
    </li>
  );
}

/** "Nueva cita": schedule a visit or call agreed with the client another way; it is saved as confirmed. */
function NewAppointment({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const { exps, firm } = useAppState();
  const { t } = useI18n();
  const cases = caseOrder(exps);
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [kind, setKind] = useState<Appointment["kind"]>("presencial");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [who, setWho] = useState(exps[cases[0]?.id ?? ""]?.assignee ?? "");
  const [note, setNote] = useState("");
  const field = "field h-(--control-h) text-[14px]";
  const label = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink";

  const save = (ev: FormEvent) => {
    ev.preventDefault();
    if (!caseId || !date || !time) return;
    actions.scheduleAppointment(caseId, { kind, date, time, note: note.trim(), assignee: who || null });
    onSaved(clientName(exps[caseId]) || t.common.unnamedClient);
  };

  return (
    <form onSubmit={save} aria-labelledby="ap-new" className="flex flex-col gap-4 rounded-lg border border-line border-t-[3px] border-t-copper bg-surface pad-card shadow-sheet">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="ap-new" className="text-[16px] font-semibold">{t.citas.newTitle}</h2>
          <p className="mt-0.5 max-w-[68ch] text-[13.5px] text-muted">{t.citas.newIntro}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.citas.cancel} className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className={cx(label, "sm:col-span-2")}>
          {t.citas.client}
          <Select required aria-label={t.citas.client} value={caseId} onChange={(v) => { setCaseId(v); setWho(exps[v]?.assignee ?? ""); }} buttonClassName="h-(--control-h) text-[14px] font-normal" options={cases.map((e) => ({ value: e.id, label: clientName(e) || t.common.unnamedClient }))} />
        </label>
        <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
          <legend className="mb-1.5 text-[13px] font-semibold text-ink">{t.citas.kindLabel}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["presencial", "llamada"] as const).map((k) => (
              <label key={k} className={cx("flex h-(--control-h) cursor-pointer items-center justify-center gap-2 rounded-md border text-[14px] font-medium transition-colors", kind === k ? "border-accent bg-accent-soft text-accent" : "border-line-strong hover:bg-hover")}>
                <input type="radio" name="ap-kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {k === "llamada" ? <Phone size={15} aria-hidden="true" /> : <Building2 size={15} aria-hidden="true" />}
                {t.cita.kind[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className={label}>
          {t.citas.date}
          <DateField required value={date} onChange={setDate} className="font-normal" />
        </label>
        <label className={label}>
          {t.citas.time}
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={field} />
        </label>
        <label className={cx(label, "sm:col-span-2")}>
          {t.citas.assignee}
          <Select aria-label={t.citas.assignee} value={who} onChange={setWho} buttonClassName="h-(--control-h) text-[14px] font-normal" options={[{ value: "", label: t.list.unassigned }, ...firm.team.map((m) => ({ value: m.id, label: m.name }))]} />
        </label>
        <label className={cx(label, "sm:col-span-2 xl:col-span-4")}>
          {t.citas.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={field} />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={!caseId}>
          {t.citas.save}
        </Button>
        <Button onClick={onClose}>{t.citas.cancel}</Button>
      </div>
    </form>
  );
}
