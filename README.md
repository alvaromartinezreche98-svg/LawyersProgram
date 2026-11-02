This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Gestoría API demo (T3)

Use `.env.local` (ignored by git) with `NEXT_PUBLIC_API_URL=https://prerenta.91-107-241-157.sslip.io`
and the owner's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Restart `npm run dev` after changing keys.
Leave the Clerk key unset to run the localStorage demo instead. Never put a Clerk secret key here.

Regression checks (the dummy key below only selects API mode; these tests make no network calls):

```sh
TMPDIR=/tmp NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_regression \
  NEXT_PUBLIC_API_URL=https://prerenta.91-107-241-157.sslip.io \
  npx --yes tsx@4.20.6 --test tests/gestoria.test.ts
npm run build
npm run lint
npx tsc --noEmit
```

The build generates Next's `PageProps`/`LayoutProps` route types on a fresh checkout.
The regressions cover inbox progress/issues before and after opening a case, newest-first
ordering, and failed/uninitialised API writes never appearing as saved status or delivered chat.

### Manual browser acceptance script

Prerequisites: owner has run backend `make demo-reset CONFIRM=wipe-demo DEMO_OWNER_SUBJECT=<owner Clerk id>`.
Do not reset a shared environment without the owner's approval. Seeded clients cannot sign in;
use a separate invited real client account/browser for the two-sided checks.

1. Start `npm run dev`. Open `/acceso`, sign in as staff, open DevTools Network with Preserve log.
   Confirm `GET /v1/me` returns `roles` containing `admin` or `accountant`, not the demo role picker.
   If T1 sign-in routing is unavailable, sign in manually once and navigate to `/expedientes`.
2. Open `/expedientes` without query parameters. Expect all seeded cases, newest `updated_at` first:
   Sonia (Borrador, 60%), Javier (Enviado, one red incidencia), Marta (Borrador),
   Andrés (En revisión, complete). Compare names/progress/issues with `GET /v1/staff/cases`.
   Confirm unread indicators match `unread_messages`. Select Por estado, then each status card;
   only matching cases remain. Clear filters.
3. Open Javier. Check `GET /v1/cases/{id}`, `/sections`, `/documents`, `/messages`, `/notes` succeed.
   Resumen shows “Avisos para preparar la renta” and the missing repair-invoice warning.
   Datos fiscales shows saved answers and missing answers; Documentos shows filled/missing slots.
   Open a filled file: authenticated `GET /v1/cases/{id}/documents/{document_id}` returns the file.
   Staff answers are read-only; no upload or delete controls appear.
4. Under Detalles → Estado del expediente choose En revisión, then Listo para presentar.
   Each selection must post `/v1/staff/cases/{id}/status` with the current `expected_version`.
   Reload after each selection; the status must persist. Return to the inbox and check the row/filter.
   Move backwards through En revisión, Enviado and Borrador, reloading each time; all four are allowed.
   Restore Javier to Enviado.
5. Open Javier's Chat tab. When unread messages exist, confirm `POST /messages/read` → 204.
   Send `Gracias, Javier. Revisaremos las facturas.` once. Confirm `POST /messages` → 201,
   the reply appears once, and remains after reload/reopening Chat.
   Block the API in DevTools and try another reply: an error appears, the draft remains,
   and no delivered bubble is fabricated. Unblock before retrying.
   Likewise block a status post: the original status remains with an error, not false success.
6. Repeat status/reply on a real invited client's case. In that client's separate browser,
   wait up to five seconds on the open case: En revisión and Listo para presentar must appear
   on the home screen, and the staff reply must appear in Mensajes. Javier's fictional identity
   cannot be used for this step.
7. Open Clientes. Enter only a new name and create once. Confirm `POST /v1/clients` → 201.
   The one-time link must be `/entrar#code=…`, never a query parameter; its QR appears locally.
   Network must show no third-party QR request. Download the QR or scan it and compare the URL.
   Leave/reload the page: the invitation status remains but the one-time code is not recovered.
8. Local demo regression: with Clerk key unset, open `/acceso` → Soy gestor → Entrar al panel
   de la gestoría. Open Javier, select En revisión, send a reply, reload, and confirm both remain.
   Move back to Borrador; localStorage mode must still work.

### This worktree's rehearsal observations (2026-11-02)

The copied `.env.local` had the deployed API URL but no Clerk publishable key.
Authenticated backend steps above therefore remain for the owner after filling the key;
no backend reset, staff sign-in, invitation creation or live API write was performed.
Native production server on port 3203: entered the demo staff panel, opened Javier,
changed Enviado → En revisión, sent `T3 smoke reply — local demo`, reloaded and observed
both persist, then changed backwards to Borrador. Desktop screenshots showed the
repair-invoice warning and working chat/status panels. Browser diagnostics showed aborted
Next prefetch requests, not a JavaScript exception.
## Mobile demo smoke script (T4)

Run `npm ci`, then `npm run dev`. Without Clerk/API environment settings, use
`/acceso` → **Expedientes de ejemplo** → **Alba Romero Puig**. No Docker needed.
In Chrome DevTools, enable touch/device emulation and repeat at **390×844** and
**360×800**. Use a fresh browser profile so demo changes do not affect real data.

| Screen | Steps and expected result | Local demo observations |
| --- | --- | --- |
| `/acceso` | Read invitation instructions; focus code field; reach Continue. | Both widths: no horizontal scroll; code field 52px high and inside viewport. |
| `/entrar#code=…` | Open invitation link; check entry layout and code retention through sign-in. | Both widths: entry fits; fragment cleared. Live sign-in still needs keys. |
| `/inicio` | Read status and progress; follow main Continue action. Open menu to reach documents. | Both widths: no horizontal scroll; main actions at least 44px high. |
| `/declaracion/datos-personales` | Expand section chooser, choose a section, return. Edit phone; reload; use sticky Next. | Both widths: no horizontal scroll; labels above fields; 48px inputs with 16px text. Edited phone persisted; section chooser and Next navigated. |
| `/declaracion/unidad-familiar` | Open a date calendar; check month arrows, days, and close/select controls. | At 360px: calendar inside viewport; day target approximately 45×45px. |
| `/documentos` and upload question | Read full folder titles; follow upload slot; choose **Hacer foto** or **Elegir archivos**; upload PNG; reload. | Both widths: stacked slots, no horizontal scroll, controls at least 44px high. Camera label opened chooser; selected PNG persisted after reload. Existing camera input uses `accept="image/*" capture="environment"`. |
| `/declaracion/revisar` | Scroll to Send/Resend; activate it; confirm sent status. | Both widths: no horizontal scroll and reachable controls. At 360px, resend changed visible status to **Enviado**. This version sends directly, without a confirmation dialog. |

For each route, DevTools console can check page overflow:

```js
console.assert(document.documentElement.scrollWidth === innerWidth, "Horizontal overflow");
```

Desktop sanity check: `/inicio` at 1280×900 retained sidebar and two-column
layout, with no horizontal page overflow. New rules are phone-scoped and
client-scoped; gestoría layout is not changed.

### API and physical-phone checks still required

No `.env.local`/Clerk keys were present in this worktree. With owner-provided
Clerk keys and `NEXT_PUBLIC_API_URL`, restart the native dev server, open a real
invitation at `/entrar#code=…`, sign in, and repeat the table at both widths.
Check Clerk sign-in, verification, and error views fit without sideways scroll;
then save an answer, upload a photo, and send using a disposable demo case.
Confirm uploaded photo and sent status survive reload from the API.

Chrome emulation exercises file chooser behavior, not physical camera hardware.
On iPhone Safari and Android Chrome, repeat **Hacer foto**, grant camera access,
take a readable JPEG photo, and confirm preview/upload. Also check keyboard
visibility, safe-area spacing, and sticky Next while editing a field. Do not use
HEIC for this demo. No real-device or live API sign-in result is claimed here.

Checks run for this change: `npm run lint` (one existing unused `ReactNode`
warning in `campaign-board.tsx`), `npx tsc --noEmit`, and `npm run build`.
