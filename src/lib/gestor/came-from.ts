"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/*
 * Where the gestor came from inside the panel (this tab only), for the phone's
 * back button: a page opened from a shortcut (e.g. "Invitar a un cliente")
 * offers a way back without opening the menu.
 */
const KEY = "prerenta:nav";
/** Root views (where signing in lands): never a back button there, whatever came before. */
const ROOTS = ["/expedientes", "/admin/gestorias"];
type Trail = { cur: string; prev: string | null };

const read = (): Trail | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Trail | null;
  } catch {
    return null;
  }
};

/** In the shell: records each page the panel shows. */
export function useTrackPanelNav() {
  const path = usePathname();
  useEffect(() => {
    const t = read();
    if (t?.cur === path) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ cur: path, prev: t?.cur ?? null }));
    } catch {}
  }, [path]);
}

/**
 * The panel page shown before this one, or null on the first page of the visit and on a root view.
 * Works whichever effect runs first: if the shell has not recorded this page
 * yet, the page it still holds as current is the one we came from.
 */
export function useCameFrom(): string | null {
  const path = usePathname();
  const [from, setFrom] = useState<string | null>(null);
  useEffect(() => {
    const t = read();
    const prev = ROOTS.includes(path) || !t ? null : t.cur !== path ? t.cur : t.prev;
    const raf = requestAnimationFrame(() => setFrom(prev && prev !== path ? prev : null));
    return () => cancelAnimationFrame(raf);
  }, [path]);
  return from;
}
