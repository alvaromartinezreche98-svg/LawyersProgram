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
import { DateField } from "@/components/ui/date-field";

export const AP_TONE = { solicitada: "warn", confirmada: "ok", cancelada: "neutral" } as const;
const today = () => new Date().toISOString().slice(0, 10);
const seg = (on: boolean) => cx("inline-flex h-(--control-h) items-center gap-2 rounded-md border px-4 text-[14px] font-medium whitespace-nowrap transition-colors", on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface shadow-field hover:border-accent hover:bg-accent-soft/40");

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
    <div className="flex flex-col gap-5 max-md:gap-3">
      <PageTitle>{t.titles.cita}</PageTitle>
      {/* phones: no eyebrow, a smaller title and intro, so the form starts higher */}
      <div>
        <span className="max-md:hidden"><Eyebrow>{t.nav.cita}</Eyebrow></span>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold max-md:mt-0 max-md:text-[20px]">{t.cita.title}</h1>
        <p className="mt-2 max-w-[60ch] text-muted max-md:mt-1 max-md:text-[13.5px] max-md:leading-5">{t.cita.intro}</p>
      </div>
      {/* Both cards start level under the heading. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card >
          <form onSubmit={submit} className="flex flex-col gap-4 max-md:gap-3 max-md:[--control-h:2.75rem]">
            <div role="radiogroup" aria-label={t.cita.title} className="flex flex-wrap gap-2 max-md:grid max-md:grid-cols-2">
              {(["llamada", "presencial"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cx(seg(kind === k), "max-md:justify-center max-md:px-2")}>
                  {k === "llamada" ? <Phone size={15} aria-hidden="true" /> : <Building2 size={15} aria-hidden="true" />}
                  {/* the full name where it fits on one line; the short one on narrow phones */}
                  <span className="max-[400px]:hidden">{t.cita.kind[k]}</span>
                  <span className="min-[401px]:hidden">{t.cita.kindShort[k]}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-4 max-md:gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[14px] font-medium max-md:gap-1 max-md:text-[13.5px]">
                {t.cita.date}
                <DateField min={today()} value={date} onChange={(v) => { setDate(v); setError(""); }} className="font-normal" />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[14px] font-medium max-md:text-[13.5px]">{t.cita.slotLabel}</span>
                <div role="radiogroup" aria-label={t.cita.slotLabel} className="grid grid-cols-2 gap-2">
                  {(["manana", "tarde"] as const).map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={slot === s} onClick={() => setSlot(s)} className={cx(seg(slot === s), "justify-center")}>
                      {t.cita.slot[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="flex flex-col gap-1.5 text-[14px] font-medium max-md:gap-1 max-md:text-[13.5px]">
              {t.cita.note}
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="field resize-none py-2 font-normal max-md:min-h-[4.5rem]" />
            </label>
            {error && <Notice tone="bad">{error}</Notice>}
            {sent && <Notice tone="ok">{t.cita.sent}</Notice>}
            <Button type="submit" variant="primary" className="self-start max-md:w-full max-md:self-stretch">
              <CalendarDays size={16} aria-hidden="true" />
              {t.cita.request}
            </Button>
          </form>
        </Card>

      <Card className="lg:sticky lg:top-[calc(var(--app-header,64px)+1.5rem)]">
        <CardTitle>{t.cita.mine}</CardTitle>
        {list.length === 0 ? (
          <div className="rounded-xl border border-line bg-sunk/50">
            <EmptyState inset icon={CalendarDays} title={t.cita.none} />
          </div>
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
    </div>
  );
}
