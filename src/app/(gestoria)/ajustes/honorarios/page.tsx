import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { FeesSettings } from "@/components/gestor/settings/fees-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <FeesSettings />;
}
