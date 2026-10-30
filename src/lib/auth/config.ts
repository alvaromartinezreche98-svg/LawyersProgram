/*
 * Authentication switch. Clerk is used only when its publishable key is set
 * (NEXT_PUBLIC_* values are inlined at build time, so this is a constant).
 * Without it the app keeps the Delivery 1 demo access on "/".
 */
export const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * With Clerk on, the demo role picker is shown after sign-in only when this is
 * set: a staging aid until the backend links Clerk users to app users. It
 * authorizes nothing and must stay off in production.
 */
export const DEMO_LOGIN = !CLERK_ENABLED || process.env.NEXT_PUBLIC_DEMO_LOGIN === "1";

/** Pages open without signing in: the public website, the access page and maintenance. */
export const isPublicPath = (p: string) => ["/", "/acceso", "/entrar", "/contacto", "/demo", "/como-funciona", "/para-gestorias", "/preguntas-frecuentes", "/mantenimiento"].includes(p) || p.startsWith("/legal/") || p.startsWith("/invitacion/");

/** The access (sign-in) page. "/?next=…" and invitation links on "/" still forward here. */
export const SIGN_IN_PATH = "/acceso";

/** Gestoría panel areas; every other protected page belongs to the client portal. */
export const GESTOR_PREFIXES = ["/expedientes", "/ajustes", "/clientes", "/cobros", "/citas", "/panel"];

/**
 * Whether case data may live in this browser. Only the demo keeps cases and
 * files in localStorage/IndexedDB; with real accounts the API is the source of
 * truth and answers or documents must not be stored in the browser (design
 * reference §3). An API URL alone (no Clerk key yet) keeps the browser demo.
 */
export const LOCAL_DATA = DEMO_LOGIN && !(CLERK_ENABLED && !!process.env.NEXT_PUBLIC_API_URL);

/**
 * API mode: cases, answers, documents, chat and notes come from the firm's
 * API (NEXT_PUBLIC_API_URL) with Clerk tokens. Needs Clerk; without both the
 * app stays in the browser-only demo.
 */
export const API_MODE = CLERK_ENABLED && !!process.env.NEXT_PUBLIC_API_URL;
