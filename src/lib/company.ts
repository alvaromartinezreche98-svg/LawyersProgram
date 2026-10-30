/*
 * The company that runs PreRenta, as shown in the legal pages and on Contact.
 * Not supplied yet: empty values render as visible "pending" placeholders,
 * never as invented data. Fill these in once the legal entity is confirmed.
 */
export const COMPANY = {
  /** Razón social, e.g. "PreRenta Software, S.L.". */
  name: "",
  /** NIF / CIF. */
  cif: "",
  address: "",
  email: "",
  /** Registro Mercantil entry (tomo, folio, hoja). */
  registry: "",
  /** Data protection officer or privacy contact, if different from `email`. */
  privacyEmail: "",
  /** Courts for disputes with gestorías (B2B), e.g. "Valencia". */
  courts: "",
};

export type CompanyKey = keyof typeof COMPANY;
