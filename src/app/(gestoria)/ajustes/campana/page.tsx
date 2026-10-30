import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { CampaignSettings } from "@/components/gestor/settings/campaign-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <CampaignSettings />;
}
