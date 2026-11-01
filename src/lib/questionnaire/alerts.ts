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
  /** The whole sentence: what the gestoría sends when it asks the client, and the key a review is kept under. */
  text: Text;
  /** The issue in a few words, read first. */
  title: Text;
  /** The particulars: which property or person, dates, amounts, what to do. */
  detail?: Text;
  target: AlertTarget;
}

const ans = (section: string): AlertTarget => ({ section, kind: "answers" });
const doc = (section: string): AlertTarget => ({ section, kind: "docs" });
const join = (...p: string[]) => p.filter(Boolean).join(" · ");

/** Points the gestoría must check before preparing the return. Ported from the Beta prototype. */
export function alertsFor(a: Answers): Alert[] {
  const r: Alert[] = [];
  const t = (k: string) => asText(a[k]);
  const add = (level: AlertLevel, target: AlertTarget, text: Text, title: Text, detail?: Text) => r.push({ level, text, title, detail, target });
  const d = (k: string) => fmtDate(t(k));
  const inAdvance = L("Regularizar los abonos.", "Reconcile the payments.", "Regularitzar els abonaments.");

  if (t("hijo8000") === "si") {
    const who = t("h8_nombre");
    const amt = t("h8_importe") ? `, ${t("h8_importe")} €` : "";
    add("warn", ans("unidad-familiar"), L(
      // Prototype wording: a firm instruction, as the question's own help says the child cannot be included.
      `Hijo con ingresos superiores a 8.000 € (${who || "sin nombre"}${amt}): no aplicar el mínimo por descendientes.`,
      `Child with income over €8,000 (${who || "no name"}${amt}): do not apply the allowance for descendants.`,
      `Fill amb ingressos superiors a 8.000 € (${who || "sense nom"}${amt}): no aplicar el mínim per descendents.`,
    ), L("Hijo con ingresos superiores a 8.000 €", "Child with income over €8,000", "Fill amb ingressos superiors a 8.000 €"), L(
      join(`${who || "Sin nombre"}${amt}`, "No aplicar el mínimo por descendientes."),
      join(`${who || "No name"}${amt}`, "Do not apply the allowance for descendants."),
      join(`${who || "Sense nom"}${amt}`, "No aplicar el mínim per descendents."),
    ));
  }
  if (t("divorcio") === "si") {
    if (!asFiles(a.doc_liquidacion).length)
      add("bad", doc("unidad-familiar"), L(
        "Divorcio en el año: falta la escritura de liquidación del régimen económico matrimonial (o el convenio regulador).",
        "Divorce during the year: the deed settling the marital property regime (or the divorce agreement) is missing.",
        "Divorci en l'any: falta l'escriptura de liquidació del règim econòmic matrimonial (o el conveni regulador).",
      ), L("Falta la liquidación del divorcio", "Divorce settlement missing", "Falta la liquidació del divorci"), L(
        "Escritura de liquidación del régimen económico matrimonial o convenio regulador.",
        "The deed settling the marital property regime, or the divorce agreement.",
        "Escriptura de liquidació del règim econòmic matrimonial o conveni regulador.",
      ));
    const on = t("div_fecha") ? d("div_fecha") : "";
    add("warn", ans("unidad-familiar"), L(
      `Divorcio o separación${on ? " el " + on : ""}: revisar la unidad familiar, posibles excesos de adjudicación en la liquidación y pensiones fijadas en el convenio.`,
      `Divorce or separation${on ? " on " + on : ""}: check the household, any excess allocation in the settlement and the maintenance set in the agreement.`,
      `Divorci o separació${on ? " el " + on : ""}: revisar la unitat familiar, possibles excessos d'adjudicació en la liquidació i pensions fixades en el conveni.`,
    ), L("Divorcio o separación en el año", "Divorce or separation this year", "Divorci o separació en l'any"), L(
      join(on, "Revisar la unidad familiar, excesos de adjudicación y pensiones del convenio."),
      join(on, "Check the household, any excess allocation and the maintenance in the agreement."),
      join(on, "Revisar la unitat familiar, excessos d'adjudicació i pensions del conveni."),
    ));
  }
  if (t("fallecimiento") === "si") {
    const on = t("fall_fecha") ? ", " + d("fall_fecha") : "";
    add("warn", ans("unidad-familiar"), L(`Fallecimiento en el año: ${t("fall_nombre") || "sin nombre"}${on}.`, `Death during the year: ${t("fall_nombre") || "no name"}${on}.`, `Defunció en l'any: ${t("fall_nombre") || "sense nom"}${on}.`),
      L("Fallecimiento en el año", "Death during the year", "Defunció en l'any"),
      L(`${t("fall_nombre") || "Sin nombre"}${on}`, `${t("fall_nombre") || "No name"}${on}`, `${t("fall_nombre") || "Sense nom"}${on}`));
  }
  if (["numerosa", "monoparental"].includes(t("titulo")) && t("tit_vig") && t("tit_vig") < `${EJERCICIO}-12-31`) {
    const large = t("titulo") === "numerosa";
    add("warn", ans("unidad-familiar"), L(
      `El título de familia ${t("titulo")} caduca el ${d("tit_vig")}, dentro del ejercicio: comprobar renovación.`,
      `The ${large ? "large-family" : "single-parent"} certificate expires on ${d("tit_vig")}, within the tax year: check it was renewed.`,
      `El títol de família ${large ? "nombrosa" : "monoparental"} caduca el ${d("tit_vig")}, dins de l'exercici: comprovar la renovació.`,
    ), L(`Título de familia ${t("titulo")} caducado en el año`, `${large ? "Large-family" : "Single-parent"} certificate expires this year`, `Títol de família ${large ? "nombrosa" : "monoparental"} caducat en l'any`), L(
      join(`Caduca el ${d("tit_vig")}`, "Comprobar la renovación."),
      join(`Expires on ${d("tit_vig")}`, "Check it was renewed."),
      join(`Caduca el ${d("tit_vig")}`, "Comprovar la renovació."),
    ));
  }
  if (t("matern") === "si") add("info", ans("unidad-familiar"), L("Cobra por anticipado la deducción por maternidad: regularizar los abonos.", "Receives the maternity deduction in advance: reconcile the payments.", "Cobra per avançat la deducció per maternitat: regularitzar els abonaments."),
    L("Deducción por maternidad cobrada por anticipado", "Maternity deduction paid in advance", "Deducció per maternitat cobrada per avançat"), inAdvance);
  if (t("anticipada") === "si") add("info", ans("unidad-familiar"), L("Cobra por anticipado la deducción por discapacidad o familia numerosa: regularizar los abonos.", "Receives the disability or large-family deduction in advance: reconcile the payments.", "Cobra per avançat la deducció per discapacitat o família nombrosa: regularitzar els abonaments."),
    L("Deducción por discapacidad o familia numerosa anticipada", "Disability or large-family deduction paid in advance", "Deducció per discapacitat o família nombrosa anticipada"), inAdvance);
  if (t("padron_coincide") === "no") add("info", ans("datos-personales"), L("El domicilio no coincide con el del DNI: revisar domicilio fiscal.", "Address differs from the one on the DNI: check the tax address.", "El domicili no coincidix amb el del DNI: revisar el domicili fiscal."),
    L("Domicilio distinto al del DNI", "Address differs from the DNI", "Domicili diferent del DNI"), L("Revisar el domicilio fiscal.", "Check the tax address.", "Revisar el domicili fiscal."));
  if (t("autonomo") === "si" && t("auto_paga") === "yo") add("info", ans("trabajo"), L("Autónomo que paga sus propias cuotas: incluirlas como gasto.", "Self-employed and pays own contributions: include them as an expense.", "Autònom que paga les seues quotes: incloure-les com a despesa."),
    L("Autónomo que paga sus cuotas", "Self-employed, pays own contributions", "Autònom que paga les seues quotes"), L("Incluir las cuotas como gasto.", "Include them as an expense.", "Incloure les quotes com a despesa."));
  if (t("tiene_inm") === "si")
    asItems(a.inm).forEach((i, k) => {
      if (asText(i.alquilado) !== "si") return;
      const n = asText(i.dir);
      const ne = n || `Property ${k + 1}`;
      const ns = n || `Inmueble ${k + 1}`;
      const nv = n || `Immoble ${k + 1}`;
      if (!asFiles(i.doc_contrato).length) add("warn", doc("inmuebles"), L(`${ns}: falta el contrato de alquiler.`, `${ne}: rental contract missing.`, `${nv}: falta el contracte de lloguer.`),
        L("Falta el contrato de alquiler", "Rental contract missing", "Falta el contracte de lloguer"), L(ns, ne, nv));
      if (asText(i.g_rep) === "si" && !asFiles(i.doc_rep).length)
        add("bad", doc("inmuebles"), L(`${ns}: faltan las facturas de reparaciones (NIF/CIF y razón social del proveedor).`, `${ne}: repair invoices missing (supplier’s NIF/CIF and company name).`, `${nv}: falten les factures de reparacions (NIF/CIF i raó social del proveïdor).`),
          L("Faltan las facturas de reparaciones", "Repair invoices missing", "Falten les factures de reparacions"),
          L(join(ns, "Con NIF/CIF y razón social del proveedor."), join(ne, "With the supplier’s NIF/CIF and company name."), join(nv, "Amb NIF/CIF i raó social del proveïdor.")));
      if (asText(i.g_mob) === "si" && !asFiles(i.doc_mob).length)
        add("bad", doc("inmuebles"), L(`${ns}: faltan las facturas del equipamiento para amortizar.`, `${ne}: equipment invoices missing for depreciation.`, `${nv}: falten les factures de l'equipament per a amortitzar.`),
          L("Faltan las facturas del equipamiento", "Equipment invoices missing", "Falten les factures de l'equipament"),
          L(join(ns, "Para amortizar."), join(ne, "Needed for depreciation."), join(nv, "Per a amortitzar.")));
      if (asText(i.vinculado) === "si") {
        const v = asText(i.vinc_cual);
        add("info", ans("inmuebles"), L(`${ns}: declarar en el mismo apartado que ${v || "el inmueble vinculado"}.`, `${ne}: declare in the same section as ${v || "the linked property"}.`, `${nv}: declarar en el mateix apartat que ${v || "l'immoble vinculat"}.`),
          L("Inmueble vinculado", "Linked property", "Immoble vinculat"),
          L(join(ns, `Declarar en el mismo apartado que ${v || "el inmueble vinculado"}.`), join(ne, `Declare in the same section as ${v || "the linked property"}.`), join(nv, `Declarar en el mateix apartat que ${v || "l'immoble vinculat"}.`)));
      }
    });
  if (t("actividad") === "si") {
    const c = asFiles(a.doc_130).length;
    if (c < 4) add("warn", doc("actividad-economica"), L(`Actividad: hay ${c} de 4 Modelos 130 subidos.`, `Self-employment: ${c} of 4 Modelo 130 forms uploaded.`, `Activitat: hi ha ${c} de 4 Models 130 pujats.`),
      L("Faltan Modelos 130", "Modelo 130 forms missing", "Falten Models 130"), L(`${c} de 4 subidos.`, `${c} of 4 uploaded.`, `${c} de 4 pujats.`));
  }
  if (t("acciones") === "si" && asItems(a.acc).some((x) => !asText(x.fecha) || !asText(x.precio)))
    add("warn", ans("ventas-y-ganancias"), L("Acciones: falta la fecha o el precio de compra de algún valor.", "Shares: purchase date or price missing for a holding.", "Accions: falta la data o el preu de compra d'algun valor."),
      L("Acciones sin fecha o precio de compra", "Shares without purchase date or price", "Accions sense data o preu de compra"), L("Falta en algún valor.", "Missing for at least one holding.", "Falta en algun valor."));
  if (t("alq_viv") === "si" && !t("alq_renta")) add("warn", ans("deducciones"), L("Alquiler de vivienda habitual: falta la renta que paga actualmente.", "Rented main home: current monthly rent missing.", "Lloguer de l'habitatge habitual: falta la renda que paga actualment."),
    L("Falta la renta del alquiler", "Rent amount missing", "Falta la renda del lloguer"), L("Vivienda habitual de alquiler: la renta mensual actual.", "Rented main home: the current monthly rent.", "Habitatge habitual de lloguer: la renda mensual actual."));

  const order: Record<AlertLevel, number> = { bad: 0, warn: 1, info: 2 };
  return r.sort((x, y) => order[x.level] - order[y.level]);
}
