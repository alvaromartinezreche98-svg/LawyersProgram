/*
 * The PreRenta API, one function per route (docs/openapi.yaml v0.3.0). Each
 * call takes a fresh Clerk token (template "prerenta-api"); see token.ts.
 */
import { API_URL, ApiError, apiRequest } from "./client";
import { apiToken } from "./token";
import type { ApiCase, ApiCaseDetail, ApiClientItem, ApiCurrentUser, ApiDefinition, ApiDocument, ApiInvitation, ApiMessage, ApiNote, ApiSection, ApiStaffCase, ApiStatus, Page } from "./types";

/** A 401 means the token expired on the way: ask Clerk for a fresh one and try once more. */
const call = async <T>(path: string, init: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}) => {
  try {
    return await apiRequest<T>(path, { ...init, token: await apiToken() });
  } catch (err) {
    if (!(err instanceof ApiError) || err.kind !== "unauthenticated") throw err;
    return apiRequest<T>(path, { ...init, token: await apiToken(true) });
  }
};
const enc = encodeURIComponent;

export const api = {
  me: () => call<ApiCurrentUser>("/v1/me"),
  acceptInvitation: (code: string) => call<ApiCurrentUser>("/v1/invitations/accept", { method: "POST", body: { code } }),

  /* Cases */
  ownCases: () => call<{ items: ApiCase[] }>("/v1/cases"),
  createCase: (body: { tax_year?: number; client_id?: string } = {}) => call<ApiCaseDetail>("/v1/cases", { method: "POST", body }),
  caseDetail: (id: string) => call<ApiCaseDetail>(`/v1/cases/${enc(id)}`),
  staffCases: (q: { status?: ApiStatus; cursor?: string; limit?: number } = {}) => {
    const p = new URLSearchParams();
    if (q.status) p.set("status", q.status);
    if (q.cursor) p.set("cursor", q.cursor);
    p.set("limit", String(q.limit ?? 100));
    return call<Page<ApiStaffCase>>(`/v1/staff/cases?${p}`);
  },
  setStatus: (id: string, status: ApiStatus, expected_version: number) => call<ApiCaseDetail>(`/v1/staff/cases/${enc(id)}/status`, { method: "POST", body: { status, expected_version } }),
  submit: (id: string, expected_version: number) => call<ApiCaseDetail>(`/v1/cases/${enc(id)}/submit`, { method: "POST", body: { expected_version } }),

  /* Questionnaire */
  definition: (version: string) => call<ApiDefinition>(`/v1/questionnaire/definitions/${enc(version)}`),
  sections: (id: string) => call<{ items: ApiSection[] }>(`/v1/cases/${enc(id)}/sections`),
  saveSection: (id: string, key: string, body: { definition_version: string; answers: Record<string, unknown>; expected_case_version: number }) =>
    call<ApiSection & { case_version: number }>(`/v1/cases/${enc(id)}/sections/${enc(key)}`, { method: "PUT", body }),

  /* Documents */
  documents: (id: string) => call<{ items: ApiDocument[] }>(`/v1/cases/${enc(id)}/documents`),
  upload: async (id: string, field: string, itemId: string | null, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const q = new URLSearchParams({ field });
    if (itemId) q.set("item_id", itemId);
    return call<ApiDocument>(`/v1/cases/${enc(id)}/documents?${q}`, { method: "POST", body: form });
  },
  deleteDocument: (id: string, docId: string) => call<void>(`/v1/cases/${enc(id)}/documents/${enc(docId)}`, { method: "DELETE" }),
  /** The file as a Blob (the API streams it as an attachment and needs the bearer token). */
  downloadDocument: async (id: string, docId: string) => {
    const res = await fetch(`${API_URL}/v1/cases/${enc(id)}/documents/${enc(docId)}`, { headers: { Authorization: `Bearer ${await apiToken()}` }, cache: "no-store" });
    if (!res.ok) throw new ApiError(res.status === 404 ? "notFound" : res.status === 401 ? "unauthenticated" : res.status === 403 ? "forbidden" : "server", res.status);
    return res.blob();
  },

  /* Chat and internal note */
  messages: (id: string, after?: string | null) => call<{ items: ApiMessage[]; next_cursor: string | null }>(`/v1/cases/${enc(id)}/messages?limit=200${after ? `&after=${enc(after)}` : ""}`),
  postMessage: (id: string, body: string, kind: "message" | "information_request" = "message") => call<ApiMessage>(`/v1/cases/${enc(id)}/messages`, { method: "POST", body: { body, kind } }),
  markRead: (id: string) => call<void>(`/v1/cases/${enc(id)}/messages/read`, { method: "POST" }),
  note: (id: string) => call<ApiNote>(`/v1/cases/${enc(id)}/notes`),
  saveNote: (id: string, body: string, expected_version: number) => call<ApiNote>(`/v1/cases/${enc(id)}/notes`, { method: "PUT", body: { body, expected_version } }),

  /* Clients and invitations (staff) */
  clients: (cursor?: string) => call<Page<ApiClientItem>>(`/v1/clients?limit=100${cursor ? `&cursor=${enc(cursor)}` : ""}`),
  createClient: (display_name: string) => call<{ client: { id: string; display_name: string; created_at: string }; invitation: ApiInvitation }>("/v1/clients", { method: "POST", body: { display_name } }),
  reissueInvitation: (clientId: string) => call<ApiInvitation>(`/v1/clients/${enc(clientId)}/invitations`, { method: "POST" }),
  revokeInvitation: (clientId: string) => call<void>(`/v1/clients/${enc(clientId)}/invitation`, { method: "DELETE" }),
};
