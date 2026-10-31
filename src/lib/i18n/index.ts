import { VA_COPY } from "./va-copy";

/** Languages the app is available in: Castilian, Valencian and English (for foreign residents). */
export type Lang = "es" | "va" | "en";

/**
 * The languages offered in the switchers and settings: Spanish and English only
 * (2026-10-31). Valencian stays translated in the code; add it back here to offer it again.
 */
export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "es", label: "Español", short: "ES" },
  { id: "en", label: "English", short: "EN" },
];

export const DEFAULT_LANG: Lang = "es";

/**
 * A piece of copy in every language. Valencian is optional here: static copy
 * finds it in VA_COPY by its Spanish text; copy built at runtime passes it.
 */
export interface Text {
  es: string;
  en: string;
  va?: string;
}

export const L = (es: string, en: string, va?: string): Text => (va === undefined ? { es, en } : { es, en, va });

/** Copy in one language; Valencian falls back to VA_COPY, then to Spanish. */
export const textIn = (x: Text, lang: Lang): string => (lang === "va" ? (x.va ?? VA_COPY[x.es] ?? x.es) : x[lang]);

export const LOCALE: Record<Lang, string> = { es: "es-ES", va: "ca-ES", en: "en-GB" };

/** BCP 47 tag for <html lang>: Valencian is the Valencian variety of Catalan. */
export const HTML_LANG: Record<Lang, string> = { es: "es", va: "ca-ES-valencia", en: "en" };

export const isLang = (v: unknown): v is Lang => v === "es" || v === "va" || v === "en";
