"use client";

import { Briefcase, Info, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { actions, useAppState } from "@/lib/data/store";
import type { MemberRole } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card, cx } from "@/components/ui/primitives";
import { SectionHead, inputCls } from "./settings-layout";
import { FieldIcon } from "@/components/ui/field-icon";

const ROLES: MemberRole[] = ["titular", "gestor"];
const AVATAR = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-warn-soft text-warn", "bg-ok-soft text-ok"];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
const compact = "h-9 w-full rounded-md border border-transparent bg-transparent px-2 outline-hidden transition hover:border-line focus:border-focus focus:bg-surface";

/** G7 · Equipo: the gestoría's people. Edit in place; add at the bottom. */
export function TeamSettings() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const s = t.settings.team;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("gestor");

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.addMember({ name: name.trim(), email: email.trim(), role });
    setName("");
    setEmail("");
  };

  return (
    <>
      <SectionHead title={s.title} intro={s.intro} />
      {/* The team on the left; what each role is for beside it (below on narrower screens). */}
      <div data-wide className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
      <Card className="overflow-clip">
        {firm.team.length === 0 && <p className="px-5 py-8 text-center text-muted">{s.empty}</p>}
        <ul>
          {firm.team.map((m, i) => (
            <li key={m.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[36px_minmax(0,1.2fr)_minmax(0,1.4fr)_140px_auto]">
              <span className={cx("grid size-9 place-items-center rounded-full text-[13px] font-bold", AVATAR[i % AVATAR.length])}>{initials(m.name)}</span>
              <input aria-label={s.name} value={m.name} onChange={(e) => actions.updateMember(m.id, { name: e.target.value })} className={cx(compact, "font-semibold")} />
              <input aria-label={s.email} type="email" value={m.email} onChange={(e) => actions.updateMember(m.id, { email: e.target.value })} className={cx(compact, "col-start-2 text-muted sm:col-start-auto")} />
              <select aria-label={s.role} value={m.role} onChange={(e) => actions.updateMember(m.id, { role: e.target.value as MemberRole })} className={cx(compact, "col-start-2 sm:col-start-auto")}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {s.roles[r]}
                  </option>
                ))}
              </select>
              <button type="button" aria-label={`${s.remove} ${m.name}`} disabled={firm.team.length === 1} onClick={() => actions.removeMember(m.id)} className="row-start-1 grid size-9 place-items-center rounded-lg text-muted transition hover:bg-bad-soft hover:text-bad disabled:opacity-30 disabled:hover:bg-transparent sm:row-start-auto">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="grid gap-2.5 border-t border-line bg-sunk p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_140px_auto]">
          <label className="sr-only" htmlFor="tm-name">{s.name}</label>
          <input id="tm-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={s.name} autoComplete="off" className={inputCls} />
          <label className="sr-only" htmlFor="tm-email">{s.email}</label>
          <FieldIcon kind="email"><input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={s.email} autoComplete="off" className={inputCls} /></FieldIcon>
          <label className="sr-only" htmlFor="tm-role">{s.role}</label>
          <select id="tm-role" value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={inputCls}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {s.roles[r]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary">
            <Plus size={16} aria-hidden="true" />
            {s.add}
          </Button>
        </form>
      </Card>
      <p className="mt-3 flex gap-2 text-[12.5px] text-muted">
        <Info size={15} className="mt-px shrink-0" aria-hidden="true" />
        {s.invites}
      </p>
      </div>

      <aside aria-labelledby="roles-title" className="flex flex-col gap-4 rounded-lg border border-line bg-sunk p-5">
        <h2 id="roles-title" className="text-[15px] font-semibold">{s.rolesTitle}</h2>
        <dl className="flex flex-col gap-4">
          {ROLES.map((r) => (
            <div key={r} className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-[14px] font-semibold">
                {r === "titular" ? <ShieldCheck size={16} className="text-copper-text" aria-hidden="true" /> : <Briefcase size={16} className="text-accent" aria-hidden="true" />}
                {s.roles[r]}
              </dt>
              <dd className="text-[13.5px] leading-5 text-muted">{s.roleText[r]}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line pt-3 text-[13px] leading-5 text-ink/80">{s.rolesNote}</p>
      </aside>
      </div>
    </>
  );
}
