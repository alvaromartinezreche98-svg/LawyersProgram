"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GESTOR_PREFIXES, SIGN_IN_PATH } from "@/lib/auth/config";
import { useAppState } from "./store";

/**
 * Sends the user to the access page when this tab has no valid session.
 * After a sign-out it goes to the home page; otherwise (e.g. a link opened in a new tab)
 * it keeps the page in ?next= so the user lands back on it after signing in.
 */
export function useSignInRedirect(allowed: boolean) {
  const { ready, signedOut } = useAppState();
  const router = useRouter();
  useEffect(() => {
    if (!ready || allowed) return;
    const here = window.location.pathname + window.location.search;
    router.replace(signedOut ? "/" : `${SIGN_IN_PATH}?next=${encodeURIComponent(here)}`);
  }, [ready, allowed, signedOut, router]);
}

/** The ?next= target from the access page, if it belongs to the given area. */
export function nextPath(role: "cliente" | "gestoria"): string | null {
  const n = new URLSearchParams(window.location.search).get("next");
  if (!n || !n.startsWith("/") || n.startsWith("//")) return null;
  const isGestor = GESTOR_PREFIXES.some((p) => n.startsWith(p));
  return role === "gestoria" ? (isGestor ? n : null) : isGestor ? null : n;
}
