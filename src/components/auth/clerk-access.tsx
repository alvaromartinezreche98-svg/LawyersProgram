"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { actions } from "@/lib/data/store";
import { nextPath } from "@/lib/data/use-sign-in-redirect";
import { lookupFromError, resolveAccount, type AccountLookup } from "@/lib/auth/account";
import { DEMO_LOGIN } from "@/lib/auth/config";
import { useAuthState, useSignOut } from "@/lib/auth/use-auth";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card, Loading, Notice } from "@/components/ui/primitives";

/**
 * Access with Clerk: sign in, then ask the backend which app user this is.
 * `render(gate, banner)` draws the access page with either a gate panel
 * (sign-in, loading, errors) or, in demo mode, the demo picker under a banner.
 */
export function ClerkAccess({ render }: { render: (gate?: ReactNode, banner?: ReactNode) => ReactNode }) {
  const auth = useAuthState();
  const { user } = useUser();
  const { t } = useI18n();
  const router = useRouter();
  const signOut = useSignOut();
  const [lookup, setLookup] = useState<AccountLookup | null>(null);
  const [attempt, setAttempt] = useState(0);
  const userId = auth.status === "signedIn" ? auth.userId : null;

  useEffect(() => {
    if (!userId) return;
    let live = true;
    resolveAccount()
      .catch(lookupFromError)
      .then((r) => {
        if (!live) return;
        setLookup(r);
        if (r.status !== "linked") return;
        if (r.account.role === "client") {
          actions.loginClient(r.account.caseId);
          router.replace(nextPath("cliente") ?? "/inicio");
        } else {
          actions.loginGestoria();
          router.replace(nextPath("gestoria") ?? "/expedientes");
        }
      });
    return () => {
      live = false;
    };
  }, [userId, attempt, router]);

  const panel = (children: ReactNode) => <Card className="flex flex-col gap-4 p-6 sm:p-7">{children}</Card>;
  const signOutBtn = <Button onClick={signOut}>{t.common.signOut}</Button>;

  if (auth.status === "loading") return render(panel(<Loading label={t.auth.loading} />));

  if (auth.status === "signedOut") {
    const back = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;
    return render(
      <div className="flex min-w-0 flex-col items-center gap-3 lg:items-stretch">
        <SignIn routing="hash" forceRedirectUrl={back} signUpForceRedirectUrl={back} />
      </div>,
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  if (!lookup || lookup.status === "linked") return render(panel(<Loading label={t.auth.linking} />));

  const retry = () => { setLookup(null); setAttempt((n) => n + 1); };
  const state = (title: string, body: ReactNode, actions: ReactNode) => render(panel(<>
    <h2 className="display-tight text-[20px] font-semibold">{title}</h2>
    {body}
    <div className="flex flex-wrap gap-2">{actions}</div>
  </>));

  // Transient server or network failure: nothing is wrong with the account, so offer a retry.
  if (lookup.status === "error")
    return state(t.auth.errorTitle, <Notice tone="bad">{t.auth.errorBody}</Notice>, <><Button variant="primary" onClick={retry}>{t.auth.retry}</Button>{signOutBtn}</>);

  // 401 from the API: the Clerk session is no longer valid, so start a fresh sign-in.
  if (lookup.status === "expired")
    return state(t.auth.expiredTitle, <p className="text-sm text-muted">{t.auth.expiredBody}</p>, <Button variant="primary" onClick={signOut}>{t.sync.signIn}</Button>);

  if (lookup.status === "disabled")
    return state(t.auth.disabledTitle, <Notice tone="bad">{t.auth.disabledBody(email)}</Notice>, signOutBtn);

  // Staging aid: until the backend links Clerk users, pick a demo role instead.
  if (DEMO_LOGIN && (lookup.status === "unavailable" || lookup.status === "unlinked"))
    return render(undefined, (
      <Notice tone="warn">
        {t.auth.demoBanner(email)}{" "}
        <button type="button" onClick={signOut} className="font-semibold text-accent hover:underline">{t.common.signOut}</button>
      </Notice>
    ));

  // Signed in but not onboarded (403): the firm still has to invite or link this account.
  return state(t.auth.unlinkedTitle, <p className="text-sm text-muted">{t.auth.unlinkedBody(email)}</p>, signOutBtn);
}
