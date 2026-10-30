"use client";

import { useState, type FormEvent } from "react";
import { Building2, CalendarDays, Phone } from "lucide-react";
import { actions } from "@/lib/data/store";
import type { Appointment } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtDate } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Card, CardTitle, EmptyState, Eyebrow, Notice, Pill, cx } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

export const AP_TONE = { solicitada: "warn", confirmada: "ok", cancelada: "neutral" } as const;
const today = () => new Date().toISOString().slice(0, 10);
const seg = (on: boolean) => cx("inline-flex h-(--control-h) items-center gap-2 rounded-md border px-4 text-[14px] font-medium transition-colors", on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface shadow-field hover:border-line-strong");

/** C8 · Pedir cita: request an office visit or a phone call. */
export function ClientAppointment() {
  const exp = useClientExp();
  const { t } = useI18n();
  const [kind, setKind] = useState<Appointment["kind"]>("llamada");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Appointment["slot"]>("manana");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const list = [...(exp.appointments ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!date) return setError(t.cita.dateRequired);
    actions.requestAppointment(exp.id, { kind, date, slot, note: note.trim() });
    setSent(true);
    setDate("");
    setNote("");
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <PageTitle>{t.titles.cita}</PageTitle>
      <div className="flex flex-col gap-5">
        <div>
          <Eyebrow>{t.nav.cita}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.cita.title}</h1>
          <p className="mt-2 max-w-[60ch] text-muted">{t.cita.intro}</p>
        </div>
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div role="radiogroup" aria-label={t.cita.title} className="flex flex-wrap gap-2">
              {(["llamada", "presencial"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={seg(kind === k)}>
                  {k === "llamada" ? <Phone size={15} aria-hidden="true" /> : <Building2 size={15} aria-hidden="true" />}
                  {t.cita.kind[k]}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label className="flex flex-col gap-1.5 text-[14px] font-medium">
                {t.cita.date}
                <input type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} className="h-(--control-h) rounded-md border border-line-strong bg-surface px-3 font-normal outline-hidden focus:border-focus focus:ring-4 focus:ring-focus/15" />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[14px] font-medium">{t.cita.slotLabel}</span>
                <div role="radiogroup" aria-label={t.cita.slotLabel} className="flex gap-2">
                  {(["manana", "tarde"] as const).map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={slot === s} onClick={() => setSlot(s)} className={seg(slot === s)}>
                      {t.cita.slot[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="flex flex-col gap-1.5 text-[14px] font-medium">
              {t.cita.note}
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="resize-y rounded-md border border-line-strong bg-surface px-3 py-2 font-normal outline-hidden focus:border-focus focus:ring-4 focus:ring-focus/15" />
            </label>
            {error && <Notice tone="bad">{error}</Notice>}
            {sent && <Notice tone="ok">{t.cita.sent}</Notice>}
            <Button type="submit" variant="primary" className="self-start">
              <CalendarDays size={16} aria-hidden="true" />
              {t.cita.request}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-5 lg:sticky lg:top-[calc(var(--app-header,64px)+1.5rem)] lg:mt-[92px]">
        <CardTitle>{t.cita.mine}</CardTitle>
        {list.length === 0 ? (
          <EmptyState iconTone="rose" icon={CalendarDays} title={t.cita.none} />
        ) : (
          <ul className="flex flex-col">
            {list.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 border-t border-line py-3 first:border-t-0 first:pt-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    {a.kind === "llamada" ? <Phone size={14} aria-hidden="true" /> : <Building2 size={14} aria-hidden="true" />}
                    {t.cita.kind[a.kind]}
                  </span>
                  <Pill tone={AP_TONE[a.status]}>{t.cita.status[a.status]}</Pill>
                </span>
                <span className="figures text-[13px] text-muted">{t.cita.when(fmtDate(a.date), t.cita.slot[a.slot], a.time)}</span>
                {a.note && <span className="text-[13px]">{a.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
