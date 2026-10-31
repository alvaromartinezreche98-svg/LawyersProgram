"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { usePlatform, type PlatformFirm } from "@/lib/data/platform";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { FieldIcon } from "@/components/ui/field-icon";
import { Field, inputCls } from "@/components/gestor/settings/settings-layout";

export type FirmDraft = Pick<PlatformFirm, "name" | "cif" | "contact" | "email" | "phone" | "city" | "planId">;
export const EMPTY_FIRM: FirmDraft = { name: "", cif: "", contact: "", email: "", phone: "", city: "", planId: null };

/**
 * The gestoría's details: the same form for the public sign-up (A7) and for
 * the team adding one by hand (X1). The plan list only shows when plans exist.
 */
export function FirmForm({ id, onSubmit, footer, planHint }: { id: string; onSubmit: (d: FirmDraft) => void; footer: ReactNode; planHint?: string }) {
  const { p } = usePlatformText();
  const { plans } = usePlatform();
  const [d, setD] = useState<FirmDraft>(EMPTY_FIRM);
  const set = (k: keyof FirmDraft) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...d, name: d.name.trim() });
  };
  const f = p.field;
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-name`} label={f.name} className="sm:col-span-2">
          <input id={`${id}-name`} required autoComplete="organization" value={d.name} onChange={set("name")} className={inputCls} />
        </Field>
        <Field id={`${id}-cif`} label={f.cif}>
          <input id={`${id}-cif`} required autoComplete="off" value={d.cif} onChange={set("cif")} className={inputCls + " font-mono"} />
        </Field>
        <Field id={`${id}-city`} label={f.city}>
          <input id={`${id}-city`} autoComplete="address-level2" value={d.city} onChange={set("city")} className={inputCls} />
        </Field>
        <Field id={`${id}-contact`} label={f.contact} className="sm:col-span-2">
          <input id={`${id}-contact`} required autoComplete="name" value={d.contact} onChange={set("contact")} className={inputCls} />
        </Field>
        <Field id={`${id}-email`} label={f.email}>
          <FieldIcon kind="email"><input id={`${id}-email`} type="email" required autoComplete="email" value={d.email} onChange={set("email")} className={inputCls} /></FieldIcon>
        </Field>
        <Field id={`${id}-phone`} label={f.phone}>
          <FieldIcon kind="tel"><input id={`${id}-phone`} type="tel" autoComplete="tel" value={d.phone} onChange={set("phone")} className={inputCls} /></FieldIcon>
        </Field>
        {plans.length > 0 && (
          <Field id={`${id}-plan`} label={f.plan} hint={planHint} className="sm:col-span-2">
            <select id={`${id}-plan`} value={d.planId ?? ""} onChange={(e) => setD({ ...d, planId: e.target.value || null })} className={inputCls}>
              <option value="">{f.noPlan}</option>
              {plans.map((x) => (
                <option key={x.id} value={x.id}>{x.name || p.plans.untitled}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {footer}
    </form>
  );
}
