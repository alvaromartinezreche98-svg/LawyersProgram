import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { HowPage } from "@/components/public/how-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return <HowPage />;
}
