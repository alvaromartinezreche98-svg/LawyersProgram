import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { FirmsPage } from "@/components/public/firms-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return <FirmsPage />;
}
