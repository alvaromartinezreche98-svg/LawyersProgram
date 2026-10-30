"use client";

import { useAppState } from "@/lib/data/store";
import { statusText, type Status } from "@/lib/data/types";
import { LOCALE, textIn, type Text } from "./index";
import { MESSAGES } from "./messages";

/** Current language, its UI dictionary and helpers for schema copy. */
export function useI18n() {
  const { lang } = useAppState();
  return {
    lang,
    locale: LOCALE[lang],
    t: MESSAGES[lang],
    tr: (x: Text) => textIn(x, lang),
    status: (s: Status) => textIn(statusText(s), lang),
  };
}
