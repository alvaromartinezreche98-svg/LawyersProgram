"use client";

import { useEffect, useState } from "react";
import { INVITE_KEY } from "@/lib/api/invite";
import { AccessScreen } from "@/components/access-screen";

/**
 * Opens an invitation link: keeps the code from the fragment for after
 * sign-in (ClerkAccess accepts it), clears it from the address bar, then
 * shows the usual entry page with sign-in.
 */
export function EnterWithCode() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get("code");
    try {
      if (code) sessionStorage.setItem(INVITE_KEY, code);
    } catch {}
    if (code) history.replaceState(null, "", window.location.pathname);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return ready ? <AccessScreen /> : null;
}
