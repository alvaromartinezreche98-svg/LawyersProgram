/*
 * Regression check for the client's API-mode save/send/upload flow.
 * Run from the repo root: node tests/client-flow.mjs
 *
 * Loads the real src/lib/api/{remote,mapping} and src/lib/data/store (TypeScript
 * is transpiled on the fly with the repo's own `typescript`, `@/` is resolved
 * to src/), and replaces only the HTTP endpoints (`api`) with a small in-process
 * backend that guards versions like the real one. No React, no network.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = createRequire(import.meta.url);

/* ---------- Environment: API mode on, nothing may touch browser storage ---------- */

process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_regression";
process.env.NEXT_PUBLIC_API_URL = "http://api.test";
delete process.env.NEXT_PUBLIC_DEMO_LOGIN;

const storageWrites = [];
const spyStorage = (name) => ({
  setItem: (k) => { storageWrites.push(`${name}.setItem(${k})`); throw new Error("storage must not be written in API mode"); },
  getItem: () => null,
  removeItem: () => {},
});
globalThis.localStorage = spyStorage("localStorage");
globalThis.sessionStorage = spyStorage("sessionStorage");

/* ---------- TypeScript loader + "@/" alias ---------- */

const SRC = path.join(__dirname, "..", "src");
const compile = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
Module._extensions[".ts"] = compile;
Module._extensions[".tsx"] = compile;
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    const base = path.join(SRC, request.slice(2));
    const hit = [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")].find((p) => fs.existsSync(p));
    if (hit) request = hit;
  }
  return resolveFilename.call(this, request, ...rest);
};

const remote = load(path.join(SRC, "lib/api/remote.ts"));
const { actions, remoteStore } = load(path.join(SRC, "lib/data/store.ts"));
const { api } = load(path.join(SRC, "lib/api/endpoints.ts"));
const { ApiError } = load(path.join(SRC, "lib/api/client.ts"));
const { moneyToApi } = load(path.join(SRC, "lib/api/mapping.ts"));
const { API_MODE } = load(path.join(SRC, "lib/auth/config.ts"));

/* ---------- Fake backend (one case at a time) ---------- */

const DEFINITION = {
  version: "v1",
  tax_year: 2026,
  sections: [
    { key: "personales", label: "Datos personales", fields: [{ key: "nombre", label: "Nombre", type: "string" }, { key: "telefono", label: "Teléfono", type: "string" }] },
    { key: "inmuebles", label: "Inmuebles", fields: [
      { key: "tiene_inm", label: "Tiene", type: "boolean" },
      { key: "inm", label: "Inmuebles", type: "list", item_fields: [{ key: "dir", label: "Dirección", type: "string" }, { key: "renta", label: "Renta", type: "money" }, { key: "pct", label: "%", type: "integer" }] },
    ] },
    { key: "observaciones", label: "Observaciones", fields: [{ key: "obs", label: "Obs", type: "text" }] },
  ],
};

let be;
function backend(id, status = "draft") {
  be = {
    id, status, version: 1, hasUnsent: false, submittedAt: null,
    sections: new Map(), docs: [], messages: [], submitted: new Set(),
    calls: { save: [], submit: [], upload: [] },
    holdNextSave: null, holdNextSubmit: null, failSaves: 0, loseNextSubmitResponse: false,
  };
  return be;
}
const bump = () => { be.version++; if (be.status !== "draft") be.hasUnsent = true; };
const progress = () => {
  const answered = [...be.sections.values()].reduce((n, a) => n + Object.keys(a).length, 0) + be.docs.length;
  return { answered, total: 10, percent: answered * 10 };
};
const detail = () => ({
  id: be.id, client_id: "cl-1", tax_year: 2026, definition_version: "v1", status: be.status, version: be.version,
  submitted_at: be.submittedAt, has_unsent_changes: be.hasUnsent, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  progress: progress(), unread_messages: 0, sections: [], missing_answers: [], missing_documents: [], alerts: [], issues: 0,
});
const wrongCase = (id) => { if (id !== be.id) throw new ApiError("notFound", 404); };

Object.assign(api, {
  definition: async () => structuredClone(DEFINITION),
  caseDetail: async (id) => (wrongCase(id), detail()),
  sections: async (id) => (wrongCase(id), { items: [...be.sections].map(([k, a]) => ({ section_key: k, definition_version: "v1", answers: structuredClone(a), updated_at: null })) }),
  documents: async (id) => (wrongCase(id), { items: structuredClone(be.docs) }),
  messages: async (id) => (wrongCase(id), { items: structuredClone(be.messages), next_cursor: null }),
  saveSection: async (id, key, body) => {
    wrongCase(id);
    be.calls.save.push({ key, answers: structuredClone(body.answers), expected: body.expected_case_version });
    const hold = be.holdNextSave;
    be.holdNextSave = null;
    if (hold) await hold.promise;
    if (be.failSaves > 0) { be.failSaves--; throw new ApiError("server", 500); }
    if (body.expected_case_version !== be.version) throw new ApiError("conflict", 409);
    be.sections.set(key, structuredClone(body.answers));
    bump();
    return { section_key: key, definition_version: "v1", answers: structuredClone(body.answers), updated_at: null, case_version: be.version };
  },
  submit: async (id, expected) => {
    wrongCase(id);
    be.calls.submit.push(expected);
    const hold = be.holdNextSubmit;
    be.holdNextSubmit = null;
    if (hold) await hold.promise;
    // Idempotent replay: the same expected version was already applied.
    if (be.submitted.has(expected)) return detail();
    if (expected !== be.version) throw new ApiError("conflict", 409);
    const resend = be.status !== "draft";
    be.submitted.add(expected);
    be.status = "submitted";
    be.submittedAt = "2026-01-02T00:00:00Z";
    be.hasUnsent = false;
    be.version++;
    be.messages.push({ id: `m${be.messages.length + 1}`, case_id: id, sender: "client", kind: "system", body: resend ? "Cuestionario actualizado y reenviado a la gestoría." : "Cuestionario enviado a la gestoría.", author_id: "u1", created_at: "2026-01-02T00:00:00Z" });
    if (be.loseNextSubmitResponse) { be.loseNextSubmitResponse = false; throw new ApiError("network", 0); }
    return detail();
  },
  upload: async (id, field, itemId, file) => {
    wrongCase(id);
    be.calls.upload.push({ field, itemId });
    // The API only knows an item once its section was saved.
    if (itemId && !(be.sections.get("inmuebles")?.inm ?? []).some((it) => it.id === itemId)) throw new ApiError("invalid", 422);
    const doc = { id: `d${be.docs.length + 1}`, case_id: id, field, item_id: itemId, original_name: file.name, media_type: file.type, size_bytes: file.size, uploaded_by: "u1", created_at: "2026-01-02T00:00:00Z" };
    be.docs.push(doc);
    if (be.submittedAt) be.hasUnsent = true;
    return structuredClone(doc);
  },
  deleteDocument: async (id, docId) => {
    wrongCase(id);
    be.docs = be.docs.filter((d) => d.id !== docId);
    if (be.submittedAt) be.hasUnsent = true;
  },
});

/* ---------- Helpers ---------- */

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};
const tick = () => new Promise((r) => setImmediate(r));
const settle = async () => { for (let i = 0; i < 20; i++) await tick(); };
async function until(cond, what) {
  for (let i = 0; i < 200; i++) {
    if (cond()) return;
    await tick();
  }
  throw new Error(`timed out waiting for: ${what}`);
}
const exp = (id) => remoteStore.get().exps[id];
const saveStatus = () => remoteStore.get().save.status;
const sysChat = (id) => exp(id).chat.filter((m) => m.sys).map((m) => m.sys);
async function open(id, status) {
  backend(id, status);
  if (status !== "draft" && status) be.submittedAt = "2026-01-02T00:00:00Z";
  await remote.loadCase(id, false);
  assert.equal(exp(id).remote.loaded, true);
}
const rentaItem = { _id: "it1", dir: "Calle Mayor 1", renta: "1.320,50", pct: "100" };

/* ---------- Tests ---------- */

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("API mode is on", () => assert.equal(API_MODE, true));

test("Spanish money normalisation", () => {
  assert.equal(moneyToApi("1.320,50"), "1320.50");
  assert.equal(moneyToApi("1320,5"), "1320.5");
  assert.equal(moneyToApi("9.400"), "9400");
  assert.equal(moneyToApi("1320.50"), "1320.50");
  assert.equal(moneyToApi("1.320,505"), undefined);
  assert.equal(moneyToApi("abc"), undefined);
});

test("edits made while a save is in flight are saved before flush resolves", async () => {
  const id = "c1";
  await open(id);
  const first = deferred();
  be.holdNextSave = first;

  actions.setAnswer(id, ["nombre"], "A1");
  const f1 = remote.flush();
  await until(() => be.calls.save.length === 1, "first save request");

  // Same section edited again, plus a second section, while request 1 is pending.
  actions.setAnswer(id, ["nombre"], "A2");
  actions.setAnswer(id, ["obs"], "nota");
  const f2 = remote.flush();
  let done1 = false, done2 = false;
  f1.then(() => { done1 = true; });
  f2.then(() => { done2 = true; });
  await settle();
  assert.equal(done1 || done2, false, "flush must wait for the in-flight save");

  first.resolve();
  await f1;
  assert.equal(be.sections.get("personales").nombre, "A2", "latest edit of the same section persisted when flush resolved");
  assert.equal(be.sections.get("observaciones")?.obs, "nota", "second section persisted when flush resolved");
  await f2;
  assert.equal(be.calls.save[0].answers.nombre, "A1");
  assert.equal(be.calls.save.length, 3);
  assert.equal(exp(id).remote.version, be.version);
  assert.equal(saveStatus(), "saved");
  await settle();
  assert.equal(be.calls.save.length, 3, "nothing left queued");
});

test("header polling preserves the answers' lock; a 409 reloads and reconciles the section", async () => {
  const id = "conflict";
  await open(id);
  be.sections.set("personales", { nombre: "Otro dispositivo" });
  bump();
  let poll;
  const interval = globalThis.setInterval;
  globalThis.setInterval = (fn) => { poll = fn; return interval(() => {}, 60000); };
  const stop = remote.watchCase(id, false);
  globalThis.setInterval = interval;
  try {
    poll();
    await settle();
    actions.setAnswer(id, ["telefono"], "600123456");
    await remote.flush();
    assert.equal(be.calls.save.length, 2, "stale save rejected, then retried with reloaded version");
    assert.deepEqual(be.sections.get("personales"), { nombre: "Otro dispositivo", telefono: "600123456" });
    assert.equal(exp(id).answers.nombre, "Otro dispositivo");
  } finally {
    stop();
  }
});

test("failed save rejects flush and send, keeps edits, retry succeeds, reload maps answers", async () => {
  const id = "c2";
  await open(id);
  actions.setAnswers(id, { ...exp(id).answers, nombre: "B", tiene_inm: "si", inm: [{ ...rentaItem }] });

  be.failSaves = 2;
  await assert.rejects(remote.flush(), (e) => e instanceof ApiError && e.kind === "server");
  assert.equal(saveStatus(), "failed");
  await assert.rejects(actions.sendToGestoria(id));
  assert.equal(be.calls.submit.length, 0, "submit must not run after a failed save");
  assert.equal(be.sections.size, 0, "nothing was stored yet");

  await actions.sendToGestoria(id); // retry: the queued edits were kept
  assert.equal(be.calls.submit.length, 1);
  assert.equal(be.sections.get("personales").nombre, "B");
  assert.deepEqual(be.sections.get("inmuebles").inm, [{ id: "it1", dir: "Calle Mayor 1", renta: "1320.50", pct: 100 }]);
  assert.equal(be.status, "submitted");
  assert.equal(exp(id).status, "enviado");

  await remote.loadCase(id, false); // reload from the server
  const a = exp(id).answers;
  assert.equal(a.nombre, "B");
  assert.equal(a.tiene_inm, "si");
  assert.equal(a.inm.length, 1);
  assert.deepEqual({ ...a.inm[0] }, { _id: "it1", dir: "Calle Mayor 1", renta: "1320,50", pct: "100" });
});

test("concurrent sendToGestoria calls submit once; edits then resend", async () => {
  const id = "c3";
  await open(id);
  const gate = deferred();
  be.holdNextSubmit = gate;

  const p1 = actions.sendToGestoria(id);
  await until(() => be.calls.submit.length === 1, "first submit request");
  const p2 = actions.sendToGestoria(id);
  const p3 = actions.sendToGestoria(id);
  await settle();
  assert.equal(be.calls.submit.length, 1, "no second request while the first is pending");

  gate.resolve();
  await Promise.all([p1, p2, p3]);
  assert.equal(be.calls.submit.length, 1);
  assert.equal(be.messages.length, 1);
  assert.equal(exp(id).status, "enviado");
  assert.equal(exp(id).remote.hasUnsent, false);

  actions.setAnswer(id, ["nombre"], "Cambio tras enviar");
  assert.equal(exp(id).remote.hasUnsent, true, "an edit after sending marks unsent changes");
  await actions.sendToGestoria(id);
  assert.equal(be.sections.get("personales").nombre, "Cambio tras enviar");
  assert.equal(be.calls.submit.length, 2);
  assert.equal(be.calls.submit[1], be.version - 1, "resend carries the version after the edit was saved");
  assert.deepEqual(sysChat(id), ["sent", "resent"]);
  assert.equal(exp(id).remote.hasUnsent, false);
});

test("lost submit response: retry reuses the expected version, backend sends once", async () => {
  const id = "c4";
  await open(id);
  be.loseNextSubmitResponse = true;
  await assert.rejects(actions.sendToGestoria(id), (e) => e instanceof ApiError && e.kind === "network");
  assert.equal(be.status, "submitted", "the server did apply the first request");
  assert.equal(be.messages.length, 1);

  await remote.loadCase(id, false); // the client now knows the bumped version
  assert.equal(exp(id).remote.version, be.version);
  await actions.sendToGestoria(id);
  assert.equal(be.calls.submit.length, 2);
  assert.equal(be.calls.submit[1], be.calls.submit[0], "retry sends the original expected version");
  assert.equal(be.messages.length, 1, "no second system message");
  assert.equal(exp(id).status, "enviado");
  assert.equal(exp(id).remote.version, be.version);
});

test("upload flushes first; upload and delete refresh progress and version", async () => {
  const id = "c5";
  await open(id, "submitted");
  assert.equal(exp(id).remote.hasUnsent, false);

  // The repeat item only exists on the server once its section is saved.
  actions.setAnswers(id, { ...exp(id).answers, tiene_inm: "si", inm: [{ _id: "it1", dir: "Calle Mayor 1" }] });
  const file = new File(["pdf"], "contrato.pdf", { type: "application/pdf" });
  const ref = await remote.upload(id, "inmuebles.inm.doc_contrato", "it1", file);
  assert.equal(ref.name, "contrato.pdf");
  assert.equal(be.docs.length, 1);
  assert.equal(be.docs[0].item_id, "it1");
  assert.deepEqual(exp(id).remote.progress, progress());
  assert.equal(exp(id).remote.version, be.version);
  assert.equal(exp(id).remote.hasUnsent, true);

  const before = progress().answered;
  await remote.removeDocument(id, ref.id);
  assert.equal(be.docs.length, 0);
  assert.equal(progress().answered, before - 1);
  assert.deepEqual(exp(id).remote.progress, progress(), "header progress refreshed after delete");
  assert.equal(exp(id).remote.version, be.version);
});

/* ---------- Run ---------- */

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`ok   ${name}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${name}\n${err.stack ?? err}`);
    }
  }
  if (storageWrites.length) {
    failed++;
    console.log(`FAIL browser storage written in API mode: ${storageWrites.join(", ")}`);
  } else console.log("ok   no browser storage writes");
  process.exit(failed ? 1 : 0);
})();
