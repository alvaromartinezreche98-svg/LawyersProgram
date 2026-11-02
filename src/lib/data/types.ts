import { L, type Text } from "@/lib/i18n";
import type { Answers, FileRef } from "@/lib/questionnaire/types";
import type { Activity } from "./activity";

/** The four statuses of the prototype. The blueprint rules out inventing more; result approval is tracked on the result itself. */
export type Status = "borrador" | "enviado" | "revision" | "listo";

export const STATUSES: { id: Status; label: Text; help: Text }[] = [
  { id: "borrador", label: L("Borrador", "Draft"), help: L("El cliente está rellenando el cuestionario.", "The client is filling in the questionnaire.") },
  { id: "enviado", label: L("Enviado", "Sent"), help: L("El cliente lo ha enviado: falta que la gestoría lo revise.", "Sent by the client: waiting for the gestoría to review it.") },
  { id: "revision", label: L("En revisión", "Under review"), help: L("La gestoría lo está revisando.", "The gestoría is reviewing it.") },
  { id: "listo", label: L("Listo para presentar", "Ready to file"), help: L("Revisado y listo para presentar en Hacienda.", "Reviewed and ready to file with Hacienda.") },
];

export const statusText = (s: Status): Text => STATUSES.find((x) => x.id === s)?.label ?? L(s, s);

/** C6: the current result was sent and the client has not approved this version yet. */
export const awaitingApproval = (e: Pick<Expediente, "result">) => !!e.result && e.result.approval?.version !== e.result.version;
/** C6: the client approved the current version of the result. */
export const resultApproved = (e: Pick<Expediente, "result">) => !!e.result && e.result.approval?.version === e.result.version;

export type Side = "cliente" | "gestor";

export interface ChatMessage {
  id: string;
  from: Side;
  text: string;
  at: string;
  /** System line shown in the user's language instead of `text`. */
  sys?: "sent" | "resent" | "result" | "approved";
  /** API: the firm's request for missing information (kind information_request). */
  request?: boolean;
  /** Files attached to the message (demo: stored in this browser; the API has no message attachments yet). */
  files?: FileRef[];
}

/** What the API adds to a case it served (API mode only). */
export interface RemoteCase {
  /** Case version, sent as expected_version on guarded writes. */
  version: number;
  definitionVersion: string;
  clientId: string;
  /** The client changed answers or documents after the last send. */
  hasUnsent: boolean;
  progress: { answered: number; total: number; percent: number };
  sections?: { key: string; answered: number; total: number; state: "done" | "partial" | "empty" }[];
  unread: number;
  issues: number;
  alerts: { severity: "bad" | "warn" | "info"; section: string; message: string }[];
  displayName: string;
  noteVersion: number;
  /** Sections, documents, messages and the note have been loaded (the list only carries the summary). */
  loaded: boolean;
  /** Cursor of the last message read, for polling. */
  cursor: string | null;
}

/** One client's Renta case for one tax year. */
export interface Expediente {
  id: string;
  ejercicio: number;
  status: Status;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  answers: Answers;
  chat: ChatMessage[];
  /** Internal notes, visible to the gestoría only. */
  notes: string;
  /** Last gestoría message the client has seen. */
  clientSeen: string;
  /** Last client message the gestoría has seen. */
  gestorSeen: string;
  /** Demo case shipped with the app. */
  example?: boolean;
  /** Team member (Member.id) responsible for the case. Not assigned anywhere yet: the list shows the column once it is. */
  assignee?: string | null;
  /** When the client accepted their invitation (demo: opened the invitation link and accepted). */
  acceptedAt?: string;
  /** C1: when the client confirmed they are the taxpayer. */
  identityConfirmedAt?: string;
  /** C3: the firm's legal documents the client signed, with the version they saw. */
  signatures?: Partial<Record<LegalKind, Signature>>;
  /** C7: the client's payment of the gestoría's fee. */
  payment?: Payment;
  /** C6: the result the gestoría sends for the client's approval. */
  result?: TaxResult;
  /** C8: in-person or phone appointment requests. */
  appointments?: Appointment[];
  /** Links one client's cases across tax years (defaults to the first case's id). */
  clientId?: string;
  /** Set on a case opened from last year's: which sections came pre-filled and which the client confirmed. */
  prefill?: { from: string; sections: string[]; confirmed: string[] };
  /** G3 → C2: things the gestoría has asked the client to do. */
  tasks?: ClientTask[];
  /** Documents the client says they don't have yet, by `slotKey(field, item)`, with an optional note for the gestoría. */
  notYet?: Record<string, { note: string; at: string }>;
  /** Set when the case comes from the API. */
  remote?: RemoteCase;
  /** Automatic alerts the gestoría checked, by the alert's Spanish text. */
  reviewedAlerts?: Record<string, { at: string }>;
  /** G3 · Historial: who did what and when, newest last. */
  activity?: Activity[];
}

/** A request from the gestoría: open → the client marks it done → the gestoría checks it and closes it. */
export interface ClientTask {
  id: string;
  /** What to do: from an alert or a missing document (both languages), or as typed by the gestoría. */
  text: Text;
  /**
   * Where the client resolves it; null for a general request. `field` (and
   * `item`, a repeat item's stable id) point at the exact question, so the
   * client lands on it and an upload there answers the request.
   */
  target: { section: string; kind: "answers" | "docs"; field?: string; item?: string | null } | null;
  createdAt: string;
  /** Set when the client says it is done, with an optional reply. */
  doneAt?: string;
  reply?: string;
  /** Set when the gestoría has checked it. */
  closedAt?: string;
}

export interface Appointment {
  id: string;
  kind: "presencial" | "llamada";
  /** Preferred day (yyyy-mm-dd) and part of the day. */
  date: string;
  slot: "manana" | "tarde";
  note: string;
  status: "solicitada" | "confirmada" | "cancelada";
  createdAt: string;
  /** Set by the gestoría on confirmation. */
  time?: string;
  assignee?: string | null;
}

/** Outcome of the return, sent by the gestoría for the client's approval (conformidad). */
export interface TaxResult {
  kind: "pagar" | "devolver";
  /** Amount in euros as typed by the gestoría ("1.250,40"). */
  amount: string;
  /** Draft of the return (borrador), usually a PDF. */
  file: FileRef | null;
  note: string;
  sentAt: string;
  /** Bumped each time the gestoría sends a new result; an approval is tied to one version. */
  version: number;
  approval?: { version: number; approvedAt: string; approvedBy: string };
}

/** A simple electronic signature: who accepted which version of a document, and when. */
export interface Signature {
  version: number;
  fileName: string;
  signedAt: string;
  signerName: string;
  signerId: string;
}

export interface Payment {
  /** Amount in euros, computed from the firm's fees when the client paid. */
  amount: number;
  status: "pagado";
  paidAt: string;
  /** Delivery 1 has no payment provider: payments are recorded, not charged. */
  method: "simulado";
}

/** "admin" is the PreRenta team (X1–X4): it manages gestorías, not cases. */
export type Session = { role: "cliente"; expId: string } | { role: "gestoria" } | { role: "admin" } | null;

/* ---------- Gestoría (firm) settings · G7 ---------- */

export type LegalKind = "privacy" | "mandate";

/** A legal template the firm uploads (Word or PDF); clients sign it in the questionnaire. */
export interface FirmDoc {
  file: FileRef;
  uploadedAt: string;
  version: number;
}

export type MemberRole = "titular" | "gestor";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
}

export interface Fees {
  /** Base fee for a standard return, in euros (free text, e.g. "60"). */
  base: string;
  /** Extra per rented property. */
  perProperty: string;
  /** Extra for self-employment activity. */
  selfEmployed: string;
  notes: string;
}

export interface Firm {
  name: string;
  cif: string;
  address: string;
  phone: string;
  email: string;
  logo: FileRef | null;
  docs: Record<LegalKind, FirmDoc | null>;
  team: Member[];
  fees: Fees;
  /** Campaign dates (ISO yyyy-mm-dd), set by the gestoría. Not set yet: the dashboard shows countdowns once they are. */
  campaign?: { filing?: string; directDebit?: string };
  /** The chat's quick replies, as the gestoría wrote them. Unset: the built-in ones in the user's language. */
  replies?: QuickReply[];
  /** G8: the plan the gestoría asked for (DEMO: no billing yet, so nothing is charged). */
  subscription?: { planId: string | null; requestedAt: string };
  /** G7: when clients get reminders. Saved here; the backend sends them. */
  reminders?: Reminders;
}

export interface Reminders {
  enabled: boolean;
  /** Days without activity before the first reminder. */
  afterDays: number;
  /** Days between reminders after the first one. */
  everyDays: number;
  /** At most this many reminders per case. */
  max: number;
  channel: "email" | "sms" | "both";
  /** What a reminder is about. */
  when: { questionnaire: boolean; requests: boolean; approval: boolean };
}

export interface QuickReply {
  label: string;
  text: string;
}

/** Key of one upload slot: the question id plus, inside a repeated group, the item's id. */
export const slotKey = (field: string, item?: string | null) => `${field}:${item ?? ""}`;
