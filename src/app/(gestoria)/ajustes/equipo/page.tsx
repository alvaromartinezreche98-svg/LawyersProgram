import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { TeamSettings } from "@/components/gestor/settings/team-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <TeamSettings />;
}
