"use client";

import Link from "next/link";
import { BellRing, Mail } from "lucide-react";
import { actions, clientName, openTasks, useAppState } from "@/lib/data/store";
import type { Expediente, Reminders } from "@/lib/data/types";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { Card, Notice, cx } from "@/components/ui/primitives";
import { IconTile } from "@/components/ui/icons";
import { Field, SectionHead, UnitField } from "./settings-layout";

export const DEFAULT_REMINDERS: Reminders = { enabled: false, afterDays: 7, everyDays: 7, max: 3, channel: "email", when: { questionnaire: true, requests: true, approval: true } };

type Reason = keyof Reminders["when"];

/** Why a case would get a reminder today under these rules, or null. Exported for the backend to mirror. */
export function reminderReason(e: Expediente, r: Reminders, now = Date.now()): { reason: Reason; days: number } | null {
  const days = Math.floor((now - new Date(e.updatedAt).getTime()) / 86_400_000);
  if (days < r.afterDays) return null;
  if (r.when.requests && openTasks(e).length > 0) return { reason: "requests", days };
  if (r.when.questionnaire && e.status === "borrador") return { reason: "questionnaire", days };
  if (r.when.approval && e.result && e.result.approval?.version !== e.result.version) return { reason: "approval", days };
  return null;
}

/** G7 · Recordatorios: when clients get a nudge, by email or SMS. Saved with the firm; the backend sends them. */
export function ReminderSettings() {
  const { p } = usePlatformText();
  const { firm, exps } = useAppState();
  const r = p.rem;
  const rules = { ...DEFAULT_REMINDERS, ...firm.reminders, when: { ...DEFAULT_REMINDERS.when, ...firm.reminders?.when } };
  const set = (patch: Partial<Reminders>) => actions.updateFirm({ reminders: { ...rules, ...patch } });
  const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Number(v.replace(/\D/g, "")) || min));
  const due = Object.values(exps)
    .map((e) => ({ e, hit: reminderReason(e, rules) }))
    .filter((x): x is { e: Expediente; hit: NonNullable<ReturnType<typeof reminderReason>> } => !!x.hit)
    .sort((a, b) => b.hit.days - a.hit.days);

  return (
    <>
      <SectionHead title={r.title} intro={r.intro} />
      <div data-wide className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card pad="lg" className="flex flex-col gap-6">
          <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium">
            <input type="checkbox" checked={rules.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="size-5 accent-[var(--accent)]" />
            {r.enabled}
          </label>

          <fieldset disabled={!rules.enabled} className="flex flex-col gap-6 disabled:opacity-60">
            <div className="grid items-end gap-4 sm:grid-cols-3">
              <Field id="rem-after" label={r.afterDays}>
                <UnitField id="rem-after" unit={r.daysShort} inputMode="numeric" value={rules.afterDays} onChange={(e) => set({ afterDays: num(e.target.value, 1, 60) })} />
              </Field>
              <Field id="rem-every" label={r.everyDays}>
                <UnitField id="rem-every" unit={r.daysShort} inputMode="numeric" value={rules.everyDays} onChange={(e) => set({ everyDays: num(e.target.value, 1, 60) })} />
              </Field>
              <Field id="rem-max" label={r.max}>
                <UnitField id="rem-max" unit={r.timesShort} inputMode="numeric" value={rules.max} onChange={(e) => set({ max: num(e.target.value, 1, 10) })} />
              </Field>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[14px] font-medium">{r.channel}</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {(["email", "sms", "both"] as const).map((c) => (
                  <label key={c} className={cx("flex h-(--control-h) cursor-pointer items-center justify-center rounded-md border text-[14px] font-medium transition-colors", rules.channel === c ? "border-accent bg-accent-soft text-accent" : "border-field-line hover:border-accent")}>
                    <input type="radio" name="rem-channel" value={c} checked={rules.channel === c} onChange={() => set({ channel: c })} className="sr-only" />
                    {r.channels[c]}
                  </label>
                ))}
              </div>
              {rules.channel !== "email" && <p className="text-[12.5px] text-muted">{r.smsNote}</p>}
            </fieldset>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2 text-[14px] font-medium">{r.when}</legend>
              {(Object.keys(r.whenOpts) as Reason[]).map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-3 text-[14.5px]">
                  <input type="checkbox" checked={rules.when[k]} onChange={(e) => set({ when: { ...rules.when, [k]: e.target.checked } })} className="size-[18px] accent-[var(--accent)]" />
                  {r.whenOpts[k]}
                </label>
              ))}
            </fieldset>
          </fieldset>

          <Link href="/ajustes/correos?plantilla=reminder" className="inline-flex items-center gap-2 self-start text-[14px] font-medium text-accent underline-offset-4 hover:underline">
            <Mail size={15} aria-hidden="true" />
            {r.template}
          </Link>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <IconTile icon={BellRing} size="sm" tone={due.length && rules.enabled ? "copper" : "accent"} />
            <h2 className="flex-1 text-[15px] font-semibold">{r.preview}</h2>
            <span className="figures text-[18px] font-semibold">{rules.enabled ? due.length : 0}</span>
          </div>
          {!rules.enabled ? (
            <Notice>{r.off}</Notice>
          ) : due.length === 0 ? (
            <p className="text-[14px] text-muted">{r.previewNone}</p>
          ) : (
            <ul className="flex max-h-[360px] flex-col overflow-y-auto">
              {due.map(({ e, hit }) => (
                <li key={e.id} className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
                  <Link href={`/expedientes/${e.id}`} className="block text-[14px] font-medium hover:text-accent">{clientName(e) || "—"}</Link>
                  <span className="block text-[12.5px] text-muted">{r.whenOpts[hit.reason]} · {r.since(hit.days)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12.5px] text-muted">{r.previewNote}</p>
        </Card>
      </div>
    </>
  );
}
