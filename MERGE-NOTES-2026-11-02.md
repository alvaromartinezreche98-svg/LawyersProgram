# PreRenta demo — merge notes for the morning (2026-11-02)

Written by the Foundry Agent at 01:05 UTC from the operation `op_41d3280636b3` reviews. Not committed; delete after merging.

## State
- T1, T2, T3: built and **reviewed PASS**. T4: built, review verdict `accept` (one advisory), being re-recorded by the engine.
- Branches (one commit each, on top of `main` = `cb65d77`):
  - `foundry/op_41d3280636b3/op_41d3280636b3-t1-api-boot` — API mode copy for unlinked accounts, harmless reopen of used invitation links, T1 manual test script
  - `foundry/op_41d3280636b3/op_41d3280636b3-t2-client-flow` — API-mode client save, documents and submit flow
  - `foundry/op_41d3280636b3/op_41d3280636b3-t3-gestoria-flow` — gestoría inbox + acknowledged API writes
  - `foundry/op_41d3280636b3/op_41d3280636b3-t4-mobile` — client demo screens usable on phones
- Nothing is deployed. `.env.local` still lacks the two Clerk keys → no live sign-in was verified by anyone.

## Merge order and the one required edit
```
git checkout main
git merge --no-edit foundry/op_41d3280636b3/op_41d3280636b3-t1-api-boot
git merge --no-edit foundry/op_41d3280636b3/op_41d3280636b3-t2-client-flow
git merge --no-edit foundry/op_41d3280636b3/op_41d3280636b3-t3-gestoria-flow
```
**Then, before building** (reviewer's T3 advisory, only matters once T2 and T3 coexist): in `src/lib/api/remote.ts`, the `catch` of `hooks.status` (≈ line 268 after the merge) currently does
```ts
await refresh(id);
```
replace with
```ts
if (isApiError(err) && err.kind === "conflict") await loadCase(id, true);
```
and for non-409 errors just rethrow (drop the refresh). Why: T2 makes `refresh()` keep the stored case version; on a 409 T3 recovers via `refresh()`, so the version never updates and every later status change 409s until reload — it would break "En revisión → Listo para presentar" in the two-browser demo. `isApiError` and `loadCase` already exist in that file.
```
git commit -am "remote.ts: a 409 on a status change reloads the case (T2+T3 interaction)"
git merge --no-edit foundry/op_41d3280636b3/op_41d3280636b3-t4-mobile   # conflicts only in README.md: keep both appended sections
npm run lint && npx tsc --noEmit && npm run build
```

## T4 advisory (cosmetic, optional)
`src/styles/layout/_shell.scss:13` — the phone rule applies to every `label[for]`, `a` and `b`; scope it if anything looks off on desktop.

## Then
1. Fill `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local` (instance `loyal-polliwog-8469`), `npm run dev`.
2. On the server: `make demo-reset CONFIRM=wipe-demo DEMO_OWNER_SUBJECT=<your Clerk id>` (backend `docs/deployment.md`).
3. Walk `docs/demo-checklist.md` §1 → §2 → §3 once, phone for §2. T1's manual test script is on its branch.
4. Push `main`; Vercel env needs the same two Clerk vars + `NEXT_PUBLIC_API_URL=https://prerenta.91-107-241-157.sslip.io` when you deploy.
