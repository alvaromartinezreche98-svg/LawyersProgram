"use client";

import { Plus, Tags, Trash2 } from "lucide-react";
import { platform, usePlatform } from "@/lib/data/platform";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { PageHead } from "@/components/gestor/page-head";
import { TopBar } from "@/components/gestor/gestor-shell";
import { Field, inputCls } from "@/components/gestor/settings/settings-layout";

/** X3 · Planes: plans and prices, edited in place. Empty until the team decides them; P4 reads them. */
export function AdminPlans() {
  const { p } = usePlatformText();
  const { plans } = usePlatform();
  const l = p.plans;
  const add = (
    <Button variant="primary" onClick={() => platform.addPlan()}>
      <Plus size={16} aria-hidden="true" />
      {l.add}
    </Button>
  );

  return (
    <>
      <PageTitle>{l.title}</PageTitle>
      <TopBar crumbs={[{ label: l.title }]} />
      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <PageHead eyebrow={p.admin.area} title={l.title} intro={l.intro} actions={plans.length > 0 && add} />
        {plans.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-8">
            <EmptyState icon={Tags} title={l.emptyTitle} center>{l.emptyBody}</EmptyState>
            {add}
          </Card>
        ) : (
          <ul className="grid gap-4 xl:grid-cols-2">
            {plans.map((x) => (
              <li key={x.id}>
                <Card className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field id={`plan-name-${x.id}`} label={l.name} className="sm:col-span-2">
                    <input id={`plan-name-${x.id}`} value={x.name} onChange={(e) => platform.updatePlan(x.id, { name: e.target.value })} className={inputCls} />
                  </Field>
                  <Field id={`plan-price-${x.id}`} label={l.price}>
                    <input id={`plan-price-${x.id}`} inputMode="decimal" value={x.price} onChange={(e) => platform.updatePlan(x.id, { price: e.target.value.replace(/[^0-9.,]/g, "") })} className={inputCls + " figures"} />
                  </Field>
                  <Field id={`plan-cases-${x.id}`} label={l.cases}>
                    <input id={`plan-cases-${x.id}`} inputMode="numeric" value={x.cases} onChange={(e) => platform.updatePlan(x.id, { cases: e.target.value.replace(/\D/g, "") })} className={inputCls + " figures"} />
                  </Field>
                  <Field id={`plan-notes-${x.id}`} label={l.notes} className="sm:col-span-2">
                    <textarea id={`plan-notes-${x.id}`} rows={3} value={x.notes} onChange={(e) => platform.updatePlan(x.id, { notes: e.target.value })} className={inputCls + " h-auto py-2.5"} />
                  </Field>
                  <Button variant="ghost" className="justify-self-start text-bad" onClick={() => platform.removePlan(x.id)}>
                    <Trash2 size={15} aria-hidden="true" />
                    {l.remove}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
