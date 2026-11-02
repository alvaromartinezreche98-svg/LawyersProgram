"use client";

import { Briefcase, ChevronDown, Info, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { actions, useAppState } from "@/lib/data/store";
import type { MemberRole } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card, cx } from "@/components/ui/primitives";
import { SectionHead, inputCls } from "./settings-layout";
import { FieldIcon } from "@/components/ui/field-icon";
import { Select } from "@/components/ui/select";

const ROLES: MemberRole[] = ["titular", "gestor"];
const AVATAR = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-warn-soft text-warn", "bg-ok-soft text-ok"];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
const compact = "h-9 w-full rounded-md border border-transparent bg-transparent px-2 outline-hidden transition hover:border-line focus:border-focus focus:bg-surface";

const ROLE_LOOK: Record<MemberRole, { icon: typeof ShieldCheck; cls: string }> = {
  titular: { icon: ShieldCheck, cls: "bg-copper-soft text-copper-text" },
  gestor: { icon: Briefcase, cls: "bg-accent-soft text-accent" },
};

/** The role as a coloured chip with its icon (same icons as the roles card), opening the shared dropdown. */
function RoleChip({ label, value, names, onChange }: { label: string; value: MemberRole; names: Record<MemberRole, string>; onChange: (r: MemberRole) => void }) {
  const look = ROLE_LOOK[value];
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(v) => onChange(v as MemberRole)}
      options={ROLES.map((r) => ({ value: r, label: names[r], icon: ROLE_LOOK[r].icon }))}
      className="w-[150px]"
      trigger={{
        className: cx("group inline-flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-full border border-transparent px-2.5 text-[13.5px] font-semibold transition-colors hover:border-accent focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-focus/15 focus-visible:outline-none", look.cls),
        content: (open) => (
          <>
            <look.icon size={14} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1 truncate text-left">{names[value]}</span>
            <ChevronDown size={14} className={cx("opacity-70 motion-safe:transition-transform motion-safe:duration-200", open && "rotate-180")} aria-hidden="true" />
          </>
        ),
      }}
    />
  );
}

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
      <Card pad="none" className="overflow-clip">
        {firm.team.length === 0 && <p className="pad-card text-center text-muted">{s.empty}</p>}
        <ul>
          {firm.team.map((m, i) => (
            // Phones: avatar | name | delete on the first line; the email (full width) and the role under the name.
            // From sm: one row (avatar, name, email, role, delete).
            <li key={m.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-line pad-x-card py-3 first:border-t-0 sm:grid-cols-[36px_minmax(0,1.2fr)_minmax(0,1.4fr)_150px_auto] sm:gap-y-1">
              <span className={cx("col-start-1 row-start-1 grid size-9 place-items-center rounded-full text-[13px] font-bold", AVATAR[i % AVATAR.length])}>{initials(m.name)}</span>
              <input aria-label={s.name} value={m.name} onChange={(e) => actions.updateMember(m.id, { name: e.target.value })} className={cx(compact, "col-start-2 row-start-1 min-w-0 font-semibold")} />
              <input aria-label={s.email} type="email" value={m.email} onChange={(e) => actions.updateMember(m.id, { email: e.target.value })} className={cx(compact, "col-span-2 col-start-2 row-start-2 min-w-0 text-[13.5px] text-muted sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:text-[14px]")} />
              <span className="col-start-2 row-start-3 justify-self-start pl-2 pt-1 sm:col-start-4 sm:row-start-1 sm:justify-self-stretch sm:p-0">
                <RoleChip label={s.role} value={m.role} names={s.roles} onChange={(role) => actions.updateMember(m.id, { role })} />
              </span>
              <button type="button" aria-label={`${s.remove} ${m.name}`} disabled={firm.team.length === 1} onClick={() => actions.removeMember(m.id)} className="col-start-3 row-start-1 grid size-9 place-items-center rounded-lg text-muted transition hover:bg-bad-soft hover:text-bad disabled:opacity-30 disabled:hover:bg-transparent sm:col-start-5">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="grid gap-2 border-t border-line bg-sunk pad-card sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_150px_auto]">
          <label className="sr-only" htmlFor="tm-name">{s.name}</label>
          <input id="tm-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={s.name} autoComplete="off" className={inputCls} />
          <label className="sr-only" htmlFor="tm-email">{s.email}</label>
          <FieldIcon kind="email"><input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={s.email} autoComplete="off" className={inputCls} /></FieldIcon>
          <label className="sr-only" htmlFor="tm-role">{s.role}</label>
          <Select id="tm-role" value={role} onChange={(v) => setRole(v as MemberRole)} options={ROLES.map((r) => ({ value: r, label: s.roles[r], icon: ROLE_LOOK[r].icon }))} />
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

      <aside aria-labelledby="roles-title" className="flex flex-col gap-4 rounded-lg border border-line bg-sunk pad-card">
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
