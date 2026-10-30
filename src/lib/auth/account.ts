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
  /** Transient failure (5xx, network): worth retrying. */
  | { status: "error"; message: string };

export async function resolveAccount(): Promise<AccountLookup> {
  return { status: "unavailable" };
}

/** Maps a failed account lookup to the state to show. Used once the endpoint exists. */
export function lookupFromError(err: unknown): AccountLookup {
  if (isApiError(err)) {
    if (err.kind === "unauthenticated") return { status: "expired" };
    if (err.kind === "forbidden" || err.kind === "notFound") return { status: "unlinked" };
  }
  return { status: "error", message: isApiError(err) ? err.kind : "unexpected" };
}
