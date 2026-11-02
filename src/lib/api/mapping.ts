/*
 * Converts between the app's case model and the API's (docs/openapi.yaml,
 * docs/frontend-integration.md). The questionnaire keys are the same on both
 * sides (both come from the CEO prototype); only value types differ:
 *   Sí/No            "si" | "no"        <->  true | false
 *   money            "1.320,50"         <->  "1320.50" (dot, ≤ 2 decimals, no thousands)
 *   number / %       "100"              <->  100
 *   repeat items     { _id, … }         <->  { id, … }
 *   uploads          in the answers     <->  separate documents (never in answers)
 */
import { SCHEMA } from "@/lib/questionnaire/schema";
import { ITEM_ID, type AnswerValue, type Answers, type Field, type FileRef } from "@/lib/questionnaire/types";
import type { ChatMessage, Expediente, Status } from "@/lib/data/types";
import type { ApiCase, ApiCaseDetail, ApiDefinitionField, ApiDocument, ApiMessage, ApiSection, ApiStaffCase, ApiStatus } from "./types";

export const TO_API_STATUS: Record<Status, ApiStatus> = { borrador: "draft", enviado: "submitted", revision: "in_review", listo: "ready_to_file" };
export const FROM_API_STATUS: Record<ApiStatus, Status> = { draft: "borrador", submitted: "enviado", in_review: "revision", ready_to_file: "listo" };

/** "1.320,50", "1320,5", "9.400" or "1320.50" → "1320.50"; anything else → undefined (left out, not sent). */
export function moneyToApi(raw: string): string | undefined {
  let s = raw.replace(/\s|€/g, "");
  if (!s) return undefined;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  return s;
}
const moneyFromApi = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).replace(".", ",") : undefined);
function intToApi(raw: string): number | undefined {
  const s = raw.replace(/\s|%/g, "").replace(/\./g, "").replace(",", ".");
  if (!s) return undefined;
  const n = Math.round(Number(s));
  return Number.isFinite(n) ? n : undefined;
}

/** One scope (a section, or a repeat item) of answers in the API's shape. */
function scopeToApi(fields: Field[], scope: Answers): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = scope[f.id];
    if (f.type === "upload") continue;
    if (f.type === "repeat") {
      if (Array.isArray(v)) out[f.id] = (v as Answers[]).map((it) => ({ ...(typeof it[ITEM_ID] === "string" ? { id: it[ITEM_ID] } : {}), ...scopeToApi(f.fields ?? [], it) }));
    } else if (typeof v === "string" && v !== "") {
      if (f.type === "yn") out[f.id] = v === "si";
      else if (f.type === "money") {
        const m = moneyToApi(v);
        if (m !== undefined) out[f.id] = m;
      } else if (f.type === "number" || f.type === "pct") {
        const n = intToApi(v);
        if (n !== undefined) out[f.id] = n;
      } else out[f.id] = v;
    }
    if (f.kids) Object.assign(out, scopeToApi(f.kids, scope));
  }
  return out;
}

function scopeFromApi(fields: Field[], src: Record<string, unknown>, into: Answers) {
  for (const f of fields) {
    const v = src[f.id];
    if (f.type === "repeat") {
      if (Array.isArray(v))
        into[f.id] = v.map((raw) => {
          const it = (raw ?? {}) as Record<string, unknown>;
          const item: Answers = typeof it.id === "string" ? { [ITEM_ID]: it.id } : {};
          scopeFromApi(f.fields ?? [], it, item);
          return item;
        });
    } else if (f.type !== "upload" && v !== undefined && v !== null) {
      const s: AnswerValue | undefined =
        f.type === "yn" ? (v === true ? "si" : v === false ? "no" : undefined)
        : f.type === "money" ? moneyFromApi(v)
        : String(v);
      if (s !== undefined) into[f.id] = s;
    }
    if (f.kids) scopeFromApi(f.kids, src, into);
  }
}

/** API section keys are the sections' ids ("personales", "inmuebles", …). */
export const sectionKey = (slug: string) => SCHEMA.find((s) => s.slug === slug)?.id ?? slug;

/** The answers of one section, ready for PUT /sections/{key}. */
export function sectionToApi(sectionId: string, answers: Answers) {
  const s = SCHEMA.find((x) => x.id === sectionId);
  return s ? scopeToApi(s.fields, answers) : {};
}

/** The fields one scope stores (kids are stored next to their parent). */
const scopeFields = (fields: Field[]): Field[] => fields.flatMap((f) => [f, ...scopeFields(f.kids ?? [])]);

/**
 * Puts one section's answers in API form back into the app's answers. Files
 * stay where they were: top-level uploads are not part of the section, and a
 * repeat item keeps its uploads when the item (same id) is still there.
 */
export function applySection(sectionId: string, src: Record<string, unknown>, cur: Answers): Answers {
  const s = SCHEMA.find((x) => x.id === sectionId);
  if (!s) return cur;
  const fresh: Answers = {};
  scopeFromApi(s.fields, src, fresh);
  const out: Answers = { ...cur };
  for (const f of scopeFields(s.fields)) {
    if (f.type === "upload") continue;
    if (!(f.id in fresh)) {
      delete out[f.id];
      continue;
    }
    if (f.type === "repeat") {
      const old = Array.isArray(cur[f.id]) ? (cur[f.id] as Answers[]) : [];
      const uploads = scopeFields(f.fields ?? []).filter((x) => x.type === "upload");
      out[f.id] = (fresh[f.id] as Answers[]).map((it) => {
        const prev = old.find((o) => o[ITEM_ID] === it[ITEM_ID]);
        return prev ? { ...it, ...Object.fromEntries(uploads.filter((u) => u.id in prev).map((u) => [u.id, prev[u.id]])) } : it;
      });
    } else out[f.id] = fresh[f.id];
  }
  return out;
}

/** Which sections a change touched, by comparing their API form. */
export function changedSections(before: Answers, after: Answers) {
  return SCHEMA.filter((s) => JSON.stringify(scopeToApi(s.fields, before)) !== JSON.stringify(scopeToApi(s.fields, after))).map((s) => s.id);
}

/** Saved sections and documents → the app's single answers object, files placed at their question. */
export function answersFromApi(sections: ApiSection[], docs: ApiDocument[], caseId: string): Answers {
  const out: Answers = {};
  for (const s of SCHEMA) {
    const saved = sections.find((x) => x.section_key === s.id);
    if (saved) scopeFromApi(s.fields, saved.answers, out);
  }
  for (const d of docs) {
    if (!d.field) continue;
    const ref: FileRef = { id: d.id, name: d.original_name, size: d.size_bytes, type: d.media_type, remote: caseId };
    const parts = d.field.split(".");
    if (parts.length === 2) {
      const cur = out[parts[1]];
      out[parts[1]] = [...(Array.isArray(cur) ? (cur as FileRef[]) : []), ref];
    } else if (parts.length === 3 && d.item_id) {
      const list = out[parts[1]];
      const item = Array.isArray(list) ? (list as Answers[]).find((it) => it[ITEM_ID] === d.item_id) : undefined;
      if (item) {
        const cur = item[parts[2]];
        item[parts[2]] = [...(Array.isArray(cur) ? (cur as FileRef[]) : []), ref];
      }
    }
  }
  return out;
}

/** The slot path the API expects for an upload field: section.field, or section.list.field inside a repeat. */
export function slotPath(sectionId: string, field: string, listKey: string | null) {
  return listKey ? `${sectionId}.${listKey}.${field}` : `${sectionId}.${field}`;
}

/** API message → chat line. System lines keep their own text (the API writes them in Spanish). */
export function messageFromApi(m: ApiMessage): ChatMessage {
  const sys = m.kind === "system" ? (/reenviado/i.test(m.body) ? "resent" : "sent") : undefined;
  return { id: m.id, from: m.sender === "staff" ? "gestor" : "cliente", text: m.body, at: m.created_at, ...(sys ? { sys } : {}), ...(m.kind === "information_request" ? { request: true } : {}) };
}

/** A case from the API as an Expediente; `base` keeps what was already loaded (answers, chat, note). */
export function caseFromApi(c: ApiCase | ApiCaseDetail | ApiStaffCase, base?: Expediente): Expediente {
  const detail = "alerts" in c ? (c as ApiCaseDetail) : null;
  const staff = "client_display_name" in c ? (c as ApiStaffCase) : null;
  return {
    id: c.id,
    ejercicio: c.tax_year,
    status: FROM_API_STATUS[c.status],
    sentAt: c.submitted_at,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    answers: base?.answers ?? {},
    chat: base?.chat ?? [],
    notes: base?.notes ?? "",
    clientSeen: "",
    gestorSeen: "",
    clientId: c.client_id,
    remote: {
      version: c.version,
      definitionVersion: c.definition_version,
      clientId: c.client_id,
      hasUnsent: c.has_unsent_changes,
      progress: c.progress,
      sections: detail?.sections ?? base?.remote?.sections,
      unread: c.unread_messages,
      issues: detail?.issues ?? staff?.issues ?? base?.remote?.issues ?? 0,
      alerts: detail?.alerts ?? base?.remote?.alerts ?? [],
      displayName: staff?.client_display_name ?? base?.remote?.displayName ?? "",
      noteVersion: base?.remote?.noteVersion ?? 0,
      loaded: base?.remote?.loaded ?? false,
      cursor: base?.remote?.cursor ?? null,
    },
  };
}

/**
 * Keeps only the answers the case's pinned definition knows (the API rejects
 * unknown keys with 422), so a question this app has and that definition
 * lacks never blocks saving the rest of the section.
 */
export function pruneToDefinition(answers: Record<string, unknown>, fields: ApiDefinitionField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.key in answers) || f.type === "upload") continue;
    const v = answers[f.key];
    out[f.key] = f.type === "list" && Array.isArray(v)
      ? v.map((it) => {
          const item = (it ?? {}) as Record<string, unknown>;
          return { ...(typeof item.id === "string" ? { id: item.id } : {}), ...pruneToDefinition(item, f.item_fields ?? []) };
        })
      : v;
  }
  return out;
}
