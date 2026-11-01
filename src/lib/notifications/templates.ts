import type { Lang } from "@/lib/i18n";

/*
 * S2 · Emails the platform sends, in the recipient's language. The backend
 * sends them; this module is the agreed copy and layout, rendered to HTML and
 * plain text so it can be previewed here (Settings → Emails) and reused.
 *
 * Emails never carry tax data or message text: they say something happened
 * and link back to PreRenta, where the user signs in to see it.
 * Sign-in codes and email verification are sent by Clerk, not by these.
 */

export type EmailKind = "invitation" | "newMessage" | "statusChange" | "taskRequested" | "resultReady" | "appointmentConfirmed" | "reminder";
export const EMAIL_KINDS: EmailKind[] = ["invitation", "newMessage", "statusChange", "taskRequested", "resultReady", "appointmentConfirmed", "reminder"];

export interface EmailData {
  firmName: string;
  clientName: string;
  year: number;
  /** Absolute link the button opens (invitation link or the page to sign in to). */
  link: string;
  /** statusChange: the new status label, already in the recipient's language. */
  status?: string;
  /** appointmentConfirmed: "05/11/2026 a las 10:30" and "Llamada telefónica", already localized. */
  when?: string;
  kind?: string;
}

export interface Email {
  subject: string;
  /** Inbox preview line. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta: string;
  /** Why the recipient got this email. */
  footer: string;
}

type Copy = Record<EmailKind, (d: EmailData) => Omit<Email, "footer">> & { footer: (d: EmailData) => string; greeting: (name: string) => string };

const first = (n: string) => n.trim().split(/\s+/)[0] ?? "";

const COPY: Record<Lang, Copy> = {
  es: {
    greeting: (n) => (n ? `Hola, ${first(n)}:` : "Hola:"),
    footer: (d) => `Recibe este correo porque ${d.firmName} prepara su declaración de la renta con PreRenta. Si no lo esperaba, puede ignorarlo.`,
    invitation: (d) => ({
      subject: `${d.firmName} le invita a preparar su renta ${d.year}`,
      preheader: "Rellene el cuestionario y suba sus documentos desde el móvil.",
      heading: `Prepare su renta ${d.year} con ${d.firmName}`,
      paragraphs: [
        `${d.firmName} le ha invitado a preparar su declaración de la renta en PreRenta.`,
        "Responda un cuestionario guiado, con solo las preguntas que le aplican, y suba cada documento en la pregunta que lo pide. Se guarda solo y puede enviarlo aunque falte algo.",
        "El enlace es personal: no lo reenvíe.",
      ],
      cta: "Aceptar la invitación",
    }),
    newMessage: (d) => ({
      subject: `Nuevo mensaje de ${d.firmName}`,
      preheader: "Tiene un mensaje nuevo sobre su declaración.",
      heading: "Tiene un mensaje nuevo",
      paragraphs: [`${d.firmName} le ha escrito sobre su declaración de la renta ${d.year}.`, "Por seguridad, el mensaje no se incluye en este correo. Entre en PreRenta para leerlo y responder."],
      cta: "Leer el mensaje",
    }),
    statusChange: (d) => ({
      subject: `Su declaración ${d.year}: ${d.status ?? ""}`,
      preheader: `Nuevo estado: ${d.status ?? ""}.`,
      heading: "Su declaración ha cambiado de estado",
      paragraphs: [`El estado de su declaración de la renta ${d.year} es ahora: ${d.status ?? ""}.`, "Puede ver el detalle en PreRenta."],
      cta: "Ver mi declaración",
    }),
    taskRequested: (d) => ({
      subject: `${d.firmName} necesita algo de usted`,
      preheader: "Su gestoría le ha pedido un dato o un documento.",
      heading: "Su gestoría le pide algo",
      paragraphs: [`${d.firmName} necesita un dato o un documento para continuar con su declaración ${d.year}.`, "Lo verá como tarea en el Inicio de PreRenta. Cuando lo tenga, márquelo como hecho."],
      cta: "Ver qué falta",
    }),
    resultReady: (d) => ({
      subject: `Su renta ${d.year} está lista para revisar`,
      preheader: "Revise el resultado y dé su conformidad.",
      heading: "El resultado de su declaración está listo",
      paragraphs: [`${d.firmName} ha preparado su declaración de la renta ${d.year}.`, "Revise el resultado y, si está de acuerdo, dé su conformidad para que la presente. Si tiene dudas, escríbale desde PreRenta."],
      cta: "Ver el resultado",
    }),
    appointmentConfirmed: (d) => ({
      subject: `Cita confirmada con ${d.firmName}`,
      preheader: `${d.kind ?? ""} · ${d.when ?? ""}`,
      heading: "Su cita está confirmada",
      paragraphs: [`${d.firmName} ha confirmado su cita: ${d.kind ?? ""}, ${d.when ?? ""}.`, "Si no puede asistir, avise a su gestoría desde PreRenta."],
      cta: "Ver la cita",
    }),
    // Settings → Reminders: sent after some days without activity. No tax data, only what is pending.
    reminder: (d) => ({
      subject: `Su renta ${d.year} sigue pendiente`,
      preheader: "Puede seguir donde lo dejó: se guardó todo.",
      heading: "Su declaración le espera",
      paragraphs: [`Hace unos días que no avanza su declaración de la renta ${d.year} con ${d.firmName}.`, "Lo que ya rellenó está guardado. Entre en PreRenta para ver qué falta y seguir donde lo dejó."],
      cta: "Seguir con mi declaración",
    }),
  },
  va: {
    greeting: (n) => (n ? `Hola, ${first(n)}:` : "Hola:"),
    footer: (d) => `Rep este correu perquè ${d.firmName} prepara la seua declaració de la renda amb PreRenta. Si no l'esperava, el pot ignorar.`,
    invitation: (d) => ({
      subject: `${d.firmName} el convida a preparar la seua renda ${d.year}`,
      preheader: "Ompla el qüestionari i puge els seus documents des del mòbil.",
      heading: `Prepare la seua renda ${d.year} amb ${d.firmName}`,
      paragraphs: [
        `${d.firmName} l'ha convidat a preparar la seua declaració de la renda en PreRenta.`,
        "Responga un qüestionari guiat, només amb les preguntes que li afecten, i puge cada document en la pregunta que el demana. Es guarda sol i el pot enviar encara que hi falte alguna cosa.",
        "L'enllaç és personal: no el reenvie.",
      ],
      cta: "Acceptar la invitació",
    }),
    newMessage: (d) => ({
      subject: `Missatge nou de ${d.firmName}`,
      preheader: "Té un missatge nou sobre la seua declaració.",
      heading: "Té un missatge nou",
      paragraphs: [`${d.firmName} li ha escrit sobre la seua declaració de la renda ${d.year}.`, "Per seguretat, el missatge no s'inclou en este correu. Entre en PreRenta per a llegir-lo i respondre."],
      cta: "Llegir el missatge",
    }),
    statusChange: (d) => ({
      subject: `La seua declaració ${d.year}: ${d.status ?? ""}`,
      preheader: `Estat nou: ${d.status ?? ""}.`,
      heading: "La seua declaració ha canviat d'estat",
      paragraphs: [`L'estat de la seua declaració de la renda ${d.year} és ara: ${d.status ?? ""}.`, "Pot veure'n el detall en PreRenta."],
      cta: "Veure la meua declaració",
    }),
    taskRequested: (d) => ({
      subject: `${d.firmName} necessita alguna cosa de vosté`,
      preheader: "La seua gestoria li ha demanat una dada o un document.",
      heading: "La seua gestoria li demana alguna cosa",
      paragraphs: [`${d.firmName} necessita una dada o un document per a continuar amb la seua declaració ${d.year}.`, "Ho veurà com a tasca en l'Inici de PreRenta. Quan ho tinga, marque-ho com a fet."],
      cta: "Veure què falta",
    }),
    resultReady: (d) => ({
      subject: `La seua renda ${d.year} està llesta per a revisar`,
      preheader: "Revise el resultat i done la seua conformitat.",
      heading: "El resultat de la seua declaració està llest",
      paragraphs: [`${d.firmName} ha preparat la seua declaració de la renda ${d.year}.`, "Revise el resultat i, si hi està d'acord, done la seua conformitat perquè la presente. Si té dubtes, escriga-li des de PreRenta."],
      cta: "Veure el resultat",
    }),
    appointmentConfirmed: (d) => ({
      subject: `Cita confirmada amb ${d.firmName}`,
      preheader: `${d.kind ?? ""} · ${d.when ?? ""}`,
      heading: "La seua cita està confirmada",
      paragraphs: [`${d.firmName} ha confirmat la seua cita: ${d.kind ?? ""}, ${d.when ?? ""}.`, "Si no hi pot anar, avise la seua gestoria des de PreRenta."],
      cta: "Veure la cita",
    }),
    reminder: (d) => ({
      subject: `La seua renda ${d.year} continua pendent`,
      preheader: "Pot continuar on ho va deixar: s'ha guardat tot.",
      heading: "La seua declaració l'espera",
      paragraphs: [`Fa uns dies que no avança la seua declaració de la renda ${d.year} amb ${d.firmName}.`, "El que ja va omplir està guardat. Entre en PreRenta per a veure què falta i continuar on ho va deixar."],
      cta: "Continuar amb la meua declaració",
    }),
  },
  en: {
    greeting: (n) => (n ? `Hello ${first(n)},` : "Hello,"),
    footer: (d) => `You are receiving this email because ${d.firmName} prepares your tax return with PreRenta. If you were not expecting it, you can ignore it.`,
    invitation: (d) => ({
      subject: `${d.firmName} invites you to prepare your ${d.year} tax return`,
      preheader: "Fill in the questionnaire and upload your documents from your phone.",
      heading: `Prepare your ${d.year} tax return with ${d.firmName}`,
      paragraphs: [
        `${d.firmName} has invited you to prepare your income tax return on PreRenta.`,
        "Answer a guided questionnaire with only the questions that apply to you, and upload each document at the question that asks for it. It saves automatically, and you can send it even if something is missing.",
        "This link is personal: please do not forward it.",
      ],
      cta: "Accept the invitation",
    }),
    newMessage: (d) => ({
      subject: `New message from ${d.firmName}`,
      preheader: "You have a new message about your tax return.",
      heading: "You have a new message",
      paragraphs: [`${d.firmName} has written to you about your ${d.year} tax return.`, "For your security, the message is not included in this email. Sign in to PreRenta to read it and reply."],
      cta: "Read the message",
    }),
    statusChange: (d) => ({
      subject: `Your ${d.year} tax return: ${d.status ?? ""}`,
      preheader: `New status: ${d.status ?? ""}.`,
      heading: "Your tax return has a new status",
      paragraphs: [`The status of your ${d.year} tax return is now: ${d.status ?? ""}.`, "You can see the details on PreRenta."],
      cta: "See my return",
    }),
    taskRequested: (d) => ({
      subject: `${d.firmName} needs something from you`,
      preheader: "Your gestoría has asked you for a detail or a document.",
      heading: "Your gestoría is asking you for something",
      paragraphs: [`${d.firmName} needs a detail or a document to continue with your ${d.year} tax return.`, "You will see it as a task on your PreRenta home page. Once you have it, mark it as done."],
      cta: "See what is missing",
    }),
    resultReady: (d) => ({
      subject: `Your ${d.year} tax return is ready to review`,
      preheader: "Review the result and give your approval.",
      heading: "Your tax return result is ready",
      paragraphs: [`${d.firmName} has prepared your ${d.year} tax return.`, "Review the result and, if you agree, give your approval so it can be filed. If you have questions, write to your gestoría on PreRenta."],
      cta: "See the result",
    }),
    appointmentConfirmed: (d) => ({
      subject: `Appointment confirmed with ${d.firmName}`,
      preheader: `${d.kind ?? ""} · ${d.when ?? ""}`,
      heading: "Your appointment is confirmed",
      paragraphs: [`${d.firmName} has confirmed your appointment: ${d.kind ?? ""}, ${d.when ?? ""}.`, "If you cannot make it, let your gestoría know on PreRenta."],
      cta: "See the appointment",
    }),
    reminder: (d) => ({
      subject: `Your ${d.year} tax return is still pending`,
      preheader: "Pick up where you left off: everything was saved.",
      heading: "Your return is waiting for you",
      paragraphs: [`Your ${d.year} income tax return with ${d.firmName} has not moved for a few days.`, "What you filled in is saved. Sign in to PreRenta to see what is missing and carry on where you left off."],
      cta: "Continue my return",
    }),
  },
};

export function buildEmail(kind: EmailKind, lang: Lang, d: EmailData): Email & { greeting: string } {
  const c = COPY[lang];
  return { ...c[kind](d), greeting: c.greeting(d.clientName), footer: c.footer(d) };
}

const esc = (v: string) => v.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Email-client-safe HTML: one table, inline styles, PreRenta tokens (navy #20364F, warm #F5F4F0). */
export function renderHtml(e: ReturnType<typeof buildEmail>, d: EmailData, lang: Lang): string {
  const font = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
  const p = (txt: string) => `<p style="margin:0 0 14px;font:15px/1.6 ${font};color:#252B33">${esc(txt)}</p>`;
  return `<!doctype html>
<html lang="${lang === "va" ? "ca-ES-valencia" : lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(e.subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F4F0">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(e.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #D9DEE4;border-radius:8px">
<tr><td style="padding:22px 28px;border-bottom:1px solid #D9DEE4;font:600 17px/1.3 ${font};color:#20364F">${esc(d.firmName)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font:600 21px/1.3 ${font};color:#252B33">${esc(e.heading)}</h1>
${p(e.greeting)}
${e.paragraphs.map(p).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="background:#20364F;border-radius:4px">
<a href="${esc(d.link)}" style="display:inline-block;padding:12px 20px;font:600 15px/1 ${font};color:#FFFFFF;text-decoration:none">${esc(e.cta)}</a>
</td></tr></table>
<p style="margin:14px 0 0;font:13px/1.5 ${font};color:#65707C;word-break:break-all">${esc(d.link)}</p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #D9DEE4;font:12.5px/1.5 ${font};color:#65707C">${esc(e.footer)}</td></tr>
</table>
<p style="margin:14px 0 0;font:12px/1.4 ${font};color:#65707C">PreRenta</p>
</td></tr>
</table>
</body>
</html>`;
}

/** Plain-text part of the same email. */
export function renderText(e: ReturnType<typeof buildEmail>, d: EmailData): string {
  return [e.heading, "", e.greeting, "", ...e.paragraphs.flatMap((x) => [x, ""]), `${e.cta}: ${d.link}`, "", "—", e.footer].join("\n");
}
