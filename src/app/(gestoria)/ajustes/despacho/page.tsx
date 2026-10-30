import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { FirmSettings } from "@/components/gestor/settings/firm-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <FirmSettings />;
}
