import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { CampaignBoard } from "@/components/gestor/campaign-board";

export default function Page() {
  if (!FEATURES.campaignBoard) notFound();
  return <CampaignBoard />;
}
