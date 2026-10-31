"use client";

import { useSyncExternalStore } from "react";

/*
 * The PreRenta team's view of the platform (sitemap X1–X4, A7): the gestorías
 * on it and the subscription plans. DEMO ONLY: kept in this browser until the
 * backend has accounts and billing. Nothing here is invented: the list starts
 * with the demo gestoría only, and plans are empty until the team adds them.
 */

export type FirmStatus = "pending" | "active" | "paused";

export interface PlatformFirm {
  id: string;
  name: string;
  cif: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  /** "signup": from the public form (A7); "admin": created by hand (X1). */
  source: "signup" | "admin";
  status: FirmStatus;
  planId: string | null;
  createdAt: string;
  notes: string;
}

export interface Plan {
  id: string;
  name: string;
  /** Monthly price in euros as typed (free text); empty until decided. */
  price: string;
  /** Cases included per campaign; empty means not set. */
  cases: string;
  notes: string;
}

interface PlatformState {
  firms: PlatformFirm[];
  plans: Plan[];
}

const KEY = "prerenta:platform:v1";
const EMPTY: PlatformState = { firms: [], plans: [] };
let state: PlatformState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
}

function commit(next: PlatformState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePlatform(): PlatformState {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => EMPTY,
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const platform = {
  addFirm(f: Omit<PlatformFirm, "id" | "createdAt" | "status" | "notes"> & { status?: FirmStatus }): string {
    load();
    const id = uid();
    commit({ ...state, firms: [{ notes: "", status: "pending", ...f, id, createdAt: new Date().toISOString() }, ...state.firms] });
    return id;
  },
  updateFirm(id: string, patch: Partial<PlatformFirm>) {
    load();
    commit({ ...state, firms: state.firms.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  },
  removeFirm(id: string) {
    load();
    commit({ ...state, firms: state.firms.filter((f) => f.id !== id) });
  },
  addPlan(): string {
    load();
    const id = uid();
    commit({ ...state, plans: [...state.plans, { id, name: "", price: "", cases: "", notes: "" }] });
    return id;
  },
  updatePlan(id: string, patch: Partial<Plan>) {
    load();
    commit({ ...state, plans: state.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },
  removePlan(id: string) {
    load();
    commit({ ...state, plans: state.plans.filter((p) => p.id !== id), firms: state.firms.map((f) => (f.planId === id ? { ...f, planId: null } : f)) });
  },
};

/** The demo gestoría this deployment runs; always listed first in X1. */
export const DEMO_FIRM_ID = "demo";
