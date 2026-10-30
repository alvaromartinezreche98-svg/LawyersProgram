/*
 * Link between a Clerk user and the application's own user. Clerk only proves
 * who signed in; the backend decides whether they are the client, staff or the
 * firm admin, and owns client records and case ownership (Product Blueprint,
 * 29 Oct 2026). The firm is the one behind the current domain, so no firm id
 * travels here. Platform-wide admin is a separate surface, not this app.
 *
 * PENDING BACKEND CONTRACT. The backend has to verify the Clerk session token,
 * map its user id to an app user and return that user's role and scope. Until
 * the endpoint and its response are agreed, resolveAccount() reports
 * "unavailable" instead of guessing an API.
 */

import { isApiError } from "@/lib/api/client";
import { API_MODE } from "./config";

export type Account =
  | { role: "client"; caseId: string }
  | { role: "staff" }
  | { role: "firmAdmin" };

/** The four access states the design reference (§8) asks for, besides "linked". */
export type AccountLookup =
  | { status: "linked"; account: Account }
  /** Signed in with Clerk, but not onboarded: no app user is linked to this Clerk user yet (403). */
  | { status: "unlinked" }
  /** The app user exists but was turned off. The backend must say so explicitly; a bare 403 is read as "unlinked". */
  | { status: "disabled" }
  /** The token was refused (401): the Clerk session expired or is no longer valid. */
  | { status: "expired" }
  /** No backend to ask yet. */
  | { status: "unavailable" }
  /** The invitation code is unknown, used, expired or revoked (the API does not say which). */
  | { status: "badCode" }
  /** A staff account opened a client invitation; only a separate client account can accept it. */
  | { status: "staffCode" }
  /** Transient failure (5xx, network): worth retrying. */
  | { status: "error"; message: string };

/**
 * GET /v1/me: the API decides who this Clerk user is. A client is linked to
 * their newest case (loaded into the store); staff (admin or accountant) get
 * the firm's inbox. Without the API there is nothing to ask.
 */
export async function resolveAccount(): Promise<AccountLookup> {
  if (!API_MODE) return { status: "unavailable" };
  const { api } = await import("@/lib/api/endpoints");
  const { loadClientCase, loadInbox } = await import("@/lib/api/remote");
  try {
    const me = await api.me();
    if (me.roles.includes("admin") || me.roles.includes("accountant")) {
      await loadInbox();
      return { status: "linked", account: me.roles.includes("admin") ? { role: "firmAdmin" } : { role: "staff" } };
    }
    const caseId = await loadClientCase();
    return caseId ? { status: "linked", account: { role: "client", caseId } } : { status: "unlinked" };
  } catch (err) {
    return lookupFromError(err);
  }
}

/** POST /v1/invitations/accept with the code from the invitation link or typed by the client. */
export async function acceptInvitationCode(code: string): Promise<AccountLookup> {
  const { api } = await import("@/lib/api/endpoints");
  // Staff cannot accept a client invitation: say so instead of sending it.
  const me = await api.me().catch(() => null);
  if (me && (me.roles.includes("admin") || me.roles.includes("accountant"))) return { status: "staffCode" };
  try {
    // Safe to repeat: the same code with the same account just returns the link again.
    await api.acceptInvitation(code.trim());
    return resolveAccount();
  } catch (err) {
    if (isApiError(err) && err.kind === "notFound") return { status: "badCode" };
    return lookupFromError(err);
  }
}

/** Maps a failed account lookup to the state to show. Used once the endpoint exists. */
export function lookupFromError(err: unknown): AccountLookup {
  if (isApiError(err)) {
    if (err.kind === "unauthenticated") return { status: "expired" };
    if (err.kind === "forbidden" || err.kind === "notFound") return { status: "unlinked" };
  }
  return { status: "error", message: isApiError(err) ? err.kind : "unexpected" };
}
