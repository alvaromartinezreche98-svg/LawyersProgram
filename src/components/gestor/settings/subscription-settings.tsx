"use client";

import { Check, CreditCard, Receipt } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import { usePlatform } from "@/lib/data/platform";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { fmtDate } from "@/lib/format";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, Pill, cx } from "@/components/ui/primitives";
import { SectionHead } from "./settings-layout";

/**
 * G8 · Suscripción: the gestoría's PreRenta plan. Plans come from the team's
 * list (X3); with none published, the gestoría asks for a proposal. A request
 * is recorded and shows in X2; nothing is charged until billing exists.
 */
export function SubscriptionSettings() {
  const { p } = usePlatformText();
  const { firm } = useAppState();
  const { plans } = usePlatform();
  const s = p.sub;
  const sub = firm.subscription;
  const plan = sub?.planId ? plans.find((x) => x.id === sub.planId) : null;
  const request = (planId: string | null) => actions.updateFirm({ subscription: { planId, requestedAt: new Date().toISOString() } });
  const named = plans.filter((x) => x.name.trim());

  return (
    <>
      <SectionHead title={s.title} intro={s.intro} />
      <div data-wide className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <IconTile icon={CreditCard} />
            <h2 className="flex-1 text-[15px] font-semibold">{s.current}</h2>
            {sub && <Pill tone="copper">{s.chosen}</Pill>}
          </div>
          <p className="text-[18px] font-semibold">{plan ? plan.name : s.none}</p>
          <p className="text-[14px] text-muted">{sub ? s.requested(fmtDate(sub.requestedAt.slice(0, 10))) : s.noBilling}</p>
        </Card>

        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold">{s.plans}</h2>
          {named.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="max-w-[64ch] text-[14px] text-muted">{s.noPlans}</p>
              <Button variant="primary" disabled={!!sub} onClick={() => request(null)}>
                {sub ? <><Check size={16} aria-hidden="true" />{s.chosen}</> : s.ask}
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {named.map((x) => {
                const on = sub?.planId === x.id;
                return (
                  <li key={x.id} className={cx("flex flex-col gap-2 rounded-lg border p-4", on ? "border-copper bg-copper-soft/50" : "border-line")}>
                    <b className="text-[15.5px] font-semibold">{x.name}</b>
                    <span className="figures text-[20px] font-semibold">{x.price ? `${x.price} € ${p.pricing.perMonth}` : <span className="text-[15px] text-copper-text">{p.pricing.tbd}</span>}</span>
                    {x.cases && <span className="text-[13.5px] text-muted">{p.pricing.casesN(x.cases)}</span>}
                    {x.notes && <span className="text-[13.5px] whitespace-pre-line text-muted">{x.notes}</span>}
                    <Button className="mt-1 self-start" variant={on ? "secondary" : "primary"} disabled={on} onClick={() => request(x.id)}>
                      {on ? <><Check size={16} aria-hidden="true" />{s.chosen}</> : s.choose}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="soft-wash flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <IconTile icon={Receipt} tone="info" />
            <h2 className="flex-1 text-[15px] font-semibold">{s.billing}</h2>
            <Pill>{p.soon}</Pill>
          </div>
          <p className="max-w-[64ch] text-[14px] text-muted">{s.billingBody}</p>
        </Card>
      </div>
    </>
  );
}
