"use client";

/*
 * API mode: keeps the store in step with the firm's API. The screens keep
 * using the store and its actions; in API mode those actions also call the
 * functions here (see `remoteHooks` in lib/data/store.ts).
 *
 * - Reads: the client's case or the firm's inbox, then per open case its
 *   detail, sections, documents, messages and (staff) the internal note.
 * - Writes: sections are saved one at a time with expected_case_version;
 *   a 409 re-reads the section, merges it with this tab's changes (see
 *   reconcile) and retries once.
 * - Chat is polled every few seconds with the API's cursor.
 */
import { remoteStore, setRemoteHooks, type RemoteHooks } from "@/lib/data/store";
import type { Expediente, Status } from "@/lib/data/types";
import type { Answers, FileRef } from "@/lib/questionnaire/types";
import { isApiError } from "./client";
import { api } from "./endpoints";
import { TO_API_STATUS, answersFromApi, applySection, caseFromApi, changedSections, messageFromApi, pruneToDefinition, sectionToApi } from "./mapping";
import type { ApiDefinition, ApiStaffCase } from "./types";

const get = (id: string) => remoteStore.get().exps[id];

/* ---------- Reads ---------- */

/** The questionnaire definitions by version (a case is pinned to one for life); fetched once each. */
const definitions = new Map<string, Promise<ApiDefinition | null>>();
function definition(version: string) {
  if (!definitions.has(version)) {
    const p = api.definition(version).catch(() => {
      definitions.delete(version); // try again on the next save
      return null;
    });
    definitions.set(version, p);
  }
  return definitions.get(version)!;
}

/** The signed-in client's current case (newest tax year), loaded in full; null when they have none. */
export async function loadClientCase(): Promise<string | null> {
  const { items } = await api.ownCases();
  const c = items[0] ?? (await api.createCase().catch(() => null));
  if (!c) return null;
  await loadCase(c.id, false);
  return c.id;
}

/** The firm's inbox (all pages). Summaries only; a case is loaded in full when opened. */
export async function loadInbox() {
  const all: ApiStaffCase[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.staffCases({ cursor, limit: 100 });
    all.push(...page.items);
    cursor = page.next_cursor ?? undefined;
  } while (cursor && all.length < 2000);
  remoteStore.putCases(all.map((c) => caseFromApi(c, get(c.id))));
}

/** One case in full: detail, answers, documents, chat and, for the firm, the internal note. */
export async function loadCase(id: string, staff: boolean) {
  const [detail, sections, docs, msgs, note] = await Promise.all([
    api.caseDetail(id),
    api.sections(id),
    api.documents(id),
    api.messages(id),
    staff ? api.note(id) : Promise.resolve(null),
  ]);
  void definition(detail.definition_version);
  const base = get(id);
  const e = caseFromApi(detail, base);
  e.answers = answersFromApi(sections.items, docs.items, id);
  bases.set(id, new Map(sections.items.map((s) => [s.section_key, s.answers])));
  e.chat = msgs.items.map(messageFromApi);
  e.notes = note?.body ?? "";
  e.remote = { ...e.remote!, loaded: true, cursor: msgs.next_cursor, noteVersion: note?.version ?? 0 };
  remoteStore.putCases([e]);
}

/** Refreshes the case header (status, version, unread, progress, alerts) and appends new messages. */
async function refresh(id: string) {
  const e = get(id);
  if (!e?.remote) return;
  const [detail, msgs] = await Promise.all([api.caseDetail(id), api.messages(id, e.remote.cursor)]);
  remoteStore.patchCase(id, (cur) => {
    // Header polls do not reload answers: keep their lock version until save/reconcile.
    const next = detail.version < (cur.remote?.version ?? 0) ? cur : caseFromApi(detail, cur);
    const known = new Set(cur.chat.map((m) => m.id));
    return {
      ...next,
      // Answers being edited here win over the server copy until they are saved.
      answers: cur.answers,
      chat: [...cur.chat.filter((m) => !m.id.startsWith("tmp-")), ...msgs.items.filter((m) => !known.has(m.id)).map(messageFromApi)],
      remote: { ...next.remote!, version: cur.remote!.version, cursor: msgs.next_cursor ?? cur.remote?.cursor ?? null, loaded: true },
    };
  });
}

const pollers = new Map<string, { n: number; timer: ReturnType<typeof setInterval> }>();
/** Polls one open case every 5 s while a screen shows it; returns the stop function. */
export function watchCase(id: string, staff: boolean) {
  const cur = pollers.get(id);
  if (cur) cur.n++;
  else {
    if (!get(id)?.remote?.loaded) loadCase(id, staff).catch(() => {});
    pollers.set(id, { n: 1, timer: setInterval(() => refresh(id).catch(() => {}), 5000) });
  }
  return () => {
    const p = pollers.get(id);
    if (!p) return;
    if (--p.n <= 0) {
      clearInterval(p.timer);
      pollers.delete(id);
    }
  };
}

/* ---------- Writes ---------- */

const dirty = new Map<string, Set<string>>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<void> | null = null;

function queue(id: string, sections: string[]) {
  if (!sections.length) return;
  const set = dirty.get(id) ?? new Set<string>();
  sections.forEach((s) => set.add(s));
  dirty.set(id, set);
  remoteStore.setSave("saving");
  clearTimeout(saveTimer);
  // Debounced like the prototype (700 ms); one save at a time.
  saveTimer = setTimeout(() => void flush().catch(() => {}), 700);
}

/** Saves every queued section, one request at a time. */
export function flush(): Promise<void> {
  clearTimeout(saveTimer);
  if (saving) return saving;
  saving = (async () => {
    try {
      for (const [id, set] of dirty) {
        while (set.size) {
          const key = set.values().next().value!;
          // Remove before awaiting: edits made during this request queue another save.
          set.delete(key);
          try {
            await saveOne(id, key);
          } catch (err) {
            set.add(key);
            throw err;
          }
        }
        dirty.delete(id);
        await refresh(id);
      }
      remoteStore.setSave(clashed ? "merged" : "saved", new Date().toISOString());
      clashed = false;
    } catch (err) {
      remoteStore.setSave("failed");
      throw err;
    }
  })().finally(() => { saving = null; });
  return saving;
}

async function saveOne(id: string, key: string, retried = false): Promise<void> {
  const e = get(id);
  if (!e?.remote) return;
  const defn = await definition(e.remote.definitionVersion);
  const def = defn?.sections.find((s) => s.key === key);
  // A section the pinned definition does not have cannot be saved (the API answers 404): skip it.
  if (defn && !def) return;
  const answers = def ? pruneToDefinition(sectionToApi(key, e.answers), def.fields) : sectionToApi(key, e.answers);
  try {
    const res = await api.saveSection(id, key, { definition_version: e.remote.definitionVersion, answers, expected_case_version: e.remote.version });
    baseOf(id).set(key, res.answers ?? answers);
    remoteStore.patchCase(id, (cur) => ({ remote: { ...cur.remote!, version: res.case_version, hasUnsent: cur.sentAt ? true : cur.remote!.hasUnsent } }));
  } catch (err) {
    // 409 stale_version: another session wrote first. Reconcile with the latest copy, then retry once.
    if (!retried && isApiError(err) && err.kind === "conflict") {
      await reconcile(id, key);
      return saveOne(id, key, true);
    }
    throw err;
  }
}

/* What the server last had for each section (API form), the common base for reconciling. */
const bases = new Map<string, Map<string, Record<string, unknown>>>();
const baseOf = (id: string) => bases.get(id) ?? bases.set(id, new Map()).get(id)!;
/** Set when reconciling had to keep another session's answer over this one's; shown after the save. */
let clashed = false;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Three-way merge of one section, answer by answer: what only this tab
 * changed is kept, what only the other session changed is taken, and when
 * both changed the same answer the saved one wins and the user is told
 * (never silently overwrite the other session).
 */
async function reconcile(id: string, key: string) {
  const [detail, sections] = await Promise.all([api.caseDetail(id), api.sections(id)]);
  const server = sections.items.find((s) => s.section_key === key)?.answers ?? {};
  const base = baseOf(id).get(key) ?? {};
  const local = sectionToApi(key, get(id)!.answers);
  const merged: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(server), ...Object.keys(local)])) {
    const v = same(local[k], base[k]) ? server[k] : same(server[k], base[k]) || same(server[k], local[k]) ? local[k] : (clashed = true, server[k]);
    if (v !== undefined) merged[k] = v;
  }
  baseOf(id).set(key, server);
  remoteStore.patchCase(id, (cur) => ({ answers: applySection(key, merged, cur.answers), remote: { ...cur.remote!, version: detail.version } }));
}

/** Uploads one file to its slot; list items are saved first so the API knows their id. */
export async function upload(caseId: string, field: string, itemId: string | null, file: File): Promise<FileRef> {
  await flush();
  const d = await api.upload(caseId, field, itemId, file);
  remoteStore.patchCase(caseId, (cur) => ({ remote: { ...cur.remote!, hasUnsent: !!cur.sentAt } }));
  // The document already exists: a failed header refresh must not offer a duplicate upload.
  await refresh(caseId).catch(() => remoteStore.setSave("failed"));
  return { id: d.id, name: d.original_name, size: d.size_bytes, type: d.media_type, remote: caseId };
}

export async function removeDocument(caseId: string, docId: string) {
  await api.deleteDocument(caseId, docId);
  remoteStore.patchCase(caseId, (cur) => ({ remote: { ...cur.remote!, hasUnsent: !!cur.sentAt } }));
  await refresh(caseId).catch(() => remoteStore.setSave("failed"));
}

// Keep the expected version after a lost response, so retry uses backend idempotency.
const submitVersions = new Map<string, number>();

const hooks: RemoteHooks = {
  answers(id: string, before: Answers, after: Answers) {
    const sections = changedSections(before, after);
    if (sections.length) remoteStore.patchCase(id, (cur) => ({ remote: { ...cur.remote!, hasUnsent: !!cur.sentAt } }));
    queue(id, sections);
  },
  async submit(id: string) {
    await flush();
    const e = get(id);
    if (!e?.remote) throw new Error("Case not loaded");
    const version = submitVersions.get(id) ?? e.remote.version;
    submitVersions.set(id, version);
    try {
      const d = await api.submit(id, version);
      submitVersions.delete(id);
      remoteStore.patchCase(id, (cur) => caseFromApi(d, cur));
      await refresh(id).catch(() => remoteStore.setSave("failed"));
    } catch (err) {
      if (isApiError(err) && err.kind === "conflict") {
        submitVersions.delete(id);
        await loadCase(id, false);
      }
      throw err;
    }
  },
  async status(id: string, status: Status) {
    for (let retried = false; ; retried = true) {
      const e = get(id);
      if (!e?.remote) return;
      try {
        const d = await api.setStatus(id, TO_API_STATUS[status], e.remote.version);
        remoteStore.patchCase(id, (cur) => caseFromApi(d, cur));
        return;
      } catch (err) {
        // A 409 means our stored version is stale: the client saved or sent while this case was open (`refresh()` keeps the
        // stored version). Reload to take the server's version, then apply the gestoría's choice once more. Other errors
        // change nothing locally, so there is nothing to recover.
        if (retried || !(isApiError(err) && err.kind === "conflict")) throw err;
        await loadCase(id, true);
      }
    }
  },
  async message(id: string, text: string, request: boolean) {
    const m = await api.postMessage(id, text, request ? "information_request" : "message");
    remoteStore.patchCase(id, (cur) => (cur.chat.some((x) => x.id === m.id) ? {} : { chat: [...cur.chat.filter((x) => !x.id.startsWith("tmp-")), messageFromApi(m)] }));
  },
  async read(id: string) {
    const e = get(id);
    if (!e?.remote?.unread) return;
    await api.markRead(id);
    remoteStore.patchCase(id, (cur) => ({ remote: { ...cur.remote!, unread: 0 } }));
  },
  note: (() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    return (id: string) => {
      clearTimeout(timers.get(id));
      timers.set(id, setTimeout(async () => {
        const e = get(id);
        if (!e?.remote) return;
        try {
          const n = await api.saveNote(id, e.notes, e.remote.noteVersion);
          remoteStore.patchCase(id, (cur) => ({ remote: { ...cur.remote!, noteVersion: n.version } }));
        } catch (err) {
          // Another staff member saved first: keep their text and version.
          if (isApiError(err) && err.kind === "conflict") {
            const n = await api.note(id);
            remoteStore.patchCase(id, (cur) => ({ notes: n.body, remote: { ...cur.remote!, noteVersion: n.version } }));
          }
        }
      }, 800));
    };
  })(),
  retry: () => void flush().catch(() => {}),
};

setRemoteHooks(hooks);

export type { Expediente };
