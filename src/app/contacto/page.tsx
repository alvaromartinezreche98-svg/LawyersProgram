import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { PLATFORM_SITE } from "@/lib/site";
import { ContactPage } from "@/components/public/contact-page";
import { FirmContactPage } from "@/components/public/firm-contact-page";

/** P6 · Contacto: PreRenta's company on its own domain; on a gestoría's domain, that gestoría. */
export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return PLATFORM_SITE ? <ContactPage /> : <FirmContactPage />;
}
