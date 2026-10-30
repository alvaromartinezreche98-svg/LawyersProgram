"use client";

import { useEffect } from "react";
import { API_MODE } from "@/lib/auth/config";

/** API mode: loads one case in full and keeps it fresh (chat, status) while a screen shows it. */
export function useRemoteCase(id: string | undefined, staff: boolean) {
  useEffect(() => {
    if (!API_MODE || !id) return;
    let stop: (() => void) | undefined;
    let live = true;
    import("./remote").then((m) => {
      if (live) stop = m.watchCase(id, staff);
    });
    return () => {
      live = false;
      stop?.();
    };
  }, [id, staff]);
}

/** API mode: the firm's inbox, refreshed every 30 s while the gestoría panel is open. */
export function useRemoteInbox(enabled: boolean) {
  useEffect(() => {
    if (!API_MODE || !enabled) return;
    const load = () => import("./remote").then((m) => m.loadInbox()).catch(() => {});
    void load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [enabled]);
}

/** API mode: after a reload the tab still has its session but not the case; fetch it again. */
export function useRemoteClientCase(needed: boolean) {
  useEffect(() => {
    if (!API_MODE || !needed) return;
    import("./remote").then((m) => m.loadClientCase()).catch(() => {});
  }, [needed]);
}
