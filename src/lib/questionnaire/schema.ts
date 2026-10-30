import { L, type Text } from "@/lib/i18n";
import { FEATURES } from "@/lib/features";
import type { Choice, Field, FieldType, Section } from "./types";

/** Tax year the questionnaire is built for. */
export const EJERCICIO = 2026;

const f = (type: FieldType, id: string, label: Text, o: Partial<Field> = {}): Field => ({ type, id, label, ...o });
const gasto = (id: string, label: Text) => f("yn", id, label, { kids: [f("money", id + "_imp", L("Importe total anual", "Total yearly amount"))] });
/** Select options whose stored value is the Spanish label. */
const opts = (...o: [string, string][]): Choice[] => o.map(([es, en]) => [es, L(es, en)] as const);
const SI_NO_NA: Choice[] = [["si", L("Sí", "Yes")], ["no", L("No", "No")], ["na", L("No aplica", "Not applicable")]];

/** The Renta questionnaire, as defined in the PreRenta Beta prototype. Stored values stay in Spanish. */
export const SCHEMA: Section[] = [
  {
    id: "personales", slug: "datos-personales", title: L("Datos personales", "Personal details"), short: L("Datos personales", "Personal details"),
    intro: L("Empezamos por usted. Para los documentos basta una foto legible hecha con el móvil.", "Let’s start with you. For documents, a clear photo taken with your phone is enough."),
    fields: [
      f("text", "nombre", L("Nombre y apellidos", "Full name"), { ac: "name" }),
      f("tel", "telefono", L("Teléfono", "Phone"), { ac: "tel" }),
      f("email", "email", L("Correo electrónico", "Email"), { ac: "email" }),
      f("upload", "doc_dni", L("DNI/NIE de todos los miembros de la unidad familiar", "DNI/NIE of every member of the household"), { help: L("Ambas caras. Puede subir varias fotos a la vez.", "Both sides. You can upload several photos at once.") }),
      f("upload", "doc_libro", L("Libro(s) de familia", "Family book(s) (Libro de familia)")),
      f("upload", "doc_m100", L("Declaración de la renta del año anterior (Modelo 100)", "Last year’s tax return (Modelo 100)"), { opt: true, help: L("Solo si la presentó.", "Only if you filed one.") }),
      f("upload", "doc_padron", L("Certificado o volante de empadronamiento", "Certificate of registration at your address (empadronamiento)")),
      f("yn", "padron_coincide", L("¿Su domicilio de empadronamiento coincide con el que figura en su DNI?", "Does your registered address match the one on your DNI/NIE?"), {
        when: ["no"],
        kids: [f("text", "direccion", L("Dirección correcta", "Correct address"), { help: L("Calle, número, piso, código postal y municipio.", "Street, number, floor, postcode and town.") })],
      }),
    ],
  },
  {
    id: "familia", slug: "unidad-familiar", title: L("Unidad familiar", "Household"), short: L("Unidad familiar", "Household"),
    intro: L("Indique todas las personas que forman su unidad familiar y su situación durante el año.", "List everyone in your household and their situation during the year."),
    fields: [
      f("repeat", "miembros", L("Miembros de la unidad familiar", "Household members"), { group: { title: L("Quién vive con usted", "Who lives with you", "Qui viu amb vosté"), why: L("Las personas de su unidad familiar durante el año.", "The people in your household during the year.", "Les persones de la seua unitat familiar durant l'any.") },
        item: L("Miembro", "Member"),
        fields: [
          f("text", "nombre", L("Nombre y apellidos", "Full name")),
          f("select", "parentesco", L("Parentesco", "Relationship"), { choices: opts(["Titular", "Taxpayer"], ["Cónyuge / pareja", "Spouse / partner"], ["Hijo/a", "Child"], ["Ascendiente", "Parent or grandparent"], ["Otro", "Other"]) }),
          f("date", "nacimiento", L("Fecha de nacimiento", "Date of birth")),
          f("text", "dni", L("DNI/NIE", "DNI/NIE"), { opt: true, mono: true }),
        ],
      }),
      f("yn", "discapacidad", L("¿Algún miembro tiene reconocida una discapacidad?", "Does any member have an officially recognised disability?"), { group: { title: L("Situaciones especiales", "Special circumstances", "Situacions especials"), why: L("Pueden dar derecho a mínimos y deducciones.", "They can entitle you to allowances and deductions.", "Poden donar dret a mínims i deduccions.") },
        kids: [f("text", "disc_quien", L("¿Quién?", "Who?")), f("upload", "doc_disc", L("Certificado de discapacidad", "Disability certificate"))],
      }),
      f("choice", "titulo", L("¿Tiene título de familia numerosa o de familia monoparental?", "Do you hold a large-family or single-parent family certificate?"), {
        choices: [["no", L("No", "No")], ["numerosa", L("Familia numerosa", "Large family")], ["monoparental", L("Familia monoparental", "Single-parent family")]],
        when: ["numerosa", "monoparental"],
        kids: [
          f("text", "tit_num", L("Número del título", "Certificate number"), { mono: true }),
          f("date", "tit_conc", L("Fecha de concesión", "Date issued")),
          f("date", "tit_vig", L("Fecha de vigencia (caducidad)", "Valid until (expiry date)")),
          f("select", "tit_cat", L("Categoría", "Category"), { choices: opts(["General", "General"], ["Especial", "Special"]) }),
          f("upload", "doc_titulo", L("Título de familia numerosa o monoparental", "Large-family or single-parent certificate")),
        ],
      }),
      f("yn", "progenitor", L("¿Tiene hijos con una persona con la que ya no convive?", "Do you have children with someone you no longer live with?"), { group: { title: L("Cambios en la familia", "Changes in the family", "Canvis en la família"), why: L("Separaciones, divorcios y fallecimientos cambian cómo se declara.", "Separations, divorces and deaths change how the return is filed.", "Les separacions, els divorcis i les defuncions canvien com es declara.") },
        help: L("Por separación, divorcio, viudedad o porque ahora tiene otra pareja.", "Because of separation, divorce, widowhood or because you now have another partner."),
        kids: [
          f("text", "prog_nombre", L("Nombre y apellidos del otro progenitor", "Other parent’s full name")),
          f("text", "prog_dni", L("DNI/NIE del otro progenitor", "Other parent’s DNI/NIE"), { mono: true, help: L("Basta con el número; no hace falta subir su DNI.", "The number is enough; there is no need to upload their ID.") }),
          f("text", "prog_hijos", L("Hijos en común", "Children in common")),
        ],
      }),
      f("yn", "divorcio", L("¿Se ha divorciado o separado legalmente durante el año?", "Did you divorce or legally separate during the year?"), {
        kids: [
          f("date", "div_fecha", L("Fecha de la sentencia o decreto de divorcio", "Date of the divorce ruling or decree")),
          f("upload", "doc_liquidacion", L("Escritura de liquidación del régimen económico matrimonial", "Deed settling the marital property regime"), {
            help: L(
              "Si estaban en gananciales, la escritura de liquidación de la sociedad de gananciales. Si la liquidación se hizo en el convenio regulador, suba el convenio.",
              "If you had joint marital property (gananciales), the deed that settles it. If it was settled in the divorce agreement (convenio regulador), upload the agreement.",
            ),
          }),
        ],
      }),
      f("yn", "fallecimiento", L("¿Ha fallecido algún miembro de la unidad familiar durante el año?", "Did any household member pass away during the year?"), {
        kids: [f("text", "fall_nombre", L("Nombre", "Name")), f("date", "fall_fecha", L("Fecha de fallecimiento", "Date of death"))],
      }),
      f("yn", "hijo8000", L("¿Algún hijo ha trabajado o ha ganado más de 8.000 € en el año?", "Did any child work or earn more than €8,000 during the year?"), { group: { title: L("Hijos y deducciones cobradas", "Children and deductions received", "Fills i deduccions cobrades"), why: L("Para no aplicar dos veces lo que ya ha cobrado.", "So that what you already received is not applied twice.", "Per a no aplicar dues vegades el que ja ha cobrat.") },
        help: L("Si es así, no puede incluirse en su declaración. Si se incluye, Hacienda suele enviar después un requerimiento.", "If so, they cannot be included in your return. If they are, the tax office (Hacienda) usually sends a formal request later."),
        kids: [f("text", "h8_nombre", L("Nombre del hijo/a", "Child’s name")), f("money", "h8_importe", L("Importe aproximado ganado", "Approximate amount earned"))],
      }),
      f("choice", "matern", L("Si es madre de hijos menores de 3 años: ¿ha cobrado por adelantado la deducción por maternidad (hasta 1.200 €/año)?", "If you are a mother of children under 3: have you received the maternity deduction in advance (up to €1,200/year)?"), { choices: SI_NO_NA }),
      f("choice", "anticipada", L("Si hay alguna persona con discapacidad o es familia numerosa: ¿ha cobrado por adelantado la deducción correspondiente?", "If someone has a disability or you are a large family: have you received that deduction in advance?"), { choices: SI_NO_NA }),
    ],
  },
  {
    id: "asignacion", slug: "asignacion-tributaria", title: L("Asignación tributaria", "Tax allocation"), short: L("Asignación tributaria", "Tax allocation"),
    intro: L("Marcar una opción no le hace pagar más ni le devuelven menos: solo decide a qué se destina el 0,7 % de su cuota.", "Ticking an option does not make you pay more or get less back: it only decides where 0.7% of your tax goes."),
    fields: [
      f("choice", "asig", L("¿A qué fines quiere destinar su asignación tributaria?", "Where would you like your tax allocation to go?"), {
        choices: [["iglesia", L("Iglesia Católica", "Catholic Church")], ["social", L("Otros fines sociales", "Other social purposes")], ["ambas", L("Ambas", "Both")], ["ninguna", L("Ninguna", "Neither")]],
      }),
    ],
  },
  {
    id: "trabajo", slug: "trabajo", title: L("Trabajo", "Employment"), short: L("Trabajo", "Employment"),
    intro: L("Sus nóminas y retenciones ya figuran en los datos fiscales de Hacienda. Aquí solo preguntamos los gastos que no aparecen.", "Your payslips and tax withheld already appear in your tax data from Hacienda. Here we only ask about expenses that don’t."),
    fields: [
      f("yn", "cuota", L("¿Paga alguna cuota sindical o de colegio profesional?", "Do you pay trade-union or professional-association fees?"), {
        kids: [f("text", "cuota_ent", L("Sindicato o colegio", "Union or association")), f("money", "cuota_imp", L("Importe anual", "Yearly amount"))],
      }),
      f("yn", "defensa", L("¿Ha tenido gastos de abogado por un juicio relacionado con su trabajo?", "Did you pay a lawyer for a court case related to your job?"), {
        help: L("Por ejemplo, una demanda contra la empresa.", "For example, a claim against your employer."),
        kids: [f("money", "def_imp", L("Importe total", "Total amount")), f("upload", "doc_def", L("Factura del abogado", "Lawyer’s invoice"))],
      }),
      f("yn", "autonomo", L("¿Es usted autónomo (incluido autónomo colaborador o socio de una sociedad)?", "Are you self-employed (autónomo), including as a family collaborator or company partner?"), {
        kids: [f("choice", "auto_paga", L("¿Quién paga sus cuotas de autónomo?", "Who pays your self-employed contributions?"), { choices: [["yo", L("Las pago yo", "I do")], ["sociedad", L("Las paga la sociedad", "The company does")]] })],
      }),
    ],
  },
  {
    id: "inmuebles", slug: "inmuebles", title: L("Inmuebles", "Property"), short: L("Inmuebles", "Property"),
    intro: L("Añada cada inmueble del que sea propietario, aunque sea en parte: vivienda, local, parking o trastero, esté alquilado o no.", "Add every property you own, even partly: home, commercial premises, parking space or storage room, rented out or not."),
    fields: [
      f("yn", "tiene_inm", L("¿Es propietario, total o parcialmente, de algún inmueble?", "Do you fully or partly own any property?"), {
        kids: [
          f("repeat", "inm", L("Inmuebles", "Properties"), {
            item: L("Inmueble", "Property"),
            fields: [
              f("text", "dir", L("Dirección completa", "Full address"), { group: { title: L("Datos del inmueble", "Property details", "Dades de l'immoble"), why: L("Dónde está y qué parte es suya.", "Where it is and how much of it is yours.", "On és i quina part és seua.") } }),
              f("yn", "habitual", L("¿Es su vivienda habitual?", "Is it your main home?")),
              f("choice", "tit", L("Tipo de titularidad", "Type of ownership"), { choices: [["pleno", L("Pleno dominio", "Full ownership")], ["usufructo", L("Usufructo", "Usufruct (right of use)")], ["nuda", L("Nuda propiedad", "Bare ownership")]] }),
              f("pct", "pct", L("Porcentaje de titularidad", "Ownership share"), { help: L("Por ejemplo 100 %, 50 % o 75 %.", "For example 100%, 50% or 75%.") }),
              f("text", "otros", L("Otros titulares y su porcentaje", "Other owners and their share"), { opt: true }),
              f("yn", "alquilado", L("¿Está alquilado?", "Is it rented out?"), { group: { title: L("Alquiler", "Renting", "Lloguer"), why: L("Si lo alquila, la renta y el contrato.", "If you rent it out, the rent and the contract.", "Si el lloga, la renda i el contracte.") },
                kids: [
                  f("upload", "doc_contrato", L("Contrato de alquiler", "Rental contract")),
                  f("text", "inq", L("Nombre y DNI/NIF del inquilino", "Tenant’s name and DNI/NIF")),
                  f("date", "inicio", L("Fecha de inicio del contrato", "Contract start date")),
                  f("money", "renta", L("Renta mensual que cobra actualmente", "Monthly rent you currently receive")),
                  f("number", "meses", L("Meses alquilado durante el año", "Months rented out during the year"), { unit: L("meses", "months") }),
                  f("money", "g_com", L("Gastos de comunidad (anual)", "Community fees (yearly)"), { group: { title: L("Gastos del año", "Expenses for the year", "Despeses de l'any"), why: L("Indique el importe anual de cada gasto.", "Give the yearly amount of each expense.", "Indique l'import anual de cada despesa.") } }),
                  f("money", "g_ibi", L("IBI (anual)", "IBI property tax (yearly)")),
                  f("money", "g_seg", L("Seguro(s) del inmueble (anual)", "Property insurance (yearly)")),
                  f("yn", "g_form", L("¿Firmó el contrato este año y tuvo gastos de formalización?", "Did you sign the contract this year and pay costs to arrange it?"), {
                    kids: [f("money", "g_form_imp", L("Importe", "Amount")), f("upload", "doc_form", L("Factura", "Invoice"))],
                  }),
                  f("yn", "g_rep", L("¿Ha hecho reparaciones o trabajos de conservación?", "Did you carry out repairs or maintenance work?"), {
                    kids: [
                      f("money", "g_rep_imp", L("Importe total", "Total amount")),
                      f("upload", "doc_rep", L("Facturas de las reparaciones", "Repair invoices"), { help: L("Imprescindibles: hay que indicar a Hacienda el NIF/CIF y la razón social de quien hizo la reparación.", "Required: Hacienda must be given the tax ID (NIF/CIF) and company name of whoever did the repair.") }),
                    ],
                  }),
                  f("yn", "g_mob", L("¿Ha comprado muebles, electrodomésticos u otro equipamiento para el inmueble?", "Did you buy furniture, appliances or other equipment for the property?"), {
                    kids: [
                      f("money", "g_mob_imp", L("Importe total", "Total amount")),
                      f("upload", "doc_mob", L("Facturas del equipamiento", "Equipment invoices"), { help: L("Se necesitan para calcular su amortización.", "Needed to calculate depreciation.") }),
                    ],
                  }),
                  f("choice", "adq", L("¿Cómo adquirió el inmueble?", "How did you acquire the property?"), { group: { title: L("Adquisición", "Acquisition", "Adquisició"), why: L("Cómo y cuándo lo adquirió.", "How and when you acquired it.", "Com i quan el va adquirir.") }, choices: [["compra", L("Compra", "Purchase")], ["herencia", L("Herencia", "Inheritance")], ["donacion", L("Donación", "Gift")]] }),
                  f("date", "adq_fecha", L("Fecha de adquisición", "Date acquired")),
                  f("money", "adq_precio", L("Precio de compra o valor declarado en la herencia", "Purchase price or value declared in the inheritance")),
                  f("yn", "vinculado", L("¿Hay un parking o trastero que se alquila junto con este inmueble?", "Is a parking space or storage room rented out together with this property?"), { group: { title: L("Parking o trastero", "Parking space or storage room", "Pàrquing o traster"), why: L("Si se alquila junto con este inmueble.", "If it is rented out together with this property.", "Si es lloga juntament amb este immoble.") },
                    kids: [f("text", "vinc_cual", L("¿Cuál?", "Which one?"), { help: L("Añádalo también como inmueble en esta lista.", "Add it to this list as a property too.") })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: "actividad", slug: "actividad-economica", title: L("Actividad económica", "Self-employment"), short: L("Actividad económica", "Self-employment"),
    intro: L("Solo para quienes trabajan como autónomos con actividad propia.", "Only for those who work self-employed with their own business."),
    fields: [
      f("yn", "actividad", L("¿Ha ejercido una actividad económica como autónomo durante el año?", "Did you run a business as self-employed during the year?"), {
        kids: [
          f("upload", "doc_ling", L("Libro registro de ingresos", "Income register")),
          f("upload", "doc_lgas", L("Libro registro de compras y gastos", "Purchases and expenses register")),
          f("upload", "doc_130", L("Modelos 130 de los cuatro trimestres", "Modelo 130 for all four quarters"), { help: L("Suba los cuatro (1T, 2T, 3T y 4T): justifican los pagos fraccionados hechos durante el año.", "Upload all four (Q1–Q4): they prove the advance tax payments made during the year.") }),
        ],
      }),
    ],
  },
  {
    id: "variaciones", slug: "ventas-y-ganancias", title: L("Ventas y ganancias", "Sales and gains"), short: L("Ventas y ganancias", "Sales and gains"),
    intro: L("Ventas de inmuebles, criptomonedas o acciones realizadas durante el año.", "Sales of property, cryptocurrency or shares made during the year."),
    fields: [
      f("yn", "venta_inm", L("¿Ha vendido algún inmueble durante el año?", "Did you sell any property during the year?"), {
        kids: [
          f("upload", "doc_esc_compra", L("Escritura de compra (o de herencia o donación)", "Purchase deed (or inheritance or gift deed)")),
          f("upload", "doc_esc_venta", L("Escritura de venta", "Sale deed")),
          f("upload", "doc_g_compra", L("Gastos de la compra", "Purchase costs"), { help: L("Notaría, registro, gestoría e impuestos pagados.", "Notary, land registry, agency fees and taxes paid.") }),
          f("upload", "doc_g_venta", L("Gastos de la venta", "Sale costs"), { help: L("Notaría, gestoría, certificado del administrador de fincas, plusvalía municipal, inmobiliaria.", "Notary, agency, certificate from the building administrator, municipal capital-gains tax (plusvalía), estate agent.") }),
        ],
      }),
      f("yn", "cripto", L("¿Ha vendido, intercambiado o convertido criptomonedas?", "Did you sell, swap or convert cryptocurrency?"), {
        kids: [f("text", "cripto_plat", L("Plataforma(s) en las que opera", "Platform(s) you use")), f("upload", "doc_cripto", L("Informe fiscal de cada plataforma", "Tax report from each platform"))],
      }),
      f("yn", "acciones", L("¿Ha vendido acciones durante el año?", "Did you sell shares during the year?"), {
        help: L("Hacienda solo nos facilita la fecha y el precio de venta. La compra tiene que indicarla usted.", "Hacienda only gives us the sale date and price. You need to tell us about the purchase."),
        kids: [
          f("repeat", "acc", L("Acciones vendidas", "Shares sold"), {
            item: L("Valor", "Holding"),
            fields: [
              f("text", "valor", L("Empresa o valor", "Company or security")),
              f("number", "num", L("Número de acciones", "Number of shares")),
              f("date", "fecha", L("Fecha de compra", "Purchase date")),
              f("money", "precio", L("Precio total de compra", "Total purchase price")),
            ],
          }),
        ],
      }),
      f("yn", "otras", L("¿Ha tenido otra venta o ganancia (premios, indemnizaciones, venta de otros bienes)?", "Did you have any other sale or gain (prizes, compensation, sale of other assets)?"), {
        kids: [f("textarea", "otras_desc", L("Descríbala brevemente", "Describe it briefly"))],
      }),
    ],
  },
  {
    id: "deducciones", slug: "deducciones", title: L("Deducciones autonómicas", "Regional deductions"), short: L("Deducciones autonómicas", "Regional deductions"),
    intro: L(
      "Para salud, deporte y formación solo necesitamos el importe total del año. No suba las facturas, pero guárdelas: si Hacienda las pide, tendrá que presentarlas usted.",
      "For health, sport and education we only need the year’s total. Don’t upload the invoices, but keep them: if Hacienda asks for them, you will have to provide them.",
    ),
    fields: [
      gasto("gym", L("¿Ha pagado gimnasio o actividad deportiva?", "Did you pay for a gym or sports activity?")),
      gasto("dentista", L("¿Ha tenido gastos de dentista?", "Did you have dental expenses?")),
      gasto("optica", L("¿Ha tenido gastos de óptica (gafas, lentillas)?", "Did you have optician expenses (glasses, contact lenses)?")),
      gasto("mental", L("¿Ha tenido gastos de psicólogo o psiquiatra?", "Did you pay for a psychologist or psychiatrist?")),
      gasto("musica", L("¿Ha pagado formación musical?", "Did you pay for music lessons?")),
      f("yn", "vehiculo", L("¿Ha comprado un vehículo híbrido enchufable o eléctrico?", "Did you buy a plug-in hybrid or electric vehicle?"), {
        kids: [f("upload", "doc_ficha", L("Ficha técnica del vehículo", "Vehicle technical sheet")), f("upload", "doc_fact_veh", L("Factura de compra", "Purchase invoice"))],
      }),
      f("yn", "alq_viv", L("¿Vive de alquiler en su vivienda habitual?", "Do you rent your main home?"), {
        kids: [
          f("upload", "doc_alq_viv", L("Contrato de alquiler", "Rental contract")),
          f("money", "alq_renta", L("Renta mensual que paga actualmente", "Monthly rent you currently pay"), { help: L("Puede ser distinta de la del contrato por las actualizaciones del IPC.", "It may differ from the contract because of inflation (IPC) updates.") }),
        ],
      }),
      f("yn", "placas", L("¿Ha instalado placas solares en su vivienda?", "Did you install solar panels at home?"), {
        kids: [
          f("upload", "doc_cee_pre", L("Certificado energético anterior a la instalación", "Energy certificate from before the installation")),
          f("upload", "doc_cee_post", L("Certificado energético posterior a la instalación", "Energy certificate from after the installation")),
          f("upload", "doc_placas_fact", L("Facturas de la instalación", "Installation invoices")),
          f("upload", "doc_placas_pago", L("Justificantes de pago", "Proof of payment")),
        ],
      }),
    ],
  },
  {
    id: "observaciones", slug: "observaciones", title: L("Observaciones", "Comments"), short: L("Observaciones", "Comments"),
    intro: L("Cualquier cosa que la gestoría deba saber y no encaje en los apartados anteriores.", "Anything the gestoría should know that doesn’t fit the previous sections."),
    fields: [
      f("textarea", "obs", L("Observaciones para la gestoría", "Comments for the gestoría"), {
        opt: true,
        help: L("Cambios en su situación, dudas, ingresos o gastos que no aparecen en el cuestionario.", "Changes in your situation, questions, income or expenses not covered by the questionnaire."),
      }),
    ],
  },
];

/** Slug of the final step, which is not a section of the schema. */
export const REVIEW_SLUG = "revisar";

/** Signing step, right after personal details: the client signs the gestoría's data-protection notice and mandate. */
export const SIGN_SLUG = "firma";

/** The signing step after personal details is part of the questionnaire only with FEATURES.signing. */
export const STEP_SLUGS = [SCHEMA[0].slug, ...(FEATURES.signing ? [SIGN_SLUG] : []), ...SCHEMA.slice(1).map((s) => s.slug), REVIEW_SLUG];

export const sectionBySlug = (slug: string) => SCHEMA.find((s) => s.slug === slug);

/** Documents the gestoría gets straight from the client's tax data. */
export const NO_NEED_TO_UPLOAD: Text[] = [
  L("Nóminas, pensiones, prestaciones y retenciones (también los atrasos cobrados por funcionarios).", "Payslips, pensions, benefits and tax withheld (including back pay received by civil servants)."),
  L("Intereses de cuentas, dividendos y demás rendimientos del capital mobiliario.", "Bank interest, dividends and other investment income."),
  L("Rentas atribuidas por comunidades de bienes o herencias.", "Income attributed from jointly owned assets or estates."),
  L("Fecha y precio de venta de acciones: solo la compra.", "Sale date and price of shares: only the purchase."),
];
