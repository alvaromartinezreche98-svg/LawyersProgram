"use client";

import { useSyncExternalStore } from "react";
import { EJERCICIO } from "@/lib/questionnaire/schema";
import type { AnswerValue, Answers, FileRef, Path } from "@/lib/questionnaire/types";
import { nowIso, uid } from "@/lib/format";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n";
import { EXAMPLES, EXAMPLES_REV, EXAMPLE_FIRM } from "./examples";
import { PREFILL_SECTIONS, carryOver } from "./years";
import { answerChanges, bySection, logged, type Activity } from "./activity";
import { getIn, setIn, withItemIds } from "@/lib/questionnaire/progress";
import { API_MODE, LOCAL_DATA } from "@/lib/auth/config";
import { SIMULATED_PAYMENT } from "@/lib/features";
import { purgeFiles } from "./files";
import { slotKey } from "./types";
import type { Appointment, ChatMessage, ClientTask, Expediente, Firm, FirmDoc, LegalKind, Member, Session, Side, Signature, Status, TaxResult } from "./types";

/*
 * Delivery 1 data layer. Cases live in localStorage, so a client tab and a
 * gestoría tab in the same browser see each other's changes (the `storage`
 * event keeps them in sync). The session is per tab, in sessionStorage.
 *
 * Every write goes through the actions below; swapping this module for a real
 * backend later does not touch the screens.
 *
 * Only the demo (LOCAL_DATA) keeps cases in the browser. With real accounts
 * nothing is read from or written to localStorage, and copies left by an
 * earlier demo session are removed, so answers never stay on the device.
 */

const DATA_KEY = "prerenta:data:v1";
const SESSION_KEY = "prerenta:session";
const LANG_KEY = "prerenta:lang";
const FIRM_KEY = "prerenta:firm:v1";

export interface AppState {
  ready: boolean;
  lang: Lang;
  session: Session;
  exps: Record<string, Expediente>;
  firm: Firm;
  save: SaveState;
  /** Set by an explicit sign-out, so the shells send the user to "/" without a return link. */
  signedOut: boolean;
}

/**
 * Whether the last changes are stored. "saved" is only set once the write
 * succeeded; "failed" keeps the changes in memory until retrySave() works.
 */
export type SaveState = { status: "idle" | "saving" | "saved" | "merged" | "failed"; at: string | null };

/** The firm this deployment serves outside the demo. The API has no firm endpoint yet, so its name comes from the deployment's env (NEXT_PUBLIC_FIRM_NAME); nothing from the demo firm is shown to real users. */
const API_FIRM: Firm = { ...structuredClone(EXAMPLE_FIRM), name: process.env.NEXT_PUBLIC_FIRM_NAME ?? "", address: "", team: [] };

// Real accounts never see the demo firm, not even in the server-rendered first paint.
const SERVER_STATE: AppState = { ready: false, lang: DEFAULT_LANG, session: null, exps: {}, firm: LOCAL_DATA ? EXAMPLE_FIRM : API_FIRM, save: { status: "idle", at: null }, signedOut: false };
let state: AppState = SERVER_STATE;
const listeners = new Set<() => void>();

const seed = () => Object.fromEntries(EXAMPLES.map((e) => [e.id, structuredClone(e)]));

/** Statuses saved by an earlier build that no longer exist (approval is now tracked on the result). */
const LEGACY_STATUS: Record<string, Status> = { conformidad: "revision", conforme: "revision" };

/** Normalises saved cases: stable ids on repeatable-group items, and only the four statuses. */
const normalise = (exps: Record<string, Expediente>) =>
  Object.fromEntries(Object.entries(exps).map(([id, e]) => [id, { ...e, status: LEGACY_STATUS[e.status] ?? e.status, answers: withItemIds(e.answers) }]));

const REV_KEY = "prerenta:examples:rev";
/** Whether this browser saved its demo data before the current set of examples. */
const examplesBehind = () => {
  try {
    return Number(localStorage.getItem(REV_KEY) ?? 1) < EXAMPLES_REV;
  } catch {
    return false;
  }
};

function readData(): Record<string, Expediente> {
  if (!LOCAL_DATA) return {};
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, Expediente>;
      // New example cases join saved data once; the user's own cases and edits stay as they are.
      return normalise(examplesBehind() ? { ...seed(), ...saved } : saved);
    }
  } catch {}
  return normalise(seed());
}

function readFirm(): Firm {
  if (!LOCAL_DATA) return structuredClone(API_FIRM);
  try {
    const raw = localStorage.getItem(FIRM_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Firm>;
      const firm = { ...structuredClone(EXAMPLE_FIRM), ...saved };
      // New example team members join once, like the example cases.
      if (examplesBehind() && saved.team) firm.team = [...saved.team, ...EXAMPLE_FIRM.team.filter((m) => !saved.team!.some((x) => x.id === m.id))];
      return firm;
    }
  } catch {}
  return structuredClone(EXAMPLE_FIRM);
}

function readSession(): Session {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {}
  return null;
}

function readLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (isLang(v)) return v;
  } catch {}
  return DEFAULT_LANG;
}

function init() {
  if (state.ready || typeof window === "undefined") return;
  if (!LOCAL_DATA) purgeLocalData();
  state = { ready: true, lang: readLang(), session: readSession(), exps: readData(), firm: readFirm(), save: { status: "idle", at: null }, signedOut: false };
  // The merged examples are written straight away, and only then marked as done, so a reload keeps them.
  if (LOCAL_DATA && examplesBehind())
    try {
      if (localStorage.getItem(DATA_KEY)) localStorage.setItem(DATA_KEY, JSON.stringify(state.exps));
      if (localStorage.getItem(FIRM_KEY)) localStorage.setItem(FIRM_KEY, JSON.stringify(state.firm));
      localStorage.setItem(REV_KEY, String(EXAMPLES_REV));
    } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key === FIRM_KEY) state = { ...state, firm: readFirm() };
    else if (e.key === DATA_KEY) state = { ...state, exps: readData() };
    else return;
    emit();
  });
}

const emit = () => listeners.forEach((l) => l());

/** Removes demo cases and files a previous demo session left in this browser. */
function purgeLocalData() {
  try {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(FIRM_KEY);
  } catch {}
  void purgeFiles().catch(() => {});
}

const setSave = (status: SaveState["status"], at = state.save.at) => {
  state = { ...state, save: { status, at } };
  emit();
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function write() {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(state.exps));
    localStorage.setItem(FIRM_KEY, JSON.stringify(state.firm));
    setSave("saved", nowIso());
  } catch {
    setSave("failed");
  }
}
function persist() {
  // Without local data there is nowhere to save yet: the API layer will report its own result.
  if (!LOCAL_DATA) return;
  clearTimeout(saveTimer);
  if (state.save.status !== "saving") setSave("saving");
  saveTimer = setTimeout(write, 400);
}

function subscribe(l: () => void) {
  init();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getSnapshot() {
  init();
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/* ---------- API mode bridge ---------- */

/** What lib/api/remote.ts does for the actions below in API mode. */
export interface RemoteHooks {
  answers(id: string, before: Answers, after: Answers): void;
  submit(id: string): Promise<void>;
  status(id: string, status: Status): Promise<void>;
  message(id: string, text: string, request: boolean): Promise<void>;
  read(id: string): Promise<void>;
  note(id: string): void;
  retry(): void;
}
let remote: RemoteHooks | null = null;
export const setRemoteHooks = (h: RemoteHooks) => {
  remote = h;
};
/** Calls the API in API mode; failures surface through the save state or the next refresh. */
const viaApi = (f: (r: RemoteHooks) => Promise<void> | void) => {
  if (!API_MODE || !remote) return false;
  void Promise.resolve(f(remote)).catch(() => setSave("failed"));
  return true;
};

/** Lets lib/api/remote.ts write server data into the store (never saved in the browser). */
export const remoteStore = {
  get: () => state,
  putCases(list: Expediente[]) {
    state = { ...state, exps: { ...state.exps, ...Object.fromEntries(list.map((e) => [e.id, e])) } };
    emit();
  },
  patchCase(id: string, patch: Partial<Expediente> | ((e: Expediente) => Partial<Expediente>)) {
    const e = state.exps[id];
    if (!e) return;
    const p = typeof patch === "function" ? patch(e) : patch;
    state = { ...state, exps: { ...state.exps, [id]: { ...e, ...p } } };
    emit();
  },
  setSave(status: SaveState["status"], at?: string) {
    setSave(status, at ?? state.save.at);
  },
};

/* ---------- Actions ---------- */

function patchExp(id: string, patch: Partial<Expediente> | ((e: Expediente) => Partial<Expediente>), touch = true) {
  const e = state.exps[id];
  if (!e) return;
  const p = typeof patch === "function" ? patch(e) : patch;
  state = { ...state, exps: { ...state.exps, [id]: { ...e, ...p, ...(touch ? { updatedAt: nowIso() } : {}) } } };
  emit();
  persist();
}

function patchFirm(patch: Partial<Firm> | ((f: Firm) => Partial<Firm>)) {
  const p = typeof patch === "function" ? patch(state.firm) : patch;
  state = { ...state, firm: { ...state.firm, ...p } };
  emit();
  persist();
}

/** Applies several history entries in order (e.g. an edit and an upload in one change). */
function logAll(e: Expediente, evs: Omit<Activity, "id" | "at">[]): Partial<Expediente> {
  let cur = e;
  for (const ev of evs) cur = { ...cur, ...logged(cur, ev) };
  return { activity: cur.activity };
}

function setSession(session: Session) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
  state = { ...state, session, signedOut: session === null };
  emit();
}

const taskLog = (e: Expediente, taskId: string, by: Side, kind: Activity["kind"]) => {
  const task = (e.tasks ?? []).find((x) => x.id === taskId);
  return task ? logged(e, { by, kind, text: task.text }) : {};
};

export const actions = {
  setLang(lang: Lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
    state = { ...state, lang };
    emit();
  },

  loginClient(expId: string) {
    setSession({ role: "cliente", expId });
  },
  loginGestoria() {
    setSession({ role: "gestoria" });
  },
  /** Demo only: the PreRenta team's admin area (X1–X4). */
  loginAdmin() {
    setSession({ role: "admin" });
  },
  logout() {
    setSession(null);
  },

  /** Tries the last failed save again. */
  retrySave() {
    if (viaApi((r) => r.retry())) return;
    clearTimeout(saveTimer);
    setSave("saving");
    saveTimer = setTimeout(write, 150);
  },

  /** Creates an empty case for a new client and returns its id. */
  createClient(nombre: string, email: string) {
    const id = uid("c-");
    const t = nowIso();
    const exp: Expediente = {
      id, ejercicio: EJERCICIO, status: "borrador", sentAt: null, createdAt: t, updatedAt: t,
      answers: { nombre, ...(email ? { email } : {}) },
      chat: [], notes: "", clientSeen: "", gestorSeen: "",
    };
    exp.activity = logged(exp, { by: "gestor", kind: "created" }).activity;
    state = { ...state, exps: { ...state.exps, [id]: exp } };
    emit();
    persist();
    return id;
  },

  /** Only the client edits answers; the gestoría's "view as client" is read-only. */
  /**
   * Sets one answer on the case's answers as they are now, not as a component last
   * saw them: an upload that finishes later cannot undo edits made meanwhile.
   */
  setAnswer(id: string, path: Path, value: AnswerValue | undefined) {
    const cur = state.exps[id]?.answers;
    if (cur) actions.setAnswers(id, setIn(cur, path, value));
  },
  /** Like setAnswer, from the current value (two uploads to different questions both keep their files). */
  updateAnswer(id: string, path: Path, fn: (cur: AnswerValue | undefined) => AnswerValue | undefined) {
    const cur = state.exps[id]?.answers;
    if (cur) actions.setAnswers(id, setIn(cur, path, fn(getIn(cur, path))));
  },
  setAnswers(id: string, answers: Answers) {
    const before = state.exps[id]?.answers;
    patchExp(id, (e) => {
      const ch = answerChanges(e.answers, answers);
      return {
        answers,
        ...logAll(e, [
          ...ch.sections.map((section) => ({ by: "cliente" as const, kind: "answers" as const, section })),
          ...bySection(ch.added).map(([section, files]) => ({ by: "cliente" as const, kind: "uploaded" as const, section, files })),
          ...bySection(ch.removed).map(([section, files]) => ({ by: "cliente" as const, kind: "removed" as const, section, files })),
        ]),
      };
    });
    if (before) viaApi((r) => r.answers(id, before, answers));
  },

  sendToGestoria(id: string) {
    if (viaApi((r) => r.submit(id))) return;
    const at = nowIso();
    patchExp(id, (e) => ({
      status: "enviado",
      sentAt: at,
      chat: [...e.chat, { id: uid("m"), from: "cliente", sys: e.status === "borrador" ? "sent" : "resent", at, text: "" }],
      ...logged(e, { by: "cliente", kind: e.status === "borrador" ? "sent" : "resent" }),
    }));
  },

  /** Gestoría-side change: does not count as client activity, so the case keeps its place in the list. */
  setStatus(id: string, status: Status) {
    if (viaApi((r) => r.status(id, status))) return;
    patchExp(id, (e) => (e.status === status ? {} : { status, ...logged(e, { by: "gestor", kind: "status", from: e.status, to: status }) }), false);
  },

  sendMessage(id: string, from: Side, text: string, request = false, files?: FileRef[]) {
    const msg: ChatMessage = { id: uid(API_MODE ? "tmp-" : "m"), from, text, at: nowIso(), ...(request ? { request: true } : {}), ...(files?.length ? { files } : {}) };
    patchExp(id, (e) => ({
      chat: [...e.chat, msg],
      ...(from === "cliente" ? { clientSeen: msg.at } : { gestorSeen: msg.at }),
    }));
    viaApi((r) => r.message(id, text, request));
  },

  markSeen(id: string, side: Side) {
    const e = state.exps[id];
    if (!e) return;
    if (viaApi((r) => r.read(id))) return;
    const other: Side = side === "cliente" ? "gestor" : "cliente";
    const last = e.chat.reduce((acc, m) => (m.from === other && m.at > acc ? m.at : acc), "");
    const key = side === "cliente" ? "clientSeen" : "gestorSeen";
    if (last && last > e[key]) patchExp(id, { [key]: last }, false);
  },

  setNotes(id: string, notes: string) {
    patchExp(id, { notes }, false);
    viaApi((r) => r.note(id));
  },

  /** C6: the gestoría sends (or replaces) the result for approval. A new result clears any earlier approval. */
  sendResult(id: string, r: Pick<TaxResult, "kind" | "amount" | "file" | "note">) {
    const at = nowIso();
    patchExp(id, (e) => ({
      result: { ...r, sentAt: at, version: (e.result?.version ?? 0) + 1 },
      chat: [...e.chat, { id: uid("m"), from: "gestor", sys: "result", at, text: "" }],
      ...logged(e, { by: "gestor", kind: "resultSent", amount: r.amount }),
    }), false);
  },

  /** C6: the client approves the current result. */
  approveResult(id: string, approvedBy: string) {
    const at = nowIso();
    patchExp(id, (e) => (e.result ? {
      result: { ...e.result, approval: { version: e.result.version, approvedAt: at, approvedBy } },
      chat: [...e.chat, { id: uid("m"), from: "cliente", sys: "approved", at, text: "" }],
      ...logged(e, { by: "cliente", kind: "resultApproved", amount: e.result.amount }),
    } : {}));
  },

  /** C8: the client asks for a visit or a call. */
  requestAppointment(id: string, a: Pick<Appointment, "kind" | "date" | "slot" | "note">) {
    patchExp(id, (e) => ({ appointments: [...(e.appointments ?? []), { ...a, id: uid("ap-"), status: "solicitada", createdAt: nowIso() }], ...logged(e, { by: "cliente", kind: "apRequested" }) }));
  },
  /** G5: the gestoría confirms, sets a time and (optionally) an accountant. */
  /** An appointment the gestoría agreed with the client another way: confirmed from the start, shown in the client's portal. */
  scheduleAppointment(id: string, a: Pick<Appointment, "kind" | "date" | "note"> & { time: string; assignee: string | null }) {
    const slot: Appointment["slot"] = a.time < "14:00" ? "manana" : "tarde";
    patchExp(id, (e) => ({ appointments: [...(e.appointments ?? []), { ...a, slot, id: uid("ap-"), status: "confirmada", createdAt: nowIso() }], ...logged(e, { by: "gestor", kind: "apConfirmed" }) }), false);
  },
  confirmAppointment(id: string, apId: string, time: string, assignee: string | null) {
    patchExp(id, (e) => ({ appointments: (e.appointments ?? []).map((a) => (a.id === apId ? { ...a, status: "confirmada", time, assignee } : a)), ...logged(e, { by: "gestor", kind: "apConfirmed" }) }), false);
  },
  cancelAppointment(id: string, apId: string) {
    patchExp(id, (e) => ({ appointments: (e.appointments ?? []).map((a) => (a.id === apId ? { ...a, status: "cancelada" } : a)), ...logged(e, { by: "gestor", kind: "apCancelled" }) }), false);
  },

  /** G3: opens the client's case for the next tax year, pre-filled with what does not change. Returns its id. */
  openNextYear(id: string) {
    const e = state.exps[id];
    if (!e) return null;
    const year = e.ejercicio + 1;
    const existing = Object.values(state.exps).find((x) => (x.clientId ?? x.id) === (e.clientId ?? e.id) && x.ejercicio === year);
    if (existing) return existing.id;
    const nid = uid("c-");
    const t = nowIso();
    const next: Expediente = {
      id: nid, ejercicio: year, status: "borrador", sentAt: null, createdAt: t, updatedAt: t,
      answers: withItemIds(carryOver(e.answers)), chat: [], notes: "", clientSeen: "", gestorSeen: "",
      clientId: e.clientId ?? e.id, assignee: e.assignee ?? null, identityConfirmedAt: e.identityConfirmedAt,
      prefill: { from: e.id, sections: PREFILL_SECTIONS, confirmed: [] },
    };
    next.activity = logged(next, { by: "gestor", kind: "created", year: e.ejercicio }).activity;
    state = { ...state, exps: { ...state.exps, [nid]: next, [id]: { ...e, ...logged(e, { by: "gestor", kind: "nextYear", year }) } } };
    emit();
    persist();
    return nid;
  },
  /** C3: the client confirms a pre-filled section still applies ("sigue igual"). */
  confirmPrefill(id: string, section: string) {
    patchExp(id, (e) => (e.prefill ? { prefill: { ...e.prefill, confirmed: [...new Set([...e.prefill.confirmed, section])] }, ...logged(e, { by: "cliente", kind: "prefillConfirmed", section }) } : {}));
  },

  /** G3: the gestoría asks the client for something; it shows up as a task in the client's Home. */
  askClient(id: string, text: ClientTask["text"], target: ClientTask["target"]) {
    // The API has no request objects: a request is an information_request message in the chat.
    if (API_MODE) return actions.sendMessage(id, "gestor", text.es, true);
    const task: ClientTask = { id: uid("t-"), text, target, createdAt: nowIso() };
    patchExp(id, (e) => ({ tasks: [...(e.tasks ?? []), task], ...logged(e, { by: "gestor", kind: "taskAsked", text }) }), false);
  },
  /** C2: the client says a task is done, optionally with a reply. */
  completeTask(id: string, taskId: string, reply: string) {
    patchExp(id, (e) => ({ tasks: (e.tasks ?? []).map((x) => (x.id === taskId ? { ...x, doneAt: nowIso(), reply: reply.trim() || undefined } : x)), ...taskLog(e, taskId, "cliente", "taskDone") }));
  },
  /** G3: the gestoría checked the client's answer (close) or sends the task back to the client (reopen). */
  closeTask(id: string, taskId: string) {
    patchExp(id, (e) => ({ tasks: (e.tasks ?? []).map((x) => (x.id === taskId ? { ...x, closedAt: nowIso() } : x)), ...taskLog(e, taskId, "gestor", "taskClosed") }), false);
  },
  reopenTask(id: string, taskId: string) {
    patchExp(id, (e) => ({ tasks: (e.tasks ?? []).map((x) => (x.id === taskId ? { ...x, doneAt: undefined, reply: undefined, closedAt: undefined } : x)), ...taskLog(e, taskId, "gestor", "taskReopened") }), false);
  },
  /**
   * C3: the client answered a request at its question: by uploading there, or
   * by saying they don't have the document yet. Every open request aimed at
   * that slot moves to "Respondida: revisar" with the reply.
   */
  answerSlot(id: string, field: string, item: string | null, reply: string) {
    const e = state.exps[id];
    if (!e) return;
    for (const x of slotTasks(e, field, item)) actions.completeTask(id, x.id, reply);
  },
  /** C3: "No lo tengo todavía" on an upload, with an optional note; null clears it. */
  setNotYet(id: string, field: string, item: string | null, section: string, note: string | null) {
    const key = slotKey(field, item);
    patchExp(id, (e) => {
      const next = { ...(e.notYet ?? {}) };
      if (note === null) delete next[key];
      else next[key] = { note: note.trim(), at: nowIso() };
      return { notYet: next, ...(note === null ? {} : logged(e, { by: "cliente", kind: "notYet", section, text: note.trim() ? { es: note.trim(), en: note.trim(), va: note.trim() } : undefined })) };
    });
  },
  /** G3: the gestoría checked an automatic alert ("Marcar revisado"); undo restores it. */
  reviewAlert(id: string, key: string, text: ClientTask["text"], on: boolean) {
    patchExp(id, (e) => {
      const next = { ...(e.reviewedAlerts ?? {}) };
      if (on) next[key] = { at: nowIso() };
      else delete next[key];
      return { reviewedAlerts: next, ...(on ? logged(e, { by: "gestor", kind: "alertReviewed", text }) : {}) };
    }, false);
  },
  removeTask(id: string, taskId: string) {
    patchExp(id, (e) => ({ tasks: (e.tasks ?? []).filter((x) => x.id !== taskId), ...taskLog(e, taskId, "gestor", "taskRemoved") }), false);
  },

  /** G3: the accountant responsible for a case (a gestoría-side change: keeps the case's place in the list). */
  assign(id: string, memberId: string | null) {
    patchExp(id, (e) => ((e.assignee ?? null) === memberId ? {} : { assignee: memberId, ...logged(e, { by: "gestor", kind: "assigned", member: memberId }) }), false);
  },

  /** The client accepts their invitation (first time only). Demo stand-in for the backend's accept endpoint. */
  acceptInvitation(id: string) {
    patchExp(id, (e) => (e.acceptedAt ? {} : { acceptedAt: nowIso(), ...logged(e, { by: "cliente", kind: "accepted" }) }));
  },

  /** C1: the client confirms they are the taxpayer. */
  confirmIdentity(id: string) {
    patchExp(id, (e) => ({ identityConfirmedAt: nowIso(), ...logged(e, { by: "cliente", kind: "identity" }) }));
  },

  /** C3: the client signs the current version of one of the firm's legal documents. */
  sign(id: string, kind: LegalKind, signerName: string, signerId: string) {
    const doc = state.firm.docs[kind];
    if (!doc) return;
    const sig: Signature = { version: doc.version, fileName: doc.file.name, signedAt: nowIso(), signerName, signerId };
    patchExp(id, (e) => ({ signatures: { ...e.signatures, [kind]: sig }, ...logged(e, { by: "cliente", kind: "signed", doc: kind }) }));
  },

  /** C7 · DEMO ONLY: marks the fee as paid in this browser. Nothing is charged or sent (SIMULATED_PAYMENT). */
  pay(id: string, amount: number) {
    if (!SIMULATED_PAYMENT) return;
    patchExp(id, (e) => ({ payment: { amount, status: "pagado", paidAt: nowIso(), method: "simulado" }, ...logged(e, { by: "cliente", kind: "paid", amount: String(amount) }) }));
  },

  /* Gestoría settings (G7) */
  updateFirm(patch: Partial<Firm>) {
    patchFirm(patch);
  },
  setFirmDoc(kind: LegalKind, file: FirmDoc["file"]) {
    patchFirm((f) => ({ docs: { ...f.docs, [kind]: { file, uploadedAt: nowIso(), version: (f.docs[kind]?.version ?? 0) + 1 } } }));
  },
  removeFirmDoc(kind: LegalKind) {
    patchFirm((f) => ({ docs: { ...f.docs, [kind]: null } }));
  },
  addMember(m: Omit<Member, "id">) {
    patchFirm((f) => ({ team: [...f.team, { ...m, id: uid("u-") }] }));
  },
  updateMember(id: string, patch: Partial<Member>) {
    patchFirm((f) => ({ team: f.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  removeMember(id: string) {
    patchFirm((f) => ({ team: f.team.filter((m) => m.id !== id) }));
  },

  /** Restores the three example cases and removes every other case. */
  resetDemo() {
    state = { ...state, exps: normalise(seed()) };
    emit();
    persist();
  },
};

/* ---------- Selectors ---------- */

/** Cases in list order: most recent client activity first. */
export const caseOrder = (exps: Record<string, Expediente>) => Object.values(exps).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const unreadFor =(e: Expediente, side: Side) => {
  // From the API the count is already for the caller's side.
  if (e.remote) return e.remote.unread;
  const other: Side = side === "cliente" ? "gestor" : "cliente";
  const seen = side === "cliente" ? e.clientSeen : e.gestorSeen;
  return e.chat.filter((m) => m.from === other && m.at > seen && !(side === "cliente" && m.sys)).length;
};

/** The client's name as typed in the questionnaire, or "" when missing. */
export const clientName = (e: Expediente) => (typeof e.answers.nombre === "string" && e.answers.nombre.trim()) || e.remote?.displayName || "";

/** Requests the client still has to do. */
export const openTasks = (e: Expediente) => (e.tasks ?? []).filter((x) => !x.doneAt && !x.closedAt);
/** Open requests aimed at one upload slot (a question, and the repeat item it sits in). */
export const slotTasks = (e: Expediente, field: string, item: string | null) =>
  openTasks(e).filter((x) => x.target?.field === field && (x.target.item ?? null) === item);
/** Requests the client marked done that the gestoría has not checked yet. */
export const tasksToCheck = (e: Expediente) => (e.tasks ?? []).filter((x) => x.doneAt && !x.closedAt);
