/*
 * The Clerk token for API calls, reachable outside React. <ApiBridge> (inside
 * ClerkProvider) registers Clerk's getToken here; every call asks for a fresh
 * one (Clerk caches and refreshes it; tokens live 60 s). Calls made before
 * Clerk has loaded wait a few seconds for it instead of going out unsigned.
 */
type Getter = (fresh?: boolean) => Promise<string | null>;
let getter: Getter | null = null;
let waiting: ((g: Getter) => void)[] = [];

export const setTokenGetter = (g: Getter | null) => {
  getter = g;
  if (g) {
    waiting.forEach((w) => w(g));
    waiting = [];
  }
};

/** fresh: skip Clerk's cache (after a 401). */
export async function apiToken(fresh = false): Promise<string | null> {
  const g = getter ?? (await new Promise<Getter | null>((resolve) => {
    waiting.push(resolve);
    setTimeout(() => resolve(null), 8000);
  }));
  return g ? g(fresh) : null;
}
