import { EJERCICIO } from "@/lib/questionnaire/schema";
import type { Answers, FileRef } from "@/lib/questionnaire/types";
import type { Appointment, Expediente, Firm } from "./types";

const doc = (name: string): FileRef => ({
  id: "ex-" + name,
  name,
  size: 0,
  type: name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
  example: true,
});

const base = { ejercicio: EJERCICIO, notes: "", clientSeen: "", gestorSeen: "", example: true } as const;

/** The three example cases from the Beta prototype. */
const TEMPLATES: Expediente[] = [
  {
    ...base,
    id: "ex-sonia",
    status: "borrador",
    sentAt: null,
    createdAt: "2026-10-27T09:00:00",
    updatedAt: "2026-10-27T09:05:00",
    chat: [{ id: "m1", from: "gestor", text: "Hola, Sonia. Cuando termine el cuestionario pulse «Enviar a la gestoría». Si tiene cualquier duda, escríbanos por aquí.", at: "2026-10-27T09:05:00" }],
    answers: {
      nombre: "Sonia Martínez Soler", telefono: "654 210 987", email: "sonia.martinez@example.com",
      doc_dni: [doc("dni_sonia_frontal.jpg"), doc("dni_sonia_trasera.jpg")], doc_libro: [doc("libro_familia.jpg")], doc_padron: [doc("volante_empadronamiento.pdf")],
      padron_coincide: "si",
      miembros: [
        { nombre: "Sonia Martínez Soler", parentesco: "Titular", nacimiento: "1986-11-02" },
        { nombre: "Hugo Gómez Martínez", parentesco: "Hijo/a", nacimiento: "2024-02-19" },
      ],
      discapacidad: "no", titulo: "monoparental", tit_num: "46/2025/001234", tit_conc: "2025-03-10", tit_vig: "2027-03-10", tit_cat: "General", doc_titulo: [doc("titulo_monoparental.jpg")],
      progenitor: "si", prog_nombre: "Daniel Gómez Ibáñez", prog_hijos: "Hugo",
      fallecimiento: "no", hijo8000: "no", matern: "si", anticipada: "na", asig: "ambas",
    },
  },
  {
    ...base,
    id: "ex-javier",
    status: "enviado",
    sentAt: "2026-10-20T10:12:00",
    createdAt: "2026-10-18T17:30:00",
    updatedAt: "2026-10-21T12:40:00",
    notes: "Revisar si Ana presenta declaración propia.",
    chat: [
      { id: "m1", from: "cliente", text: "He subido todo menos las facturas de la reparación del baño, las tengo en papel.", at: "2026-10-20T10:14:00" },
      { id: "m2", from: "gestor", text: "Gracias, Javier. Hágales una foto y súbalas en el inmueble de Av. del Port: necesitamos el CIF del fontanero.", at: "2026-10-21T12:40:00" },
    ],
    gestorSeen: "2026-10-20T10:14:00",
    answers: {
      nombre: "Javier Ortega Lluch", telefono: "612 345 781", email: "j.ortega@example.com",
      doc_dni: [doc("dni_javier.jpg"), doc("dni_ana.jpg")], doc_libro: [doc("libro_familia.jpg")], doc_m100: [doc("renta_2025.pdf")], doc_padron: [doc("padron.pdf")],
      padron_coincide: "si",
      miembros: [
        { nombre: "Javier Ortega Lluch", parentesco: "Titular", nacimiento: "1978-03-14" },
        { nombre: "Ana Ortega Ruiz", parentesco: "Hijo/a", nacimiento: "2005-06-02" },
      ],
      discapacidad: "no", titulo: "no", progenitor: "si", prog_nombre: "Elena Ruiz Pastor", prog_hijos: "Ana",
      fallecimiento: "no", hijo8000: "si", h8_nombre: "Ana Ortega Ruiz", h8_importe: "9.400", matern: "na", anticipada: "na", asig: "social",
      cuota: "no", defensa: "no", autonomo: "no", tiene_inm: "si",
      inm: [
        { dir: "C/ de Sueca 41, 3º, 46006 València", habitual: "si", tit: "pleno", pct: "100", alquilado: "no" },
        {
          dir: "Av. del Port 112, 5ª, 46023 València", habitual: "no", tit: "pleno", pct: "100", alquilado: "si", doc_contrato: [doc("contrato_alquiler.pdf")],
          inq: "Pau Sanchis Mora", inicio: "2023-09-01", renta: "850", meses: "12", g_com: "540", g_ibi: "412", g_seg: "186", g_form: "no",
          g_rep: "si", g_rep_imp: "1.320", doc_rep: [], g_mob: "no", adq: "compra", adq_fecha: "2011-04-18", adq_precio: "168.000", vinculado: "si", vinc_cual: "Plaza de garaje nº 14",
        },
      ],
      actividad: "no", venta_inm: "no", cripto: "no", acciones: "si", acc: [{ valor: "Iberdrola", num: "200", fecha: "2019-05-10", precio: "" }], otras: "no",
      gym: "si", gym_imp: "420", dentista: "si", dentista_imp: "1.150", optica: "no", mental: "no", musica: "no", vehiculo: "no", alq_viv: "no", placas: "no",
      obs: "Las facturas de la reparación del baño del piso de Av. del Port las tengo en papel.",
    },
  },
  {
    ...base,
    id: "ex-marta",
    status: "borrador",
    sentAt: null,
    createdAt: "2026-10-22T11:00:00",
    updatedAt: "2026-10-24T18:02:00",
    chat: [{ id: "m1", from: "cliente", text: "Me faltan los 130 del tercer y cuarto trimestre, mi asesor de la actividad me los manda esta semana.", at: "2026-10-24T18:02:00" }],
    answers: {
      nombre: "Marta Ferrer Gil", telefono: "677 902 314", email: "marta.ferrer@example.com",
      doc_dni: [doc("dni_familia.jpg")], doc_padron: [doc("padron_sueca.pdf")],
      padron_coincide: "no", direccion: "C/ Major 8, 2º, 46410 Sueca",
      miembros: [
        { nombre: "Marta Ferrer Gil", parentesco: "Titular", nacimiento: "1972-09-30" },
        { nombre: "Jordi Pons Ferrer", parentesco: "Hijo/a", nacimiento: "2004-01-12" },
        { nombre: "Pau Pons Ferrer", parentesco: "Hijo/a", nacimiento: "2007-05-03" },
        { nombre: "Clara Pons Ferrer", parentesco: "Hijo/a", nacimiento: "2010-07-25" },
      ],
      discapacidad: "no", titulo: "numerosa", tit_num: "46/2016/004517", tit_conc: "2016-05-12", tit_vig: "2026-07-25", tit_cat: "General", doc_titulo: [doc("titulo_fn.jpg")],
      progenitor: "no", fallecimiento: "no", hijo8000: "si", h8_nombre: "Jordi Pons Ferrer", h8_importe: "11.200", matern: "na", anticipada: "si", asig: "iglesia",
      cuota: "si", cuota_ent: "Colegio de Economistas de Valencia", cuota_imp: "210", defensa: "no", autonomo: "si", auto_paga: "yo", tiene_inm: "no",
      actividad: "si", doc_ling: [doc("libro_ingresos_2026.pdf")], doc_lgas: [doc("libro_gastos_2026.pdf")], doc_130: [doc("130_1T.pdf"), doc("130_2T.pdf")],
    },
  },
];

/** The demo gestoría. Fictional; edit it in Ajustes. */
/*
 * More example cases, so the gestoría panel can be tried with a realistic
 * volume (sitemap G2: example cases so a new gestoría can try the panel).
 * Fictional people built from the three prototype cases, with varied status,
 * progress, accountant, unread messages, requests, appointments and payments.
 * All marked as examples; emails use the reserved example.com domain and no
 * phone numbers are invented.
 */
type Spec = {
  id: string;
  name: string;
  from: "ex-sonia" | "ex-javier" | "ex-marta";
  status: Expediente["status"];
  day: number;
  assignee?: string;
  /** "min": only name, email and ID; "part": drops the later sections. */
  fill?: "full" | "part" | "min";
  msg?: { from: "cliente" | "gestor"; text: string; unread?: boolean };
  task?: string;
  appointment?: Appointment["kind"];
  paid?: number;
};

const SPECS: Spec[] = [
  { id: "ex-lucia", name: "Lucía Navarro Bosch", from: "ex-sonia", status: "borrador", day: 29, assignee: "u-ex-hector", fill: "part" },
  { id: "ex-andres", name: "Andrés Climent Roig", from: "ex-javier", status: "enviado", day: 28, msg: { from: "cliente", text: "Ya lo he enviado todo. ¿Me confirman que les ha llegado?", unread: true } },
  { id: "ex-carmen", name: "Carmen Vidal Esteve", from: "ex-marta", status: "revision", day: 26, assignee: "u-titular", task: "Suba el modelo 130 del tercer trimestre." },
  { id: "ex-pablo", name: "Pablo Sanchis Ferrer", from: "ex-javier", status: "listo", day: 19, assignee: "u-ex-paula", paid: 120 },
  { id: "ex-elena", name: "Elena Martí Soler", from: "ex-sonia", status: "borrador", day: 25, fill: "part", task: "Suba el título de familia monoparental vigente." },
  { id: "ex-david", name: "David Ribes Camps", from: "ex-javier", status: "revision", day: 27, assignee: "u-ex-hector", msg: { from: "cliente", text: "¿Necesitan algo más del piso alquilado?", unread: true } },
  { id: "ex-nuria", name: "Nuria Peris Lloret", from: "ex-marta", status: "enviado", day: 24, assignee: "u-ex-paula" },
  { id: "ex-sergio", name: "Sergio Alonso Vera", from: "ex-sonia", status: "borrador", day: 30, fill: "min" },
  { id: "ex-irene", name: "Irene Folch Mestre", from: "ex-javier", status: "listo", day: 17, assignee: "u-titular", paid: 150 },
  { id: "ex-raul", name: "Raúl Domingo Sales", from: "ex-marta", status: "borrador", day: 23, fill: "part", appointment: "llamada" },
  { id: "ex-marc", name: "Marc Torres Albert", from: "ex-javier", status: "enviado", day: 29, msg: { from: "cliente", text: "Les adjunto en el cuestionario el contrato nuevo del inquilino.", unread: true } },
  { id: "ex-beatriz", name: "Beatriz Moll Pardo", from: "ex-sonia", status: "revision", day: 22, assignee: "u-ex-paula", msg: { from: "gestor", text: "Beatriz, estamos revisando la deducción por maternidad. Le escribimos si falta algo." } },
  { id: "ex-oscar", name: "Óscar Llopis Gimeno", from: "ex-marta", status: "borrador", day: 21, assignee: "u-ex-hector", fill: "part", task: "Indique la cuota del colegio profesional pagada en el año." },
  { id: "ex-rosa", name: "Rosa Cabedo Ibáñez", from: "ex-javier", status: "listo", day: 15, assignee: "u-ex-hector", paid: 135 },
  { id: "ex-victor", name: "Víctor Mira Ortells", from: "ex-sonia", status: "enviado", day: 27, appointment: "presencial" },
  { id: "ex-alba", name: "Alba Romero Puig", from: "ex-marta", status: "revision", day: 20, assignee: "u-titular" },
  { id: "ex-joan", name: "Joan Ferrando Bellver", from: "ex-javier", status: "borrador", day: 28, fill: "part" },
];

/** Sections dropped from a "part" case: the later ones, so it reads as half done. */
const LATER = ["cuota", "cuota_ent", "cuota_imp", "defensa", "autonomo", "auto_paga", "tiene_inm", "inm", "actividad", "doc_ling", "doc_lgas", "doc_130", "venta_inm", "cripto", "acciones", "acc", "otras", "gym", "gym_imp", "dentista", "dentista_imp", "optica", "mental", "musica", "vehiculo", "alq_viv", "placas", "obs"];
const at = (day: number, hm: string) => `2026-10-${String(day).padStart(2, "0")}T${hm}:00`;

function build(x: Spec): Expediente {
  const tpl = TEMPLATES.find((e) => e.id === x.from)!;
  const [first, last] = x.name.split(" ").map((w) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const email = `${first}.${last}@example.com`;
  let answers: Expediente["answers"] = structuredClone(tpl.answers);
  delete answers.telefono;
  answers.nombre = x.name;
  answers.email = email;
  const members = answers.miembros as Answers[] | undefined;
  if (members?.length) answers.miembros = members.map((m, i) => (i === 0 ? { ...m, nombre: x.name } : m));
  if (x.fill === "part") LATER.forEach((k) => delete answers[k]);
  // Ready to file: nothing missing any more (the repair invoices from the template are in).
  if (x.status === "listo" && Array.isArray(answers.inm)) answers.inm = (answers.inm as Answers[]).map((h) => (Array.isArray(h.doc_rep) ? { ...h, doc_rep: [doc("facturas_reparacion.pdf")] } : h));
  if (x.fill === "min") answers = { nombre: x.name, email, doc_dni: [doc(`dni_${first}.jpg`)] };
  const created = at(Math.max(1, x.day - 3), "10:00");
  const updated = at(x.day, "17:20");
  const sent = x.status !== "borrador";
  const chat: Expediente["chat"] = x.msg ? [{ id: "m1", from: x.msg.from, text: x.msg.text, at: updated }] : [];
  return {
    ...base,
    id: x.id,
    status: x.status,
    sentAt: sent ? at(x.day, "12:00") : null,
    createdAt: created,
    updatedAt: updated,
    acceptedAt: created,
    identityConfirmedAt: created,
    assignee: x.assignee ?? null,
    answers,
    chat,
    // read by the other side, unless the message is meant to show as unread
    gestorSeen: x.msg?.from === "cliente" && !x.msg.unread ? updated : "",
    clientSeen: x.msg?.from === "gestor" ? updated : "",
    ...(x.task ? { tasks: [{ id: "t1", text: { es: x.task, en: x.task }, target: null, createdAt: at(x.day, "09:30") }] } : {}),
    ...(x.appointment ? { appointments: [{ id: "ap1", kind: x.appointment, date: "2026-11-06", slot: "manana" as const, note: "", status: "solicitada" as const, createdAt: at(x.day, "11:00") }] } : {}),
    ...(x.paid ? { payment: { amount: x.paid, status: "pagado" as const, paidAt: at(x.day, "16:00"), method: "simulado" as const } } : {}),
  };
}

/** Prototype cases first, then the generated ones. */
export const EXAMPLES: Expediente[] = [...TEMPLATES, ...SPECS.map(build)];

/** Bump when example cases or members are added, so browsers with saved data get the new ones once. */
export const EXAMPLES_REV = 3;

export const EXAMPLE_FIRM: Firm = {
  name: "Gestoría Turia",
  cif: "",
  address: "València",
  phone: "",
  email: "",
  logo: null,
  docs: { privacy: null, mandate: null },
  team: [
    { id: "u-titular", name: "Laura Navarro Puig", email: "laura@gestoriaturia.example", role: "titular" },
    { id: "u-ex-hector", name: "Héctor Sala Vives", email: "hector@gestoriaturia.example", role: "gestor" },
    { id: "u-ex-paula", name: "Paula Ferrandis Roca", email: "paula@gestoriaturia.example", role: "gestor" },
  ],
  fees: { base: "", perProperty: "", selfEmployed: "", notes: "" },
};
