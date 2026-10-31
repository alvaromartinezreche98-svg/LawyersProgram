import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { IdentityCheck } from "@/components/client/identity-check";

export default function Page() {
  if (!FEATURES.identityCheck) notFound();
  return <IdentityCheck />;
}
