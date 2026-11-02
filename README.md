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
