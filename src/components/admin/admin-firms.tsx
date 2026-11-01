"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { DEMO_FIRM_ID, platform, usePlatform, type FirmStatus } from "@/lib/data/platform";
import { useAppState } from "@/lib/data/store";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { fmtDate } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { PageHead } from "@/components/gestor/page-head";
import { TopBar } from "@/components/gestor/gestor-shell";
import { FirmForm } from "./firm-form";

export const STATUS_TONE: Record<FirmStatus, "ok" | "copper" | "neutral"> = { active: "ok", pending: "copper", paused: "neutral" };

const th = "px-4 py-2.5 text-left font-[inherit]";

type Row = { id: string; name: string; contact: string; email: string; plan: string; cases: number | null; status: FirmStatus; created: string; tag?: string };

/** X1 · Gestorías: every gestoría on the platform; the team adds them by hand or from the web request (A7). */
export function AdminFirms() {
  const { p } = usePlatformText();
  const { firms, plans } = usePlatform();
  const { firm, exps } = useAppState();
  const [adding, setAdding] = useState(false);
  const planName = (id: string | null) => (id ? plans.find((x) => x.id === id)?.name || p.plans.untitled : "—");

  // This installation's own gestoría first, from its real settings and cases.
  const rows: Row[] = [
    { id: DEMO_FIRM_ID, name: firm.name.trim() || "—", contact: firm.team.find((m) => m.role === "titular")?.name ?? "", email: firm.email, plan: "—", cases: Object.keys(exps).length, status: "active", created: "", tag: p.firms.thisOne },
    ...firms.map((f) => ({ id: f.id, name: f.name, contact: f.contact, email: f.email, plan: planName(f.planId), cases: null, status: f.status, created: f.createdAt.slice(0, 10), tag: p.source[f.source] })),
  ];
  const c = p.firms.cols;

  return (
    <>
      <PageTitle>{p.firms.title}</PageTitle>
      <TopBar crumbs={[{ label: p.firms.title }]} />
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <PageHead
          eyebrow={p.admin.area}
          title={p.firms.title}
          intro={p.firms.intro}
          actions={!adding && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden="true" />
              {p.firms.add}
            </Button>
          )}
        />

        {adding && (
          <Card >
            <h2 className="mb-4 text-[16px] font-semibold">{p.firms.add}</h2>
            <FirmForm
              id="new-firm"
              onSubmit={(d) => {
                platform.addFirm({ ...d, source: "admin" });
                setAdding(false);
              }}
              footer={
                <div className="flex justify-end gap-2 border-t border-line pt-4">
                  <Button type="button" onClick={() => setAdding(false)}>{p.firms.cancel}</Button>
                  <Button type="submit" variant="primary">{p.firms.create}</Button>
                </div>
              }
            />
          </Card>
        )}

        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="table-head text-left">
                <th className={th}>{c.name}</th>
                <th className={th}>{c.contact}</th>
                <th className={th}>{c.plan}</th>
                <th className="px-4 py-2.5 text-right font-[inherit]">{c.cases}</th>
                <th className={th}>{c.status}</th>
                <th className={th}>{c.created}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="relative border-t border-line transition-colors hover:bg-hover">
                  <td className="px-4 py-3">
                    {/* The whole row opens the gestoría: the link stretches over it. */}
                    <Link href={`/admin/gestorias/${r.id}`} className="font-semibold after:absolute after:inset-0">{r.name}</Link>
                    {r.tag && <span className="mt-0.5 block text-[12.5px] text-muted">{r.tag}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block whitespace-nowrap">{r.contact || "—"}</span>
                    <span className="block text-[12.5px] text-muted">{r.email}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.plan}</td>
                  <td className="figures px-4 py-3 text-right">{r.cases ?? "—"}</td>
                  <td className="px-4 py-3"><Pill tone={STATUS_TONE[r.status]}>{p.status[r.status]}</Pill></td>
                  <td className="figures px-4 py-3 whitespace-nowrap text-muted">{r.created ? fmtDate(r.created) : "—"}</td>
                  <td className="px-2 text-muted"><ChevronRight size={16} aria-hidden="true" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] text-muted">{firms.length ? p.firms.count(rows.length) : p.firms.empty}</p>
      </div>
    </>
  );
}
