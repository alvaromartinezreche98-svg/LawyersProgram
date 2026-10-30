/*
 * Screens grouped by the backend's Product Blueprint (29 Oct 2026) phases.
 * Everything built is shown: the blueprint schedules NEXT and LATER items for
 * later but does not rule them out. NEXT_PUBLIC_DEMO_SCOPE=1 hides them, to
 * show only the blueprint's "DO NOW" scope (inlined at build time).
 */
import { CLERK_ENABLED } from "@/lib/auth/config";

const ON = process.env.NEXT_PUBLIC_DEMO_SCOPE !== "1";
/**
 * With the API connected, only what the API supports is shown (openapi v0.3.0):
 * questionnaire, documents, send, chat with information requests, internal
 * note, status, clients and invitations. The rest stays in the demo until the
 * backend has it.
 */
const API = CLERK_ENABLED && !!process.env.NEXT_PUBLIC_API_URL;
const DEMO_ONLY = ON && !API;

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
  identityCheck: DEMO_ONLY,
  /** C3 signing step for the firm's legal documents; G7 legal templates. */
  signing: DEMO_ONLY,
  /** C7 payment, G6 payments, G7 fees. */
  payments: ON,
  /** G7 firm settings (firm, legal, team, fees, campaign). */
  firmSettings: DEMO_ONLY,
  /** P contact page. (The PreRenta marketing home belongs on the main domain; "/" here is the firm's landing.) */
  publicSite: ON,
  /* LATER · priority / future */
  /** C6 result + approval, G3 result panel. */
  resultApproval: DEMO_ONLY,
  /** C8 appointment requests, G5 appointments. */
  appointments: DEMO_ONLY,
  /** G1 campaign board and campaign deadlines. */
  campaignBoard: DEMO_ONLY,
  /** Next tax year cases, "sigue igual" pre-fill and C9 past returns. */
  prefill: DEMO_ONLY,
  /** G3 detailed activity history (always recorded; this is the view). */
  activityLog: DEMO_ONLY,
  /** Requests as tracked objects (pinned on the question, answered, resolved), "No lo tengo todavía" and reviewed alerts. The API has information_request messages only. */
  requestTracking: !API,
};

export type Feature = keyof typeof FEATURES;
