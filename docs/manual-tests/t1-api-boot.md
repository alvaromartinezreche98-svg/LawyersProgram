# T1 manual test: API mode boot, role landing, invitation accept

Run against the deployed demo API. Two browsers (or profiles): **A** = firm owner, **B** = new client.

## Setup
1. `.env.local` (git-ignored): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (instance `loyal-polliwog-8469`),
   `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/acceso`, `NEXT_PUBLIC_API_URL=https://prerenta.91-107-241-157.sslip.io`, `NEXT_PUBLIC_DEMO_LOGIN` unset.
2. Optional reset: backend `make demo-reset CONFIRM=wipe-demo DEMO_OWNER_SUBJECT=<owner Clerk id>`.
3. `npm run dev`, open `http://localhost:3000`. DevTools → Network filtered on `sslip.io`.

## 1. Owner lands on the gestoría side
1. Browser A: `/acceso` → Clerk sign-in as `shayanfall79@gmail.com`.
2. Expect `GET /v1/me` 200 with `roles: ["admin"]`, then `GET /v1/staff/cases`, redirect to `/expedientes` with the seeded cases.

## 2. Create client → link + QR
1. Browser A: `/clientes` → name "Cliente Demo" → "Crear".
2. Expect `POST /v1/clients` 201; side card shows a QR (SVG drawn in page, no request to any QR service) and the link
   `http://localhost:3000/entrar#code=<43 chars>`. Copy the link.

## 3. New client signs up through the link
1. Browser B (signed out): paste the link.
2. Expect the address bar to change to `/entrar` (code removed); DevTools → Application → Session Storage shows `prerenta:invite`.
3. Sign up in the Clerk form (e-mail code from Clerk). Clerk's own `#/…` steps must not lose the code.
4. Expect `POST /v1/invitations/accept` 200 (`roles: ["client"]`), then `GET /v1/cases` with one 2026 `draft` case,
   redirect to `/inicio`; `prerenta:invite` is gone from sessionStorage.
5. Browser A: reload `/clientes` → invitation "Aceptada", case Borrador.

## 4. Reopening the link is harmless
1. Browser B: open the same link again.
2. Expect accept 200 (same account, idempotent) and landing on `/inicio` with the same single case; no second case in A.

## 5. Signed in without an invitation
1. Third account (never invited): sign in on `/acceso`.
2. Expect `GET /v1/me` 403 → panel "Su cuenta aún no está vinculada … pida a su gestoría que le invite" with a code field.
3. Type a wrong code → `POST /v1/invitations/accept` 404 → "Este código no es válido…".

## 6. Staff opens an invitation link
1. Browser A: open a fresh invitation link → "staff code" warning; no accept request is sent.

## 7. Silent token refresh (401) and 415
1. Browser B on `/inicio`, idle > 60 s (token lifetime), then navigate/save an answer.
   Expect no sign-out; at most a 401 followed by the same request retried with a fresh token (200).
2. Upload a `.txt` renamed to `.pdf` → API 415 → "type not supported" message, nothing saved.
