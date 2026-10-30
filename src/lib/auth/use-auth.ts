"use client";

import { useCallback } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { actions } from "@/lib/data/store";
import { CLERK_ENABLED } from "./config";

export type AuthState = { status: "demo" } | { status: "loading" } | { status: "signedOut" } | { status: "signedIn"; userId: string };

function useClerkState(): AuthState {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return { status: "loading" };
  return userId ? { status: "signedIn", userId } : { status: "signedOut" };
}
const useDemoState = (): AuthState => ({ status: "demo" });

function useClerkSignOut() {
  const { signOut } = useClerk();
  return useCallback(() => {
    actions.logout();
    void signOut({ redirectUrl: "/" });
  }, [signOut]);
}
const useDemoSignOut = () => actions.logout;

/** Who is signed in with Clerk ("demo" when Clerk is off). Chosen once at build time, so hook order never changes. */
export const useAuthState = CLERK_ENABLED ? useClerkState : useDemoState;

/** Signs out of the app and, with Clerk on, of the Clerk session too. */
export const useSignOut = CLERK_ENABLED ? useClerkSignOut : useDemoSignOut;
