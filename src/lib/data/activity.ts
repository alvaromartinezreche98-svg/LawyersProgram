import { SCHEMA } from "@/lib/questionnaire/schema";
import { collectDocs } from "@/lib/questionnaire/progress";
import type { Answers } from "@/lib/questionnaire/types";
import type { Text } from "@/lib/i18n";
import { nowIso, uid } from "@/lib/format";
import type { Expediente, LegalKind, Side, Status } from "./types";

/** G3 · Historial: one thing that happened in a case. Recorded from the moment this shipped; older cases start empty. */
export interface Activity {
  id: string;
  at: string;
  by: Side;
  kind: ActivityKind;
  /** Questionnaire section slug, for answers and files. */
  section?: string;
  files?: string[];
  from?: Status;
  to?: Status;
  member?: string | null;
  doc?: LegalKind;
  amount?: string;
  text?: Text;
  year?: number;
}

export type ActivityKind =
  | "created" | "accepted" | "answers" | "uploaded" | "removed" | "sent" | "resent" | "status" | "assigned"
  | "identity" | "signed" | "paid" | "resultSent" | "resultApproved"
  | "apRequested" | "apConfirmed" | "apCancelled" | "prefillConfirmed" | "nextYear"
  | "taskAsked" | "taskDone" | "taskClosed" | "taskReopened" | "taskRemoved"
  | "notYet" | "alertReviewed";

const KEEP = 300;
/** Edits to the same section by the same side within this window count as one entry. */
const MERGE_MS = 15 * 60_000;

const SECTION_OF: Record<string, string> = Object.fromEntries(SCHEMA.flatMap((s) => s.fields.map((f) => [f.id, s.slug])));

/** Adds an entry to the case's history (returns the patch to apply). */
export function logged(e: Expediente, ev: Omit<Activity, "id" | "at">): Pick<Expediente, "activity"> {
  const list = e.activity ?? [];
  const at = nowIso();
  const last = list[list.length - 1];
  if (ev.kind === "answers" && last?.kind === "answers" && last.by === ev.by && last.section === ev.section && Date.parse(at) - Date.parse(last.at) < MERGE_MS)
    return { activity: [...list.slice(0, -1), { ...last, at }] };
  return { activity: [...list, { ...ev, id: uid("a-"), at }].slice(-KEEP) };
}

/** What changed between two versions of the answers: sections whose answers were edited, and files added or removed. */
export function answerChanges(before: Answers, after: Answers) {
  const sections = new Set<string>();
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)]))
    if (JSON.stringify(withoutFiles(before[k]) ?? null) !== JSON.stringify(withoutFiles(after[k]) ?? null)) sections.add(SECTION_OF[k] ?? SCHEMA[0].slug);

  const files = (a: Answers) => new Map(collectDocs(a).flatMap((d) => d.files.map((f) => [f.id, { name: f.name, section: d.section }] as const)));
  const was = files(before);
  const now = files(after);
  const added = [...now].filter(([id]) => !was.has(id)).map(([, f]) => f);
  const removed = [...was].filter(([id]) => !now.has(id)).map(([, f]) => f);
  return { sections: [...sections], added, removed };
}

const isFile = (x: unknown) => !!x && typeof x === "object" && "size" in x && "name" in x;
/** The answer with uploaded files left out (empty lists count as unanswered), so an upload is not also logged as an edit. */
function withoutFiles(v: unknown): unknown {
  if (Array.isArray(v)) {
    const out = v.filter((x) => !isFile(x)).map(withoutFiles);
    return out.length ? out : undefined;
  }
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withoutFiles(x)]).filter(([, x]) => x !== undefined && x !== ""));
  return v === "" ? undefined : v;
}

/** Groups files by section, one entry per section. */
export const bySection = (fs: { name: string; section: string }[]) => {
  const m = new Map<string, string[]>();
  for (const f of fs) m.set(f.section, [...(m.get(f.section) ?? []), f.name]);
  return [...m];
};

const isEdit = (a: Activity) => a.by === "cliente" && (a.kind === "answers" || a.kind === "uploaded" || a.kind === "removed");
const isSend = (a: Activity) => a.kind === "sent" || a.kind === "resent";

/**
 * What the client changed around their submissions, so the gestoría reviews
 * only that: edits after the last send (not resent yet) and, when the last
 * send was a resubmission, the edits it carried. Earlier send events stay in
 * the history; nothing here removes them.
 */
export function changesBetweenSends(e: Pick<Expediente, "activity">) {
  const list = e.activity ?? [];
  let last = -1;
  for (let i = list.length - 1; i >= 0; i--) if (isSend(list[i])) { last = i; break; }
  if (last < 0) return null;
  let prev = -1;
  for (let i = last - 1; i >= 0; i--) if (isSend(list[i])) { prev = i; break; }
  const lastSend = list[last];
  return {
    lastSend,
    pending: list.slice(last + 1).filter(isEdit),
    inLast: lastSend.kind === "resent" && prev >= 0 ? list.slice(prev + 1, last).filter(isEdit) : [],
  };
}
