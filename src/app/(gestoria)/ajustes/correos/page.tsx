import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { EmailSettings } from "@/components/gestor/settings/email-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <EmailSettings />;
}
