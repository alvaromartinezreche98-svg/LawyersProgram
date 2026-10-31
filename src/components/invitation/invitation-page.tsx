"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check, CircleAlert, Clock, Link2Off, MailCheck, ServerOff } from "lucide-react";
import { actions } from "@/lib/data/store";
import { useInvitation } from "@/lib/invitations";
import { CLERK_ENABLED } from "@/lib/auth/config";
import { useAuthState } from "@/lib/auth/use-auth";
import { EJERCICIO, STEP_SLUGS } from "@/lib/questionnaire/schema";
import { useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { PublicShell } from "@/components/public/public-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, ButtonLink, Eyebrow, Loading, cx } from "@/components/ui/primitives";
import s from "@/components/access-screen.module.scss";
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

  // The same frame as the entry page (access-screen): the story on the left, the action on the navy side.
  let story: ReactNode;
  let action: ReactNode;
  if (inv.status === "loading" || auth.status === "loading") {
    story = <Loading label={i.checking} />;
    action = null;
  } else if (inv.status === "valid") {
    const needsSignIn = CLERK_ENABLED && auth.status === "signedOut";
    story = (
      <>
        <Eyebrow>{i.eyebrow(EJERCICIO)}</Eyebrow>
        <h1 className={cx(s.title, s.titleSm)}>{i.title(name)}</h1>
        <ul className="flex flex-col gap-3 text-[16px] leading-[24px] text-ink">
          {i.what.map((w) => (
            <li key={w} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ok-soft text-ok" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
              {w}
            </li>
          ))}
        </ul>
        <dl className={cx("ledger", s.ledger)}>
          <div>
            <dt>{t.landing.ledgerFirm}</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>{t.landing.ledgerYear}</dt>
            <dd className="figures">{EJERCICIO}</dd>
          </div>
        </dl>
      </>
    );
    action = (
      <section aria-labelledby="inv-who" className={s.panel}>
        <div className={s.panelHead}>
          <IconTile icon={MailCheck} size="lg" />
          {inv.clientName && <h2 id="inv-who" className={s.panelTitle}>{i.forWho(inv.clientName)}</h2>}
        </div>
        {needsSignIn ? (
          <div className="flex flex-col gap-3">
            <p className={s.lead}>{inv.email ? i.signInAs(inv.email) : i.signIn}</p>
            <InvitationSignIn />
          </div>
        ) : (
          <Button variant="primary" size="lg" className={s.codeSubmit} loading={busy} onClick={() => accept(inv.caseId)}>
            {i.accept}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        )}
      </section>
    );
  } else {
    const map = {
      notFound: [Link2Off, i.notFound],
      expired: [Clock, i.expired],
      used: [CircleAlert, i.used],
      unavailable: [ServerOff, i.unavailable],
    } as const;
    const [Icon, copy] = map[inv.status];
    story = (
      <>
        <IconTile icon={Icon} size="lg" tone="neutral" />
        <h1 className={cx(s.title, s.titleSm)}>{copy.title}</h1>
        <p className={s.lede}>{copy.body}</p>
      </>
    );
    action = (
      <section className={s.panel}>
        <p className={s.lead}>{i.askFirm(name)}</p>
        <ButtonLink href="/" variant="primary" size="lg" className={s.codeSubmit}>
          {t.pub.nav.home}
          <ArrowRight size={18} aria-hidden="true" />
        </ButtonLink>
      </section>
    );
  }

  return (
    <PublicShell bare>
      <PageTitle>{i.pageTitle}</PageTitle>
      <div className={s.home}>
        <div className={s.frame}>
          <div className={cx(s.intro, "flex flex-col gap-6")}>{story}</div>
          {action && <div className={s.access}>{action}</div>}
        </div>
      </div>
    </PublicShell>
  );
}
