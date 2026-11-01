import { alertsFor, type Alert } from "@/lib/questionnaire/alerts";
import { FEATURES } from "@/lib/features";
import { overall } from "@/lib/questionnaire/progress";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { L } from "@/lib/i18n";
import { clientName, openTasks, tasksToCheck, unreadFor } from "@/lib/data/store";
import { awaitingApproval, resultApproved, type Expediente } from "@/lib/data/types";

/** Why a case is asking for the gestoría's attention. */
export type Reason = "unread" | "missing" | "check" | "toReview" | "toFile" | "appointment" | "taskDone";

/** The case's automatic alerts, split into those still to check and those the gestoría marked as reviewed. */
export function alertsOf(e: Expediente) {
  // API mode: the server computes the alerts (the inbox has no answers to compute them from). Reviewing is not in the API yet.
  if (e.remote)
    return {
      active: e.remote.alerts.map((x): Alert => ({ level: x.severity, text: L(x.message, x.message, x.message), title: L(x.message, x.message, x.message), target: { section: SCHEMA.find((s) => s.id === x.section)?.slug ?? x.section, kind: "answers" } })),
      reviewed: [] as Alert[],
    };
  const all = alertsFor(e.answers);
  const done = e.reviewedAlerts ?? {};
  return { active: all.filter((a) => !done[a.text.es]), reviewed: all.filter((a) => done[a.text.es]) };
}

export interface Triage {
  exp: Expediente;
  name: string;
  alerts: Alert[];
  bad: number;
  warn: number;
  unread: number;
  pct: number;
  pending: number;
  reasons: Reason[];
  waiting: Waiting;
}

/** Who has to act next. Derived from the case, not a status of its own. */
export type Waiting = "gestoria" | "cliente" | null;

/**
 * Waiting on the gestoría: an unread message, an answered request, a sent case
 * not yet reviewed, or a result the client approved but not yet filed.
 * Waiting on the client: an open request, a result awaiting approval, or a draft.
 * Under review with nothing pending stays with the gestoría; "listo" with no one.
 */
function waitingOn(e: Expediente, unread: number): Waiting {
  if (unread || tasksToCheck(e).length || e.status === "enviado" || (FEATURES.resultApproval && resultApproved(e) && e.status !== "listo")) return "gestoria";
  if (openTasks(e).length || (FEATURES.resultApproval && awaitingApproval(e)) || e.status === "borrador") return "cliente";
  return e.status === "revision" ? "gestoria" : null;
}

/**
 * A case needs attention when the client wrote and nobody has read it, when
 * documents or answers are missing (alerts marked "bad"), when it was sent and
 * is waiting for review, or when a sent case still has points to check.
 * Drafts with only "check" alerts are left alone: the client is still working.
 */
export function triage(e: Expediente): Triage {
  const alerts = alertsOf(e).active;
  const bad = alerts.filter((a) => a.level === "bad").length;
  const warn = alerts.filter((a) => a.level === "warn").length;
  const unread = unreadFor(e, "gestor");
  const { pct, pending } = e.remote && !e.remote.loaded ? { pct: e.remote.progress.percent, pending: e.remote.progress.total - e.remote.progress.answered } : overall(e.answers);
  const reasons: Reason[] = [];
  if (unread) reasons.push("unread");
  if (bad) reasons.push("missing");
  if (e.status === "enviado") reasons.push("toReview");
  if (FEATURES.resultApproval && resultApproved(e) && e.status !== "listo") reasons.push("toFile");
  if (FEATURES.appointments && e.appointments?.some((a) => a.status === "solicitada")) reasons.push("appointment");
  if (tasksToCheck(e).length) reasons.push("taskDone");
  if (warn && e.status !== "borrador") reasons.push("check");
  return { exp: e, name: clientName(e), alerts, bad, warn, unread, pct, pending, reasons, waiting: waitingOn(e, unread) };
}

export const needsAttention = (x: Triage) => x.reasons.length > 0;

export type SortKey = "recent" | "attention" | "name" | "progress";
export const SORT_KEYS: SortKey[] = ["recent", "attention", "name", "progress"];

const weight = (x: Triage) => x.unread * 100 + x.bad * 10 + (x.exp.status === "enviado" || (resultApproved(x.exp) && x.exp.status !== "listo") ? 5 : 0) + x.warn;

export function sortCases(list: Triage[], key: SortKey): Triage[] {
  const out = [...list];
  switch (key) {
    case "attention":
      return out.sort((a, b) => weight(b) - weight(a) || b.exp.updatedAt.localeCompare(a.exp.updatedAt));
    case "name":
      return out.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "progress":
      return out.sort((a, b) => a.pct - b.pct);
    default:
      return out.sort((a, b) => b.exp.updatedAt.localeCompare(a.exp.updatedAt));
  }
}

/** Days from today to an ISO date (negative once it has passed). */
export const daysUntil = (iso: string) => Math.ceil((new Date(iso + "T23:59:59").getTime() - Date.now()) / 86_400_000);
