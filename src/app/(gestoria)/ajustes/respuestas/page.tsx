import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { RepliesSettings } from "@/components/gestor/settings/replies-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <RepliesSettings />;
}
