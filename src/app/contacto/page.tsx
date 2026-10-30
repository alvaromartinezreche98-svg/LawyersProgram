import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ContactPage } from "@/components/public/contact-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return <ContactPage />;
}
