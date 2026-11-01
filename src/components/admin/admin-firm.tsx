"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Landmark, Trash2 } from "lucide-react";
import { DEMO_FIRM_ID, platform, usePlatform, type FirmStatus } from "@/lib/data/platform";
import { useAppState } from "@/lib/data/store";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { fmtDate } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, EmptyState, Pill } from "@/components/ui/primitives";
import { PageHead } from "@/components/gestor/page-head";
import { TopBar } from "@/components/gestor/gestor-shell";
import { inputCls } from "@/components/gestor/settings/settings-layout";
import { STATUS_TONE } from "./admin-firms";
import { Select } from "@/components/ui/select";

/** X2 · Ficha de la gestoría: account and users, usage, subscription, payout account and support notes. */
export function AdminFirm({ id }: { id: string }) {
  const { p } = usePlatformText();
  const { firms, plans } = usePlatform();
  const { firm, exps } = useAppState();
  const router = useRouter();
  const f = p.firm;
  const demo = id === DEMO_FIRM_ID;
  const rec = firms.find((x) => x.id === id);

  if (!demo && !rec) {
    return (
      <>
        <TopBar crumbs={[{ label: f.back, href: "/admin/gestorias" }, { label: "—" }]} />
        <div className="px-4 py-10 sm:px-6"><EmptyState icon={Landmark} title={f.notFound} /></div>
      </>
    );
  }

  const cases = Object.values(exps);
  const name = demo ? firm.name.trim() || "—" : rec!.name;
  const status: FirmStatus = demo ? "active" : rec!.status;
  const account: [string, string][] = demo
    ? [[p.field.cif, firm.cif], [p.field.email, firm.email], [p.field.phone, firm.phone], [p.field.city, firm.address]]
    : [[p.field.cif, rec!.cif], [p.field.contact, rec!.contact], [p.field.email, rec!.email], [p.field.phone, rec!.phone], [p.field.city, rec!.city]];
  const users = demo ? firm.team : [];

  const setStatus = (s: FirmStatus) => rec && platform.updateFirm(rec.id, { status: s });

  return (
    <>
      <PageTitle>{name}</PageTitle>
      <TopBar crumbs={[{ label: f.back, href: "/admin/gestorias" }, { label: name }]} />
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <PageHead
          eyebrow={demo ? p.firms.thisOne : `${p.source[rec!.source]} · ${f.createdOn(fmtDate(rec!.createdAt.slice(0, 10)))}`}
          title={name}
          actions={
            <>
              <Pill tone={STATUS_TONE[status]}>{p.status[status]}</Pill>
              {rec && status === "pending" && <Button variant="primary" onClick={() => setStatus("active")}>{f.activate}</Button>}
              {rec && status === "active" && <Button onClick={() => setStatus("paused")}>{f.pause}</Button>}
              {rec && status === "paused" && <Button variant="primary" onClick={() => setStatus("active")}>{f.resume}</Button>}
            </>
          }
        />

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Block title={f.account}>
            <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[14px]">
              {account.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="min-w-0 break-words">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block title={f.users}>
            {users.length ? (
              <ul className="flex flex-col">
                {users.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-[14px] first:border-t-0 first:pt-0">
                    <span className="min-w-0">
                      <span className="block font-medium">{m.name}</span>
                      <span className="block truncate text-[12.5px] text-muted">{m.email}</span>
                    </span>
                    <Pill>{f.role[m.role]}</Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-muted">{f.noUsers}</p>
            )}
          </Block>

          <Block title={f.usage}>
            {demo ? (
              <dl className="grid gap-3 min-[560px]:grid-cols-3">
                <Figure label={f.cases} value={cases.length} />
                <Figure label={f.clients} value={new Set(cases.map((e) => e.clientId ?? e.id)).size} />
                <Figure label={f.sent} value={cases.filter((e) => e.status !== "borrador").length} />
              </dl>
            ) : (
              <p className="text-[14px] text-muted">{f.usageNone}</p>
            )}
          </Block>

          <Block title={f.subscription}>
            {rec && plans.length > 0 && (
              <label className="mb-3 flex flex-col gap-1.5 text-[14px] font-medium">
                {p.field.plan}
                <Select aria-label={p.field.plan} value={rec.planId ?? ""} onChange={(v) => platform.updateFirm(rec.id, { planId: v || null })} buttonClassName="font-normal" options={[{ value: "", label: p.field.noPlan }, ...plans.map((x) => ({ value: x.id, label: x.name || p.plans.untitled }))]} />
              </label>
            )}
            {demo && firm.subscription ? (
              // The gestoría asked for a plan from Settings › Subscription (G8).
              <p className="text-[14px]">
                <b>{plans.find((x) => x.id === firm.subscription!.planId)?.name || p.sub.none}</b>
                <span className="block text-muted">{p.sub.requested(fmtDate(firm.subscription.requestedAt.slice(0, 10)))}</span>
              </p>
            ) : (
              <p className="text-[14px] text-muted">{rec && !plans.length ? f.noPlans : f.subscriptionNone}</p>
            )}
          </Block>

          <Block title={f.payout} aside={<Pill>{p.soon}</Pill>}>
            <div className="flex items-start gap-3">
              <IconTile icon={Landmark} size="sm" />
              <p className="max-w-[60ch] text-[14px] text-muted">{f.payoutBody}</p>
            </div>
            <Button disabled className="mt-3 self-start">{f.connect}</Button>
          </Block>

          {rec && (
            <Block title={f.support}>
              <label htmlFor="firm-notes" className="text-[14px] font-medium">{f.notes}</label>
              <textarea id="firm-notes" rows={4} value={rec.notes} onChange={(e) => platform.updateFirm(rec.id, { notes: e.target.value })} className={inputCls + " mt-1.5 h-auto py-2.5"} />
              <p className="mt-1.5 text-[12.5px] text-muted">{f.notesHint}</p>
              <Button
                variant="ghost"
                className="mt-4 self-start text-bad"
                onClick={() => {
                  if (!window.confirm(f.removeConfirm)) return;
                  platform.removeFirm(rec.id);
                  router.push("/admin/gestorias");
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
                {f.remove}
              </Button>
            </Block>
          )}
        </div>
      </div>
    </>
  );
}

function Block({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <dt className="text-[12.5px] whitespace-nowrap text-muted">{label}</dt>
      <dd className="figures mt-0.5 text-[20px] font-semibold">{value}</dd>
    </div>
  );
}
