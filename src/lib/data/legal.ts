import type { Expediente, Firm, LegalKind } from "./types";

export const LEGAL_KINDS: LegalKind[] = ["privacy", "mandate"];

export type SignState = "signed" | "outdated" | "pending" | "unavailable";

/** State of one legal document for one client: signed (current version), signed an older version, pending, or not uploaded by the firm. */
export function signState(e: Expediente, firm: Firm, kind: LegalKind): SignState {
  const doc = firm.docs[kind];
  if (!doc) return "unavailable";
  const sig = e.signatures?.[kind];
  if (!sig) return "pending";
  return sig.version < doc.version ? "outdated" : "signed";
}

/** The signing step is complete when every document the firm uploaded is signed in its current version. */
export function signingDone(e: Expediente, firm: Firm) {
  return LEGAL_KINDS.every((k) => {
    const s = signState(e, firm, k);
    return s === "signed" || s === "unavailable";
  });
}
