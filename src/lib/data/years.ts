import type { AnswerValue, Answers } from "@/lib/questionnaire/types";
import type { Expediente } from "./types";

/** The client a case belongs to; cases opened before multi-year support use their own id. */
export const clientKey = (e: Expediente) => e.clientId ?? e.id;

/** Every case of the same client, newest tax year first. */
export const casesOfClient = (exps: Record<string, Expediente>, e: Expediente) =>
  Object.values(exps)
    .filter((x) => clientKey(x) === clientKey(e))
    .sort((a, b) => b.ejercicio - a.ejercicio);

/** The client's most recent case: the one their portal shows. */
export const latestCase = (exps: Record<string, Expediente>, e: Expediente) => casesOfClient(exps, e)[0] ?? e;

/*
 * What carries over to next year ("sigue igual"): who the client is, the
 * household and the properties with their purchase data (needed for
 * depreciation). Anything that happened during the year — divorce, a death,
 * a child's income, advance deductions, the year's expenses and uploads — is
 * left for the client to answer again.
 */
const PERSONAL = ["nombre", "telefono", "email", "padron_coincide", "direccion"];
const FAMILY = ["miembros", "discapacidad", "disc_quien", "titulo", "tit_num", "tit_conc", "tit_vig", "tit_cat", "progenitor", "prog_nombre", "prog_dni", "prog_hijos"];
const PROPERTY_ITEM = ["dir", "habitual", "tit", "pct", "otros", "alquilado", "inq", "inicio", "renta", "adq", "adq_fecha", "adq_precio", "vinculado", "vinc_cual"];

export const PREFILL_SECTIONS = ["datos-personales", "unidad-familiar", "inmuebles"];

export function carryOver(a: Answers): Answers {
  const out: Answers = {};
  const pick = (keys: string[], from: Answers, to: Answers) => keys.forEach((k) => from[k] !== undefined && (to[k] = from[k] as AnswerValue));
  pick(PERSONAL, a, out);
  pick(FAMILY, a, out);
  if (a.tiene_inm !== undefined) out.tiene_inm = a.tiene_inm;
  if (Array.isArray(a.inm))
    out.inm = (a.inm as Answers[]).map((i) => {
      const item: Answers = {};
      pick(PROPERTY_ITEM, i, item);
      return item;
    });
  return out;
}
