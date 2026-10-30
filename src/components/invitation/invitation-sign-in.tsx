"use client";

import { SignIn } from "@clerk/nextjs";

/** Email sign-in with Clerk that returns to this invitation. Only rendered with Clerk on. */
export function InvitationSignIn() {
  const back = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;
  return <SignIn routing="hash" forceRedirectUrl={back} signUpForceRedirectUrl={back} />;
}
