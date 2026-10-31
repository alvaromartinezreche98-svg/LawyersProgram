import { SCHEMA } from "./schema";
import { textIn, type Text } from "@/lib/i18n";
import { ITEM_ID, type AnswerValue, type Answers, type Field, type FileRef, type Path } from "./types";
import { uid } from "@/lib/format";

export const whenOf = (x: Field) => x.when ?? (x.type === "yn" ? ["si"] : []);

/** Whether a field's follow-up questions apply for the given answer. */
export const showsKids = (x: Field, v: AnswerValue | undefined) =>
  !!x.kids && typeof v === "string" && whenOf(x).includes(v);

export const asFiles = (v: AnswerValue | undefined): FileRef[] => (Array.isArray(v) ? (v as FileRef[]) : []);
export const asItems = (v: AnswerValue | undefined): Answers[] => (Array.isArray(v) ? (v as Answers[]) : []);
export const asText = (v: AnswerValue | undefined): string => (typeof v === "string" ? v : "");

export function isFilled(x: Field, v: AnswerValue | undefined) {
  if (x.type === "upload" || x.type === "repeat") return Array.isArray(v) && v.length > 0;
  return typeof v === "string" && v.trim() !== "";
}

export interface Progress {
  total: number;
  done: number;
}

export function progressOf(fields: Field[], scope: Answers): Progress {
  let total = 0;
  let done = 0;
  for (const x of fields) {
    if (x.type === "repeat") {
      const items = asItems(scope[x.id]);
      if (!items.length) {
        total++;
        continue;
      }
      for (const it of items) {
        const p = progressOf(x.fields ?? [], it);
        total += p.total;
        done += p.done;
      }
      continue;
    }
    if (!x.opt) {
      total++;
      if (isFilled(x, scope[x.id])) done++;
    }
    if (showsKids(x, scope[x.id])) {
      const p = progressOf(x.kids ?? [], scope);
      total += p.total;
      done += p.done;
    }
  }
  return { total, done };
}

/**
 * Anchor of the first required question still unanswered ("q-<field>" or
 * "q-<field>-<item>" inside a repeated group), counted the same way as progressOf.
 */
export function firstOpenAnchor(fields: Field[], scope: Answers, item?: string): string | null {
  const id = (f: string) => `q-${f}${item ? `-${item}` : ""}`;
  for (const x of fields) {
    if (x.type === "repeat") {
      const items = asItems(scope[x.id]);
      if (!items.length) return id(x.id);
      for (const it of items) {
        const hit = firstOpenAnchor(x.fields ?? [], it, typeof it[ITEM_ID] === "string" ? (it[ITEM_ID] as string) : undefined);
        if (hit) return hit;
      }
      continue;
    }
    if (!x.opt && !isFilled(x, scope[x.id])) return id(x.id);
    if (showsKids(x, scope[x.id])) {
      const hit = firstOpenAnchor(x.kids ?? [], scope, item);
      if (hit) return hit;
    }
  }
  return null;
}

export type SectionState = "done" | "partial" | "empty";
export const sectionState = (p: Progress): SectionState =>
  p.total === 0 || p.done === p.total ? "done" : p.done > 0 ? "partial" : "empty";

export function overall(a: Answers) {
  let total = 0;
  let done = 0;
  for (const s of SCHEMA) {
    const p = progressOf(s.fields, a);
    total += p.total;
    done += p.done;
  }
  return { total, done, pending: total - done, pct: total ? Math.round((done / total) * 100) : 100 };
}

/** First section that is not complete, or null when all are. */
export function firstOpenSection(a: Answers) {
  return SCHEMA.find((s) => sectionState(progressOf(s.fields, a)) !== "done") ?? null;
}

export interface DocSlot {
  label: Text;
  /** Item the slot belongs to (e.g. a property's address). */
  context: Text | null;
  section: string;
  /** The upload question and, inside a repeated group, the item's stable id. */
  field: string;
  item: string | null;
  files: FileRef[];
}

/** Every document the current answers ask for, uploaded or not. */
export function collectDocs(a: Answers): DocSlot[] {
  const out: DocSlot[] = [];
  const walk = (fields: Field[], scope: Answers, context: Text | null, section: string, item: string | null) => {
    for (const x of fields) {
      if (x.type === "repeat") {
        asItems(scope[x.id]).forEach((it, i) => {
          const name = asText(it.dir) || asText(it.valor);
          const item = x.item ?? { es: "Elemento", en: "Item" };
          const itemId = typeof it[ITEM_ID] === "string" ? (it[ITEM_ID] as string) : null;
          walk(x.fields ?? [], it, name ? { es: name, en: name, va: name } : { es: `${item.es} ${i + 1}`, en: `${item.en} ${i + 1}`, va: `${textIn(item, "va")} ${i + 1}` }, section, itemId);
        });
        continue;
      }
      if (x.type === "upload") {
        const files = asFiles(scope[x.id]);
        if (files.length || !x.opt) out.push({ label: x.label, context, section, field: x.id, item, files });
      }
      if (showsKids(x, scope[x.id])) walk(x.kids ?? [], scope, context, section, item);
    }
  };
  for (const s of SCHEMA) walk(s.fields, a, null, s.slug, null);
  return out;
}

/** Immutable set at a nested path of objects and arrays. */
/** Reads the value at `path` (the counterpart of setIn). */
export function getIn(obj: Answers, path: Path): AnswerValue | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur as AnswerValue | undefined;
}

export function setIn(obj: Answers, path: Path, value: AnswerValue | undefined): Answers {
  const [head, ...rest] = path;
  const copy: Answers | Answers[] = Array.isArray(obj) ? [...(obj as Answers[])] : { ...obj };
  const cur = (copy as Record<string | number, unknown>)[head];
  (copy as Record<string | number, unknown>)[head] = rest.length
    ? setIn((cur ?? (typeof rest[0] === "number" ? [] : {})) as Answers, rest, value)
    : value;
  return copy as Answers;
}

const isFileRef = (x: unknown) => !!x && typeof x === "object" && "size" in x && "name" in x;

/** Gives every repeatable-group item a stable id (older saved data and the examples have none). Returns the same object when nothing changes. */
export function withItemIds(a: Answers): Answers {
  let changed = false;
  const fix = (scope: Answers): Answers => {
    let out = scope;
    for (const [k, v] of Object.entries(scope)) {
      if (!Array.isArray(v) || !v.length || isFileRef(v[0])) continue;
      const items = (v as Answers[]).map((it) => {
        const fixed = fix(it);
        if (typeof fixed[ITEM_ID] === "string" && fixed === it) return it;
        changed = true;
        return typeof fixed[ITEM_ID] === "string" ? fixed : { ...fixed, [ITEM_ID]: uid("i-") };
      });
      if (items.some((it, i) => it !== v[i])) out = { ...out, [k]: items };
    }
    return out;
  };
  const r = fix(a);
  return changed ? r : a;
}
