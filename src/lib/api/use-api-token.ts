"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth/config";

/**
 * Name of the Clerk JWT template the Go API verifies (Clerk Dashboard → JWT
 * templates). Without it Clerk's default session token is sent.
 */
export const JWT_TEMPLATE = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || undefined;

function useClerkToken() {
  const { getToken } = useAuth();
  return useCallback(() => getToken(JWT_TEMPLATE ? { template: JWT_TEMPLATE } : undefined), [getToken]);
}
const noToken = () => Promise.resolve(null);
const useNoToken = () => noToken;

/**
 * Returns a function that gives a fresh token for the Authorization header
 * (Clerk refreshes it as needed), or null when Clerk is off. Fetch a new one
 * per request rather than storing it.
 */
export const useApiToken: () => () => Promise<string | null> = CLERK_ENABLED ? useClerkToken : useNoToken;
