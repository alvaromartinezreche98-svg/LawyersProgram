import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { LegalSettings } from "@/components/gestor/settings/legal-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <LegalSettings />;
}
