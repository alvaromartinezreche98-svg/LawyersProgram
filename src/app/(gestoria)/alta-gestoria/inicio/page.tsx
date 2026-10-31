import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { Onboarding } from "@/components/gestor/onboarding";

export default function Page() {
  if (!FEATURES.platformAdmin || !FEATURES.firmSettings) notFound();
  return <Onboarding />;
}
