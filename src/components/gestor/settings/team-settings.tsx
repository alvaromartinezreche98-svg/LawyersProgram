"use client";

import { Info, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { actions, useAppState } from "@/lib/data/store";
import type { MemberRole } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card, cx } from "@/components/ui/primitives";
import { SectionHead, inputCls } from "./settings-layout";

const ROLES: MemberRole[] = ["titular", "gestor"];
const AVATAR = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-warn-soft text-warn", "bg-ok-soft text-ok"];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
const compact = "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 outline-hidden transition hover:border-line focus:border-focus focus:bg-surface";

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
              <button type="button" aria-label={`${s.remove} ${m.name}`} disabled={firm.team.length === 1} onClick={() => actions.removeMember(m.id)} className="row-start-1 grid size-8 place-items-center rounded-lg text-muted transition hover:bg-bad-soft hover:text-bad disabled:opacity-30 disabled:hover:bg-transparent sm:row-start-auto">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="grid gap-2.5 border-t border-line bg-sunk p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_140px_auto]">
          <label className="sr-only" htmlFor="tm-name">{s.name}</label>
          <input id="tm-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={s.name} autoComplete="off" className={inputCls} />
          <label className="sr-only" htmlFor="tm-email">{s.email}</label>
          <input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={s.email} autoComplete="off" className={inputCls} />
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
    </>
  );
}
