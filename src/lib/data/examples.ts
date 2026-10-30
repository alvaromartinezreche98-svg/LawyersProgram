import { EJERCICIO } from "@/lib/questionnaire/schema";
import type { FileRef } from "@/lib/questionnaire/types";
import type { Expediente, Firm } from "./types";

const doc = (name: string): FileRef => ({
  id: "ex-" + name,
  name,
  size: 0,
  type: name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
  example: true,
});

const base = { ejercicio: EJERCICIO, notes: "", clientSeen: "", gestorSeen: "", example: true } as const;

/** The three example cases from the Beta prototype. */
export const EXAMPLES: Expediente[] = [
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
export const EXAMPLE_FIRM: Firm = {
  name: "Gestoría Turia",
  cif: "",
  address: "València",
  phone: "",
  email: "",
  logo: null,
  docs: { privacy: null, mandate: null },
  team: [{ id: "u-titular", name: "Laura Navarro Puig", email: "laura@gestoriaturia.example", role: "titular" }],
  fees: { base: "", perProperty: "", selfEmployed: "", notes: "" },
};
