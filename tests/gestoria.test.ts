import assert from "node:assert/strict";
import test from "node:test";
import { caseFromApi } from "../src/lib/api/mapping";
import type { ApiStaffCase } from "../src/lib/api/types";
import { actions, remoteStore, setRemoteHooks } from "../src/lib/data/store";
import type { RemoteHooks } from "../src/lib/data/store";
import { sortCases, triage } from "../src/lib/gestor/triage";

const summary: ApiStaffCase = {
  id: "javier", client_id: "client-javier", client_display_name: "Javier",
  tax_year: 2026, definition_version: "2026.1", status: "submitted", version: 3,
  submitted_at: "2026-10-30T10:00:00Z", has_unsent_changes: false,
  created_at: "2026-10-29T10:00:00Z", updated_at: "2026-10-30T10:00:00Z",
  progress: { answered: 6, total: 10, percent: 60 }, unread_messages: 1, issues: 1,
};

test("opening a case does not change inbox progress or hide its incidencias", () => {
  const before = caseFromApi(summary);
  const loaded = { ...before, answers: { nombre: "Javier Ortega" }, remote: { ...before.remote!, loaded: true } };
  for (const e of [before, loaded]) {
    const row = triage(e);
    assert.equal(row.pct, 60);
    assert.equal(row.pending, 4);
    assert.equal(row.bad, 1);
    assert.equal(row.unread, 1);
  }
  assert.equal(triage(loaded).name, "Javier Ortega");
});

test("recent inbox order is not replaced by urgency", () => {
  const older = caseFromApi(summary);
  const newer = caseFromApi({ ...summary, id: "sonia", status: "draft", unread_messages: 0, issues: 0, updated_at: "2026-10-31T10:00:00Z" });
  assert.deepEqual(sortCases([triage(older), triage(newer)], "recent").map((row) => row.exp.id), ["sonia", "javier"]);
});

test("failed API writes never appear as saved local status or delivered chat", async () => {
  // Run with API mode enabled, as documented in README.md.
  const e = caseFromApi(summary);
  remoteStore.putCases([e]);
  assert.equal(await actions.setStatus(e.id, "revision"), false, "an uninitialised API bridge must not fall back to the demo store");
  const reject = async () => { throw new Error("offline"); };
  const hooks: RemoteHooks = {
    answers() {}, submit: reject, status: reject, message: reject,
    read: reject, note() {}, retry() {},
  };
  setRemoteHooks(hooks);
  assert.equal(await actions.setStatus(e.id, "listo"), false);
  assert.equal(await actions.sendMessage(e.id, "gestor", "Gracias, Javier."), false);
  assert.equal(remoteStore.get().exps[e.id].status, "enviado");
  assert.deepEqual(remoteStore.get().exps[e.id].chat, []);
});
