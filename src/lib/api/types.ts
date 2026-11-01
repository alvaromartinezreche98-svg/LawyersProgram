/* Shapes of the PreRenta API (docs/openapi.yaml, v0.3.0). snake_case as sent. */

export type ApiStatus = "draft" | "submitted" | "in_review" | "ready_to_file";
export type ApiRole = "admin" | "accountant" | "client";

export interface ApiCurrentUser {
  id: string;
  roles: ApiRole[];
  client_id: string | null;
}

export interface ApiProgress {
  answered: number;
  total: number;
  percent: number;
}

export interface ApiCase {
  id: string;
  client_id: string;
  tax_year: number;
  definition_version: string;
  status: ApiStatus;
  version: number;
  submitted_at: string | null;
  has_unsent_changes: boolean;
  created_at: string;
  updated_at: string;
  progress: ApiProgress;
  unread_messages: number;
}

export interface ApiAlert {
  severity: "bad" | "warn" | "info";
  section: string;
  message: string;
}

export interface ApiCaseDetail extends ApiCase {
  sections: { key: string; label: string; answered: number; total: number; state: "done" | "partial" | "empty" }[];
  missing_answers: string[];
  missing_documents: { field: string; item_id: string | null; label: string }[];
  alerts: ApiAlert[];
  issues: number;
}

export interface ApiStaffCase extends ApiCase {
  client_display_name: string;
  issues: number;
}

export interface ApiSection {
  section_key: string;
  definition_version: string;
  answers: Record<string, unknown>;
  updated_at: string | null;
  case_version?: number;
}

export interface ApiDocument {
  id: string;
  case_id: string;
  field: string | null;
  item_id: string | null;
  original_name: string;
  media_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface ApiMessage {
  id: string;
  case_id: string;
  sender: "client" | "staff";
  kind: "message" | "system" | "information_request";
  body: string;
  author_id: string;
  created_at: string;
}

export interface ApiNote {
  body: string;
  version: number;
  updated_at: string | null;
  updated_by: string | null;
}

export interface ApiInvitation {
  code: string;
  expires_at: string;
}

export interface ApiClientItem {
  id: string;
  display_name: string;
  created_at: string;
  bound: boolean;
  invitation: { status: "open" | "expired" | "accepted" | "none"; expires_at: string | null };
  cases: { id: string; tax_year: number; status: string }[];
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

/** GET /v1/questionnaire/definitions/{version}: the questionnaire a case is pinned to. */
export interface ApiDefinitionField {
  key: string;
  label: string;
  type: "string" | "text" | "boolean" | "integer" | "money" | "date" | "enum" | "list" | "upload";
  item_fields?: ApiDefinitionField[];
}
export interface ApiDefinition {
  version: string;
  tax_year: number;
  sections: { key: string; label: string; fields: ApiDefinitionField[] }[];
}
