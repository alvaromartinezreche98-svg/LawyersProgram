"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { actions } from "@/lib/data/store";
import { nextPath } from "@/lib/data/use-sign-in-redirect";
import { acceptInvitationCode, lookupFromError, resolveAccount, type AccountLookup } from "@/lib/auth/account";
import { INVITE_KEY } from "@/lib/api/invite";
import { API_MODE, DEMO_LOGIN } from "@/lib/auth/config";
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

  const [code, setCode] = useState("");
  const handle = useCallback((r: AccountLookup) => {
    setLookup(r);
    if (r.status !== "linked") return;
    if (r.account.role === "client") {
      actions.loginClient(r.account.caseId);
      router.replace(nextPath("cliente") ?? "/inicio");
    } else {
      actions.loginGestoria();
      router.replace(nextPath("gestoria") ?? "/expedientes");
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    // An invitation link (/entrar#code=…) left its code here before sign-in: accept it first.
    // It stays saved until the API has answered for good, so "Reintentar" can send it again.
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(INVITE_KEY);
    } catch {}
    (pending ? acceptInvitationCode(pending) : resolveAccount())
      .catch(lookupFromError)
      .then((r) => {
        if (pending && (r.status === "linked" || r.status === "badCode" || r.status === "staffCode"))
          try {
            sessionStorage.removeItem(INVITE_KEY);
          } catch {}
        if (live) handle(r);
      });
    return () => {
      live = false;
    };
  }, [userId, attempt, handle]);

  const submitCode = (ev: FormEvent) => {
    ev.preventDefault();
    if (!code.trim()) return;
    setLookup(null);
    acceptInvitationCode(code).catch(lookupFromError).then(handle);
  };

  const panel = (children: ReactNode) => <Card pad="lg" className="flex flex-col gap-4">{children}</Card>;
  const signOutBtn = <Button onClick={signOut}>{t.common.signOut}</Button>;

  if (auth.status === "loading") return render(panel(<Loading label={t.auth.loading} />));

  if (auth.status === "signedOut") {
    const back = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;
    // A visitor holding an invitation code is, by definition, new: show sign-UP first, with Clerk's "already have an account" link
    // underneath. Everyone else (staff, returning clients) starts at sign-in. Both get the other form's link through the provider's
    // signInUrl/signUpUrl. Without this, a buyer scanning the QR met a password prompt for an account that did not exist.
    const invited = typeof window !== "undefined" && !!sessionStorage.getItem(INVITE_KEY);
    return render(
      <div className="flex min-w-0 flex-col items-center gap-3 lg:items-stretch">
        {invited
          ? <SignUp routing="hash" forceRedirectUrl={back} signInForceRedirectUrl={back} />
          : <SignIn routing="hash" forceRedirectUrl={back} signUpForceRedirectUrl={back} />}
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

  if (lookup.status === "staffCode")
    return state(t.auth.staffCodeTitle, <Notice tone="warn">{t.auth.staffCodeBody(email)}</Notice>, <><Button variant="primary" onClick={() => { setLookup(null); resolveAccount().catch(lookupFromError).then(handle); }}>{t.auth.staffCodeContinue}</Button>{signOutBtn}</>);

  if (lookup.status === "disabled")
    return state(t.auth.disabledTitle, <Notice tone="bad">{t.auth.disabledBody(email)}</Notice>, signOutBtn);

  // Staging aid: until the backend links Clerk users, pick a demo role instead.
  if (DEMO_LOGIN && !API_MODE && (lookup.status === "unavailable" || lookup.status === "unlinked"))
    return render(undefined, (
      <Notice tone="warn">
        {t.auth.demoBanner(email)}{" "}
        <button type="button" onClick={signOut} className="font-semibold text-accent hover:underline">{t.common.signOut}</button>
      </Notice>
    ));

  // Signed in but not onboarded (403): the firm still has to invite or link this account.
  // Signed in but not a PreRenta user yet: with the API, the invitation code links this account to the client.
  if (API_MODE)
    return render(panel(<>
      <h2 className="display-tight text-[20px] font-semibold">{t.auth.unlinkedTitle}</h2>
      <p className="text-sm text-muted">{t.auth.codeIntro(email)}</p>
      {lookup.status === "badCode" && <Notice tone="bad">{t.auth.badCode}</Notice>}
      <form onSubmit={submitCode} className="flex flex-col gap-2">
        <label htmlFor="inv-code" className="text-[14px] font-semibold">{t.auth.codeLabel}</label>
        <input id="inv-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" spellCheck={false} className="field h-(--control-h) font-mono text-[14px]" />
        <span className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" variant="primary">{t.auth.codeSubmit}</Button>
          {signOutBtn}
        </span>
      </form>
    </>));

  return state(t.auth.unlinkedTitle, <p className="text-sm text-muted">{t.auth.unlinkedBody(email)}</p>, signOutBtn);
}
