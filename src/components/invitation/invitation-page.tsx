"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Check, CircleAlert, Clock, Link2Off, MailCheck, ServerOff } from "lucide-react";
import { actions } from "@/lib/data/store";
import { useInvitation } from "@/lib/invitations";
import { CLERK_ENABLED } from "@/lib/auth/config";
import { useAuthState } from "@/lib/auth/use-auth";
import { EJERCICIO, STEP_SLUGS } from "@/lib/questionnaire/schema";
import { useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { LangSwitch } from "@/components/ui/lang-switch";
import { IconTile } from "@/components/ui/icons";
import { Button, Card, Eyebrow, Loading, Notice } from "@/components/ui/primitives";
import { FirmBrand } from "./firm-brand";
import { InvitationSignIn } from "./invitation-sign-in";

/** /invitacion/[token]: the page a client's QR or invitation link opens. */
export function InvitationPage({ token }: { token: string }) {
  const inv = useInvitation(token);
  const auth = useAuthState();
  const { firm } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const i = t.inv;
  const name = firm.name.trim() || t.landing.yourFirm;

  const accept = (caseId: string) => {
    setBusy(true);
    actions.acceptInvitation(caseId);
    actions.loginClient(caseId);
    // Blueprint: the client lands on their questionnaire.
    router.replace(`/declaracion/${STEP_SLUGS[0]}`);
  };

  let body: ReactNode;
  if (inv.status === "loading" || auth.status === "loading") body = <Loading label={i.checking} />;
  else if (inv.status === "valid") {
    const needsSignIn = CLERK_ENABLED && auth.status === "signedOut";
    body = (
      <div className="flex flex-col gap-5">
        <IconTile icon={MailCheck} size="lg" />
        <div>
          <Eyebrow>{i.eyebrow(EJERCICIO)}</Eyebrow>
          <h1 className="display-serif mt-1.5 text-[clamp(22px,2.6vw,28px)] leading-tight font-semibold">{i.title(name)}</h1>
          {inv.clientName && <p className="mt-2 text-muted">{i.forWho(inv.clientName)}</p>}
        </div>
        <ul className="flex flex-col gap-1.5 text-[14.5px]">
          {i.what.map((w) => <li key={w} className="flex items-start gap-2"><Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />{w}</li>)}
        </ul>
        {needsSignIn ? (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-muted">{inv.email ? i.signInAs(inv.email) : i.signIn}</p>
            <InvitationSignIn />
          </div>
        ) : (
          <Button variant="primary" size="lg" className="self-start" disabled={busy} onClick={() => accept(inv.caseId)}>
            {i.accept}
          </Button>
        )}
      </div>
    );
  } else {
    const map = {
      notFound: [Link2Off, i.notFound],
      expired: [Clock, i.expired],
      used: [CircleAlert, i.used],
      unavailable: [ServerOff, i.unavailable],
    } as const;
    const [Icon, copy] = map[inv.status];
    body = (
      <div className="flex flex-col gap-4">
        <IconTile icon={Icon} size="lg" tone="neutral" />
        <h1 className="display-serif text-[clamp(22px,2.6vw,26px)] font-semibold">{copy.title}</h1>
        <p className="text-muted">{copy.body}</p>
        <Notice>{i.askFirm(name)}</Notice>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <PageTitle>{i.pageTitle}</PageTitle>
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4 px-4 pt-6 sm:px-8">
        <FirmBrand />
        <LangSwitch />
      </header>
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-4 py-10 sm:px-8">
        <Card className="p-6 sm:p-8">{body}</Card>
      </main>
    </div>
  );
}
