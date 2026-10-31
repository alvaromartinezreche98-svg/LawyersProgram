import { notFound, redirect } from "next/navigation";
import { PLATFORM_SITE } from "@/lib/site";
import { FEATURES } from "@/lib/features";
import { PricingPage } from "@/components/public/pricing-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  // Like Para gestorías: it belongs on PreRenta's own domain, not on a gestoría's.
  if (!PLATFORM_SITE) redirect("/");
  return <PricingPage />;
}
