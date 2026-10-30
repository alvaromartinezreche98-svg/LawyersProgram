import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { FaqPage } from "@/components/public/faq-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return <FaqPage />;
}
