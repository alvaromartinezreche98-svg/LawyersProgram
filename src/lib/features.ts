/*
 * Screens grouped by the backend's Product Blueprint (29 Oct 2026) phases.
 * Everything built is shown: the blueprint schedules NEXT and LATER items for
 * later but does not rule them out. NEXT_PUBLIC_DEMO_SCOPE=1 hides them, to
 * show only the blueprint's "DO NOW" scope (inlined at build time).
 */
import { CLERK_ENABLED } from "@/lib/auth/config";

const ON = process.env.NEXT_PUBLIC_DEMO_SCOPE !== "1";

/**
 * DEMO ONLY. The client's "Pagar" button marks the fee as paid in this browser;
 * no payment request is sent and nothing is charged (design reference §4.3).
 * On in the local demo; with Clerk it needs NEXT_PUBLIC_DEMO_PAYMENT=1, and it
 * must stay off for real customers until a payment provider is integrated.
 */
export const SIMULATED_PAYMENT = !CLERK_ENABLED || process.env.NEXT_PUBLIC_DEMO_PAYMENT === "1";

export const FEATURES = {
  /* NEXT · core platform */
  /** C1 identity confirmation before the questionnaire. */
  identityCheck: ON,
  /** C3 signing step for the firm's legal documents; G7 legal templates. */
  signing: ON,
  /** C7 payment, G6 payments, G7 fees. */
  payments: ON,
  /** G7 firm settings (firm, legal, team, fees, campaign). */
  firmSettings: ON,
  /** P contact page. (The PreRenta marketing home belongs on the main domain; "/" here is the firm's landing.) */
  publicSite: ON,
  /* LATER · priority / future */
  /** C6 result + approval, G3 result panel. */
  resultApproval: ON,
  /** C8 appointment requests, G5 appointments. */
  appointments: ON,
  /** G1 campaign board and campaign deadlines. */
  campaignBoard: ON,
  /** Next tax year cases, "sigue igual" pre-fill and C9 past returns. */
  prefill: ON,
  /** G3 detailed activity history (always recorded; this is the view). */
  activityLog: ON,
};

export type Feature = keyof typeof FEATURES;
