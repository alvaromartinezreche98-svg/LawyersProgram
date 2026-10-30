"use client";

import { clientName, useAppState } from "@/lib/data/store";
import { CLERK_ENABLED, DEMO_LOGIN } from "@/lib/auth/config";

/*
 * Invitations (blueprint demo flow): staff creates an invitation, the QR or
 * link opens /invitacion/<token> on the firm's domain, the client signs in by
 * email with Clerk, the invitation is accepted and one case is created.
 *
 * PENDING BACKEND CONTRACT: token format, expiry, whether it is bound to an
 * email, and the check/accept endpoints. Until then, demo mode resolves a
 * token as a local case id; with Clerk on and no demo mode, the page reports
 * "unavailable" instead of guessing the API.
 */

export type InvitationState =
  | { status: "loading" }
  | { status: "valid"; caseId: string; clientName: string; email: string }
  | { status: "notFound" }
  | { status: "expired" }
  | { status: "used" }
  | { status: "unavailable" };

const DEMO = !CLERK_ENABLED || DEMO_LOGIN;

export function useInvitation(token: string): InvitationState {
  const { ready, exps } = useAppState();
  if (!DEMO) return { status: "unavailable" };
  if (!ready) return { status: "loading" };
  const e = exps[token];
  if (!e) return { status: "notFound" };
  return { status: "valid", caseId: e.id, clientName: clientName(e), email: typeof e.answers.email === "string" ? e.answers.email : "" };
}
