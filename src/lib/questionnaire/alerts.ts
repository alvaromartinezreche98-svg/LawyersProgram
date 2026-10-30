import { EJERCICIO } from "./schema";
import { asFiles, asItems, asText } from "./progress";
import { fmtDate } from "@/lib/format";
import { L, type Text } from "@/lib/i18n";
import type { Answers } from "./types";

export type AlertLevel = "bad" | "warn" | "info";
/** Where the gestoría resolves an alert: the questionnaire section that holds the answer, or that section's documents. */
export interface AlertTarget {
  section: string;
  kind: "answers" | "docs";
}
export interface Alert {
  level: AlertLevel;
  text: Text;
  target: AlertTarget;
}

const ans = (section: string): AlertTarget => ({ section, kind: "answers" });
const doc = (section: string): AlertTarget => ({ section, kind: "docs" });

/** Points the gestoría must check before preparing the return. Ported from the Beta prototype. */
export function alertsFor(a: Answers): Alert[] {
  const r: Alert[] = [];
  const t = (k: string) => asText(a[k]);
  const add = (level: AlertLevel, target: AlertTarget, text: Text) => r.push({ level, text, target });
  const d = (k: string) => fmtDate(t(k));

  if (t("hijo8000") === "si") {
    const who = t("h8_nombre");
    const amt = t("h8_importe") ? `, ${t("h8_importe")} €` : "";
    add("warn", ans("unidad-familiar"), L(
      `${who || "Un hijo o hija"}${amt} declara más de 8.000 € de ingresos en el año: compruebe si procede el mínimo por descendientes.`,
      `${who || "A child"}${amt} earned more than €8,000 in the year: check whether the allowance for descendants applies.`,
      `${who || "Un fill o filla"}${amt} declara més de 8.000 € d'ingressos en l'any: comprove si escau el mínim per descendents.`,
    ));
  }
  if (t("divorcio") === "si") {
    if (!asFiles(a.doc_liquidacion).length)
      add("bad", doc("unidad-familiar"), L(
        "Divorcio en el año: falta la escritura de liquidación del régimen económico matrimonial (o el convenio regulador).",
        "Divorce during the year: the deed settling the marital property regime (or the divorce agreement) is missing.",
        "Divorci en l'any: falta l'escriptura de liquidació del règim econòmic matrimonial (o el conveni regulador).",
      ));
    const on = t("div_fecha") ? d("div_fecha") : "";
    add("warn", ans("unidad-familiar"), L(
      `Divorcio o separación${on ? " el " + on : ""}: revisar la unidad familiar, posibles excesos de adjudicación en la liquidación y pensiones fijadas en el convenio.`,
      `Divorce or separation${on ? " on " + on : ""}: check the household, any excess allocation in the settlement and the maintenance set in the agreement.`,
      `Divorci o separació${on ? " el " + on : ""}: revisar la unitat familiar, possibles excessos d'adjudicació en la liquidació i pensions fixades en el conveni.`,
    ));
  }
  if (t("fallecimiento") === "si") {
    const on = t("fall_fecha") ? ", " + d("fall_fecha") : "";
    add("warn", ans("unidad-familiar"), L(`Fallecimiento en el año: ${t("fall_nombre") || "sin nombre"}${on}.`, `Death during the year: ${t("fall_nombre") || "no name"}${on}.`, `Defunció en l'any: ${t("fall_nombre") || "sense nom"}${on}.`));
  }
  if (["numerosa", "monoparental"].includes(t("titulo")) && t("tit_vig") && t("tit_vig") < `${EJERCICIO}-12-31`)
    add("warn", ans("unidad-familiar"), L(
      `El título de familia ${t("titulo")} caduca el ${d("tit_vig")}, dentro del ejercicio: comprobar renovación.`,
      `The ${t("titulo") === "numerosa" ? "large-family" : "single-parent"} certificate expires on ${d("tit_vig")}, within the tax year: check it was renewed.`,
      `El títol de família ${t("titulo") === "numerosa" ? "nombrosa" : "monoparental"} caduca el ${d("tit_vig")}, dins de l'exercici: comprovar la renovació.`,
    ));
  if (t("matern") === "si") add("info", ans("unidad-familiar"), L("Cobra por anticipado la deducción por maternidad: regularizar los abonos.", "Receives the maternity deduction in advance: reconcile the payments.", "Cobra per avançat la deducció per maternitat: regularitzar els abonaments."));
  if (t("anticipada") === "si") add("info", ans("unidad-familiar"), L("Cobra por anticipado la deducción por discapacidad o familia numerosa: regularizar los abonos.", "Receives the disability or large-family deduction in advance: reconcile the payments.", "Cobra per avançat la deducció per discapacitat o família nombrosa: regularitzar els abonaments."));
  if (t("padron_coincide") === "no") add("info", ans("datos-personales"), L("El domicilio no coincide con el del DNI: revisar domicilio fiscal.", "Address differs from the one on the DNI: check the tax address.", "El domicili no coincidix amb el del DNI: revisar el domicili fiscal."));
  if (t("autonomo") === "si" && t("auto_paga") === "yo") add("info", ans("trabajo"), L("Autónomo que paga sus propias cuotas: incluirlas como gasto.", "Self-employed and pays own contributions: include them as an expense.", "Autònom que paga les seues quotes: incloure-les com a despesa."));
  if (t("tiene_inm") === "si")
    asItems(a.inm).forEach((i, k) => {
      if (asText(i.alquilado) !== "si") return;
      const n = asText(i.dir);
      const ne = n || `Property ${k + 1}`;
      const ns = n || `Inmueble ${k + 1}`;
      const nv = n || `Immoble ${k + 1}`;
      if (!asFiles(i.doc_contrato).length) add("warn", doc("inmuebles"), L(`${ns}: falta el contrato de alquiler.`, `${ne}: rental contract missing.`, `${nv}: falta el contracte de lloguer.`));
      if (asText(i.g_rep) === "si" && !asFiles(i.doc_rep).length)
        add("bad", doc("inmuebles"), L(`${ns}: faltan las facturas de reparaciones (NIF/CIF y razón social del proveedor).`, `${ne}: repair invoices missing (supplier’s NIF/CIF and company name).`, `${nv}: falten les factures de reparacions (NIF/CIF i raó social del proveïdor).`));
      if (asText(i.g_mob) === "si" && !asFiles(i.doc_mob).length)
        add("bad", doc("inmuebles"), L(`${ns}: faltan las facturas del equipamiento para amortizar.`, `${ne}: equipment invoices missing for depreciation.`, `${nv}: falten les factures de l'equipament per a amortitzar.`));
      if (asText(i.vinculado) === "si") {
        const v = asText(i.vinc_cual);
        add("info", ans("inmuebles"), L(`${ns}: declarar en el mismo apartado que ${v || "el inmueble vinculado"}.`, `${ne}: declare in the same section as ${v || "the linked property"}.`, `${nv}: declarar en el mateix apartat que ${v || "l'immoble vinculat"}.`));
      }
    });
  if (t("actividad") === "si") {
    const c = asFiles(a.doc_130).length;
    if (c < 4) add("warn", doc("actividad-economica"), L(`Actividad: hay ${c} de 4 Modelos 130 subidos.`, `Self-employment: ${c} of 4 Modelo 130 forms uploaded.`, `Activitat: hi ha ${c} de 4 Models 130 pujats.`));
  }
  if (t("acciones") === "si" && asItems(a.acc).some((x) => !asText(x.fecha) || !asText(x.precio)))
    add("warn", ans("ventas-y-ganancias"), L("Acciones: falta la fecha o el precio de compra de algún valor.", "Shares: purchase date or price missing for a holding.", "Accions: falta la data o el preu de compra d'algun valor."));
  if (t("alq_viv") === "si" && !t("alq_renta")) add("warn", ans("deducciones"), L("Alquiler de vivienda habitual: falta la renta que paga actualmente.", "Rented main home: current monthly rent missing.", "Lloguer de l'habitatge habitual: falta la renda que paga actualment."));

  const order: Record<AlertLevel, number> = { bad: 0, warn: 1, info: 2 };
  return r.sort((x, y) => order[x.level] - order[y.level]);
}
