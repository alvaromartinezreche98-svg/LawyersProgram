import { notFound, redirect } from "next/navigation";
import { PLATFORM_SITE } from "@/lib/site";
import { FEATURES } from "@/lib/features";
import { SignupPage } from "@/components/public/signup-page";

export default function Page() {
  if (!FEATURES.publicSite || !FEATURES.platformAdmin) notFound();
  // Like Para gestorías: it belongs on PreRenta's own domain, not on a gestoría's.
  if (!PLATFORM_SITE) redirect("/");
  return <SignupPage />;
}
