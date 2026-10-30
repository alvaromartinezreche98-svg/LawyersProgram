import { L, type Text } from "@/lib/i18n";

/*
 * P7 · Legal pages. Draft wording structured on LSSI-CE (aviso legal), GDPR
 * art. 13 (privacy), LSSI art. 22.2 (cookies) and the service terms. It must
 * be reviewed by a lawyer before going live. {name}, {cif}, {address},
 * {email}, {registry}, {privacyEmail} and {courts} are filled from COMPANY.
 */

export interface LegalSection { h: Text; p: Text[] }
export interface LegalDoc { slug: string; title: Text; intro: Text; sections: LegalSection[] }

const sec = (h: Text, ...p: Text[]): LegalSection => ({ h, p });

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "aviso-legal",
    title: L("Aviso legal", "Legal notice"),
    intro: L(
      "Información general sobre el titular de este sitio web, de acuerdo con la Ley 34/2002 de servicios de la sociedad de la información (LSSI-CE).",
      "General information about the owner of this website, as required by Spanish Law 34/2002 on information society services (LSSI-CE).",
    ),
    sections: [
      sec(L("Titular", "Owner"),
        L("Razón social: {name}. NIF: {cif}. Domicilio: {address}. Correo electrónico: {email}. Datos registrales: {registry}.", "Company name: {name}. Tax ID (NIF): {cif}. Registered address: {address}. Email: {email}. Commercial registry: {registry}.")),
      sec(L("Objeto", "Purpose"),
        L("PreRenta es una plataforma que las gestorías ponen a disposición de sus clientes para recoger los datos y documentos necesarios para preparar la declaración de la renta. La preparación y presentación de la declaración corresponde a cada gestoría, no a PreRenta.", "PreRenta is a platform that gestorías (tax advisory firms) offer their clients to collect the data and documents needed to prepare their income tax return. Each gestoría, not PreRenta, prepares and files the return.")),
      sec(L("Condiciones de uso", "Terms of use"),
        L("El acceso a este sitio implica aceptar este aviso legal. El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o que dañen los derechos de terceros.", "Using this website means accepting this legal notice. Users agree to make proper use of its content and not to use it for unlawful purposes or in ways that harm the rights of others.")),
      sec(L("Propiedad intelectual", "Intellectual property"),
        L("Los contenidos, el diseño y el software de PreRenta pertenecen a {name} o a sus licenciantes. No se permite su reproducción sin autorización. Los documentos que suben los usuarios siguen siendo suyos.", "PreRenta’s content, design and software belong to {name} or its licensors and may not be reproduced without permission. Documents uploaded by users remain theirs.")),
      sec(L("Responsabilidad", "Liability"),
        L("{name} no se hace responsable del contenido de las declaraciones preparadas por las gestorías ni de los datos introducidos por los usuarios, ni de las interrupciones del servicio por causas ajenas a su control.", "{name} is not responsible for the content of returns prepared by gestorías, for data entered by users, or for service interruptions beyond its control.")),
      sec(L("Legislación aplicable", "Governing law"),
        L("Este aviso legal se rige por la legislación española.", "This legal notice is governed by Spanish law.")),
    ],
  },
  {
    slug: "privacidad",
    title: L("Política de privacidad", "Privacy policy"),
    intro: L(
      "Cómo se tratan sus datos personales en PreRenta, de acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
      "How your personal data is processed in PreRenta, under Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD).",
    ),
    sections: [
      sec(L("Quién trata sus datos", "Who processes your data"),
        L("Si es cliente de una gestoría, el responsable del tratamiento de los datos de su declaración es su gestoría. PreRenta actúa como encargado del tratamiento: guarda y procesa los datos por cuenta de la gestoría y solo siguiendo sus instrucciones, según el contrato firmado con ella.", "If you are a gestoría’s client, your gestoría is the controller of the data in your return. PreRenta acts as a processor: it stores and processes the data on the gestoría’s behalf, only on its instructions and under the contract signed with it."),
        L("Para las cuentas de las gestorías y para las consultas que recibimos por el formulario de contacto, el responsable es {name} (NIF {cif}, {address}). Contacto de privacidad: {privacyEmail}.", "For gestoría accounts and for enquiries sent through the contact form, the controller is {name} (NIF {cif}, {address}). Privacy contact: {privacyEmail}.")),
      sec(L("Qué datos tratamos", "What data we process"),
        L("Datos identificativos y de contacto (nombre, DNI/NIE, fecha de nacimiento, dirección, teléfono, correo), datos familiares, económicos y fiscales necesarios para la declaración, documentos que usted sube, mensajes con la gestoría, firmas de documentos y datos de pago de los honorarios.", "Identification and contact data (name, DNI/NIE, date of birth, address, phone, email), family, financial and tax data needed for the return, documents you upload, messages with the gestoría, document signatures and fee payment data.")),
      sec(L("Para qué y con qué base legal", "Purposes and legal basis"),
        L("Preparar y presentar su declaración: ejecución del encargo que usted hace a su gestoría (art. 6.1.b RGPD). Conservar la conformidad y las firmas como prueba ante un requerimiento: obligación legal e interés legítimo (art. 6.1.c y 6.1.f). Responder a sus consultas: su consentimiento o la aplicación de medidas precontractuales.", "Preparing and filing your return: performance of the engagement you give your gestoría (GDPR art. 6.1.b). Keeping your approval and signatures as evidence in case of a tax inspection: legal obligation and legitimate interest (art. 6.1.c and 6.1.f). Answering your enquiries: your consent or pre-contractual steps.")),
      sec(L("Con quién se comparten", "Who receives the data"),
        L("Sus datos solo los ve su gestoría. No se ceden a terceros salvo obligación legal (por ejemplo, la Agencia Tributaria cuando la gestoría presenta su declaración) y a los proveedores técnicos que prestan servicio a PreRenta (alojamiento, autenticación, pagos), con quienes hay contrato de encargo y que tratan los datos en el Espacio Económico Europeo o con garantías adecuadas.", "Only your gestoría sees your data. It is not shared with third parties except where required by law (for example the Tax Agency, when the gestoría files your return) and with PreRenta’s technical providers (hosting, authentication, payments), who are bound by processing agreements and process the data in the European Economic Area or with adequate safeguards.")),
      sec(L("Cuánto tiempo se guardan", "How long data is kept"),
        L("Mientras dure la relación con su gestoría y, después, durante los plazos de prescripción fiscal y legal aplicables (con carácter general, cuatro años para las obligaciones tributarias), salvo que la gestoría indique otro plazo.", "For as long as your relationship with your gestoría lasts and, afterwards, for the applicable tax and legal limitation periods (generally four years for tax obligations), unless the gestoría sets a different period.")),
      sec(L("Sus derechos", "Your rights"),
        L("Puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad ante su gestoría o, para los datos de los que {name} es responsable, en {privacyEmail}. Si considera que no se han atendido, puede reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).", "You can exercise your rights of access, rectification, erasure, objection, restriction and portability with your gestoría or, for data controlled by {name}, at {privacyEmail}. If you feel your request has not been handled properly, you can complain to the Spanish Data Protection Agency (www.aepd.es).")),
      sec(L("Seguridad", "Security"),
        L("Se aplican medidas técnicas y organizativas adecuadas al tipo de datos, que incluyen datos fiscales y de identidad: acceso con autenticación, cifrado en tránsito y separación de los datos de cada gestoría.", "Technical and organisational measures appropriate to the data, which includes tax and identity data, are applied: authenticated access, encryption in transit and separation of each gestoría’s data.")),
    ],
  },
  {
    slug: "cookies",
    title: L("Política de cookies", "Cookie policy"),
    intro: L(
      "Qué cookies y almacenamiento local usa PreRenta, de acuerdo con el artículo 22.2 de la LSSI-CE.",
      "Which cookies and local storage PreRenta uses, under article 22.2 of the LSSI-CE.",
    ),
    sections: [
      sec(L("Solo técnicas", "Strictly necessary only"),
        L("PreRenta solo usa cookies y almacenamiento del navegador necesarios para que el servicio funcione: mantener la sesión iniciada, recordar el idioma y guardar el progreso del cuestionario. Por eso no le pedimos consentimiento: la ley lo exime para este tipo de cookies.", "PreRenta only uses cookies and browser storage needed for the service to work: keeping you signed in, remembering your language and saving your questionnaire progress. That is why we do not ask for consent: the law exempts these cookies.")),
      sec(L("Qué guardamos", "What we store"),
        L("Sesión: identifica su sesión iniciada; caduca al cerrar sesión. Idioma: recuerda el idioma elegido. Progreso: guarda sus respuestas mientras rellena el cuestionario.", "Session: identifies your signed-in session; it expires when you sign out. Language: remembers the language you chose. Progress: saves your answers while you fill in the questionnaire.")),
      sec(L("Sin publicidad ni analítica", "No advertising or analytics"),
        L("No usamos cookies de publicidad ni de analítica de terceros. Si en el futuro se añaden, se le pedirá el consentimiento antes y podrá rechazarlas.", "We do not use advertising or third-party analytics cookies. If any are added in future, you will be asked for consent first and will be able to refuse them.")),
      sec(L("Cómo borrarlas", "How to delete them"),
        L("Puede borrar las cookies y los datos del sitio desde la configuración de su navegador. Si lo hace, tendrá que volver a iniciar sesión.", "You can delete cookies and site data in your browser settings. If you do, you will need to sign in again.")),
    ],
  },
  {
    slug: "terminos",
    title: L("Términos del servicio", "Terms of service"),
    intro: L(
      "Condiciones de uso de la plataforma PreRenta para clientes y gestorías.",
      "Terms for using the PreRenta platform, for clients and gestorías.",
    ),
    sections: [
      sec(L("El servicio", "The service"),
        L("PreRenta permite a una gestoría invitar a sus clientes, recoger sus respuestas y documentos, comunicarse con ellos, enviarles el resultado para su conformidad y cobrar sus honorarios. PreRenta es una herramienta: no presta asesoramiento fiscal ni presenta declaraciones.", "PreRenta lets a gestoría invite its clients, collect their answers and documents, talk to them, send them the result for approval and collect its fees. PreRenta is a tool: it does not give tax advice or file returns.")),
      sec(L("Cuentas", "Accounts"),
        L("Cada persona usa su propia cuenta y es responsable de mantener sus credenciales en secreto. Solo el titular de la declaración puede rellenar su cuestionario. La gestoría es responsable de las personas de su equipo a las que da acceso.", "Each person uses their own account and must keep their credentials secret. Only the taxpayer may fill in their own questionnaire. The gestoría is responsible for the team members it gives access to.")),
      sec(L("Obligaciones del cliente", "Client obligations"),
        L("Facilitar datos veraces y completos y los documentos que le pida su gestoría. La conformidad que da con el resultado queda registrada con fecha y hora.", "Provide true and complete information and the documents your gestoría asks for. Your approval of the result is recorded with its date and time.")),
      sec(L("Obligaciones de la gestoría", "Gestoría obligations"),
        L("Tratar los datos de sus clientes conforme a la normativa de protección de datos, como responsable del tratamiento; mantener actualizados sus documentos legales (protección de datos y mandato); y pagar la suscripción del plan contratado.", "Process its clients’ data under data protection law, as controller; keep its legal documents (data protection and mandate) up to date; and pay the subscription for its plan.")),
      sec(L("Pagos", "Payments"),
        L("Los honorarios que paga el cliente son de la gestoría, que fija su importe. PreRenta solo facilita el cobro a través de un proveedor de pagos.", "The fees the client pays belong to the gestoría, which sets the amount. PreRenta only facilitates payment through a payment provider.")),
      sec(L("Disponibilidad y responsabilidad", "Availability and liability"),
        L("Se procura que el servicio esté disponible de forma continua, salvo mantenimiento. {name} no responde del contenido de las declaraciones, que es responsabilidad de la gestoría y del cliente.", "We aim to keep the service continuously available, except for maintenance. {name} is not liable for the content of returns, which is the responsibility of the gestoría and the client.")),
      sec(L("Cambios y ley aplicable", "Changes and governing law"),
        L("Se avisará de los cambios relevantes de estos términos antes de que entren en vigor. Se rigen por la ley española. Para las gestorías, los conflictos se someten a los juzgados de {courts}; para los consumidores, a los de su domicilio.", "Material changes to these terms will be announced before they take effect. They are governed by Spanish law. For gestorías, disputes go to the courts of {courts}; for consumers, to the courts of their place of residence.")),
    ],
  },
];

export const legalDoc = (slug: string) => LEGAL_DOCS.find((d) => d.slug === slug);
