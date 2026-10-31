import { notFound, redirect } from "next/navigation";
import { PLATFORM_SITE } from "@/lib/site";
import { FEATURES } from "@/lib/features";
import { FirmsPage } from "@/components/public/firms-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  // Selling PreRenta to gestorías belongs on PreRenta's own domain, not on a gestoría's.
  if (!PLATFORM_SITE) redirect("/");
  return <FirmsPage />;
}
