"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { actions, useAppState } from "@/lib/data/store";

/** Clears this tab's app session when the Clerk session ends (expiry, sign-out in another tab). */
export function SessionSync() {
  const { isLoaded, userId } = useAuth();
  const { ready, session } = useAppState();
  useEffect(() => {
    if (isLoaded && ready && !userId && session) actions.logout();
  }, [isLoaded, ready, userId, session]);
  return null;
}
