import type { ReactNode } from "react";
import { Mail, Phone, type LucideIcon } from "lucide-react";

const ICONS = { email: Mail, tel: Phone } satisfies Record<string, LucideIcon>;

/** A phone or email field with its icon inside on the left (styles: .field-icon in _field.scss). */
export function FieldIcon({ kind, children }: { kind: keyof typeof ICONS; children: ReactNode }) {
  const Icon = ICONS[kind];
  return (
    <span className="field-icon">
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
