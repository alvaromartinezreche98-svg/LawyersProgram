# T2 client API rehearsal

## Setup

1. Copy the deployment `.env.local` into this worktree (ignored by git). Set `NEXT_PUBLIC_API_URL=https://prerenta.91-107-241-157.sslip.io` and the owner's real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; keep `NEXT_PUBLIC_DEMO_LOGIN` unset. Restart `npm run dev -- --port 3022` after changing env values.
2. Use a fresh invited **client** account, not the staff owner. Seeded fictional example clients cannot sign in. Obtain an invitation from the staff browser and accept it through `/entrar#code=…`. Complete Clerk's email step manually. T1 owns sign-in; record any manual sign-in workaround separately.
3. Open DevTools Network, preserve log, filter `/v1/`. Use synthetic answers and a harmless real PNG/PDF, never identity documents. Run once at desktop width and once at 390 px. Do not use the local example picker as evidence of API persistence.

## Exact client steps and expected observations

1. Open `/inicio`. Compare displayed status, percentage and unread badge with `GET /v1/cases/{id}` (`status`, `progress.percent`, `unread_messages`). Initially `has_unsent_changes` should be false for a fresh case.
2. Open `/declaracion/datos-personales`. Enter `Lucía Demo T2`, phone `600123456`, email `lucia@example.invalid`. Wait for saved indicator. Observe `PUT …/sections/personales` with `definition_version`, `expected_case_version` and section answers. No upload fields belong in answers.
3. Open `/declaracion/trabajo`. Set union/professional fees to Sí, entity `Sindicato Demo`, annual amount `1.320,50`; answer remaining yes/no questions No. Wait for saved indicator. Observe `PUT …/sections/trabajo` with `cuota: true`, `cuota_imp: "1320.50"` and the version returned by the preceding save. Reload both routes: the name, Sí and Spanish-formatted amount must return from `GET …/sections`, not browser data.
4. Back in personal details, upload a harmless PDF/JPEG/PNG/WebP in the DNI slot. Observe one multipart `POST …/documents?field=personales.doc_dni`, exactly one part named `file`. Confirm filename remains after reload; compare `GET …/documents` and progress from case detail (a filled slot counts once, not once per file). Remove it: observe `DELETE …/documents/{document_id}` 204, reload and confirm absence/progress. Upload it again for the send scenario. Try a file larger than 20 MiB and a text file: UI must reject without an upload request. Only synthetic files.
5. Open `/declaracion/revisar`, leave other sections incomplete. Check the missing-answer explanation includes “Puede enviar igualmente”. Double-click “Enviar a la gestoría”. While pending, button must disable; Network must show **one** `POST …/submit` with `expected_version`. Open `/mensajes`: exactly one system line `Cuestionario enviado a la gestoría.`. Reload: case status Enviado, `has_unsent_changes: false`, no resend button until another change.
6. Edit the name to `Lucía Demo T2 editada`, wait for saved indicator. Home must show unsent changes; review button reads “Reenviar con los cambios”. Click once. Observe a new submit with current version, then one `Cuestionario actualizado y reenviado a la gestoría.` system line and `has_unsent_changes: false`.
7. Failure paths: take browser offline during autosave, click send; failed save must surface and no submit may occur. Restore network, retry save, then send. For conflict, edit the same section in two tabs: the stale PUT gets 409, reloads server answers/version and reconciles before retry. Conflicting fields keep server values and show the merged notice; non-conflicting local edits persist.
8. Check localStorage: no `prerenta:data:v1` or `prerenta:firm:v1` answer payload may be written in API mode (language preference may remain). At 390 px confirm home status/percentage and review send control are readable and reachable.

## Runnable local regression

`node tests/client-flow.mjs` exercises actual store/remote/mapping against an in-memory version-guarded backend: in-flight edits, two-section persistence/reload, Spanish money, failed-save blocking, concurrent send, retry idempotency and document progress. This is not evidence of deployed-backend behavior.

## Attempt record — 2026-11-02

The copied `.env.local` contains the deployed API URL but no Clerk publishable key. Per task protocol, live client sign-in and authenticated deployed-backend rehearsal are blocked pending the owner's key. No real-backend persistence, upload or send observation is claimed. Local demo browser observations and command results are recorded in the task handoff.

Local observations for this attempt:
- Started `npm run dev -- --hostname 127.0.0.1 --port 3022` with the copied env; missing Clerk key selected local demo mode.
- At 390 × 844, opened example Sonia Martínez Soler, continued welcome/identity, opened `/inicio`, then `/declaracion/trabajo`. Answered Sí to fees, entered `Sindicato Demo` and `1.320,50`, answered remaining questions No. “Todo guardado” appeared; reload retained both text values and radio choices. No horizontal overflow was observed on these screens.
- Opened `/declaracion/revisar`, sent with incomplete sections, opened `/mensajes`; saw `Cuestionario enviado a la gestoría.` and captured the rendered mobile chat. This exercises preserved local demo behavior only.
- `node tests/client-flow.mjs`: all behavioral checks passed, including no browser-storage writes in API mode.
- `npm run lint`: exit 0; existing unused `ReactNode` warning in `src/components/gestor/campaign-board.tsx`. `npx tsc --noEmit`: exit 0. `npm run build`: exit 0, 61 pages generated.
