import type { Text } from "@/lib/i18n";

export type FieldType =
  | "text"
  | "tel"
  | "email"
  | "date"
  | "money"
  | "number"
  | "pct"
  | "textarea"
  | "select"
  | "yn"
  | "choice"
  | "upload"
  | "repeat";

/** [stored value, label] */
export type Choice = readonly [string, Text];

export interface Field {
  type: FieldType;
  id: string;
  label: Text;
  help?: Text;
  /** Optional: does not count towards progress. */
  opt?: boolean;
  mono?: boolean;
  /** HTML autocomplete token. */
  ac?: string;
  unit?: Text;
  /** Options for `select` and `choice`. The stored value is the first item. */
  choices?: Choice[];
  /** Values that reveal `kids`. Defaults to ["si"] for `yn`. */
  when?: string[];
  kids?: Field[];
  /** Singular item name for `repeat`. */
  item?: Text;
  /** Item fields for `repeat`. */
  fields?: Field[];
  /** Starts a named group of questions inside a long step, with one sentence on why it is asked (draft copy, to confirm with the gestoría). */
  group?: { title: Text; why?: Text };
}

export interface Section {
  id: string;
  slug: string;
  title: Text;
  short: Text;
  intro?: Text;
  fields: Field[];
}

export interface FileRef {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Example files from the demo cases have no stored content. */
  example?: boolean;
}

export type AnswerValue = string | FileRef[] | Answers[];
export interface Answers {
  [key: string]: AnswerValue | undefined;
}

export type Path = (string | number)[];

/**
 * Key holding a repeatable-group item's stable id (e.g. one rented property).
 * Items keep it when others are added or removed, so answers and files can be
 * addressed by id rather than by position, as the API contract requires.
 */
export const ITEM_ID = "_id";
