import { notFound, redirect } from "next/navigation";
import { PLATFORM_SITE } from "@/lib/site";
import { FEATURES } from "@/lib/features";
import { DemoPage } from "@/components/public/demo-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  // Selling PreRenta to gestorías belongs on PreRenta's own domain, not on a gestoría's.
  if (!PLATFORM_SITE) redirect("/");
  return <DemoPage />;
}
