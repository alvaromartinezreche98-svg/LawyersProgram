import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { API_MODE, CLERK_ENABLED, SIGN_IN_PATH } from "@/lib/auth/config";
import { ApiBridge } from "./api-bridge";
import { SessionSync } from "./session-sync";

/** Wraps the app in Clerk only when it is configured; never renders Clerk without keys (no keyless mode). */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) return children;
  return (
    <ClerkProvider signInUrl={SIGN_IN_PATH} afterSignOutUrl="/">
      <SessionSync />
      {API_MODE && <ApiBridge />}
      {children}
    </ClerkProvider>
  );
}
