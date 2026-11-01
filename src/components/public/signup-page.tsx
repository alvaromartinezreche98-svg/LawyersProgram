"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { platform } from "@/lib/data/platform";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, Card, Eyebrow, Notice, cx } from "@/components/ui/primitives";
import { FirmForm } from "@/components/admin/firm-form";
import { PublicShell } from "./public-shell";

/**
 * A7 · Alta de gestoría. For now the PreRenta team completes every sign-up
 * (sitemap: "in Phase 1 the team does this from X1"), so the form sends a
 * request that lands in X1 as pending; nothing is activated here.
 */
export function SignupPage() {
  const { p } = usePlatformText();
  const s = p.signup;
  const [accepted, setAccepted] = useState(false);
  const [missing, setMissing] = useState(false);
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null);

  return (
    <PublicShell>
      <PageTitle>{s.title}</PageTitle>
      <section className="mx-auto grid w-full max-w-page items-start gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:py-20">
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 className="display-serif max-w-[20ch] text-[clamp(28px,3.4vw,38px)] leading-[1.12] font-semibold">{s.h1}</h1>
          <p className="max-w-[52ch] text-[16px] text-muted">{s.intro}</p>
          <h2 className="mt-4 text-[15px] font-semibold">{s.nextTitle}</h2>
          <ol className="flex flex-col gap-3">
            {s.next.map((x, i) => (
              <li key={x} className="flex items-start gap-3 text-[14.5px]">
                <span className={cx("grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold", i === 0 ? "bg-copper text-surface" : "bg-sunk text-muted")}>{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
        </div>

        <Card pad="lg">
          {sent ? (
            <div className="flex flex-col items-start gap-3" role="status">
              <CircleCheck size={28} className="text-ok" aria-hidden="true" />
              <h2 className="text-[20px] font-semibold">{s.sentTitle}</h2>
              <p className="text-muted">{s.sentBody(sent.name, sent.email)}</p>
              <Notice className="mt-2 w-full">{s.demoNote}</Notice>
            </div>
          ) : (
            <FirmForm
              id="signup"
              planHint={s.planHint}
              onSubmit={(d) => {
                if (!accepted) {
                  setMissing(true);
                  return;
                }
                platform.addFirm({ ...d, source: "signup" });
                setSent({ name: d.name, email: d.email });
                window.scrollTo(0, 0);
              }}
              footer={
                <div className="flex flex-col gap-4 border-t border-line pt-5">
                  <label className={cx("flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-[14px] transition-colors", accepted ? "border-accent bg-accent-soft" : missing ? "border-bad bg-bad-soft" : "border-line-strong hover:bg-sunk")}>
                    <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setMissing(false); }} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
                    <span>
                      {s.accept[0]} <Link href="/legal/privacidad" className="font-medium underline underline-offset-2">{s.accept[1]}</Link> {s.accept[2]}
                    </span>
                  </label>
                  {missing && <Notice tone="bad">{s.needAccept}</Notice>}
                  <Button type="submit" variant="primary" size="lg" className="self-end">{s.submit}</Button>
                </div>
              }
            />
          )}
        </Card>
      </section>
    </PublicShell>
  );
}
