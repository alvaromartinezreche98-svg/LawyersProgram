"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "@/lib/api/token";
import { JWT_TEMPLATE } from "@/lib/api/use-api-token";
import "@/lib/api/remote";

/** API mode: lets API calls outside React get Clerk's "prerenta-api" token. Renders nothing. */
export function ApiBridge() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    setTokenGetter(isSignedIn ? () => getToken({ template: JWT_TEMPLATE }) : null);
    return () => setTokenGetter(null);
  }, [getToken, isSignedIn]);
  return null;
}
