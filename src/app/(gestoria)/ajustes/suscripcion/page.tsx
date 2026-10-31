import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { SubscriptionSettings } from "@/components/gestor/settings/subscription-settings";

export default function Page() {
  if (!FEATURES.firmSettings || !FEATURES.platformAdmin) notFound();
  return <SubscriptionSettings />;
}
