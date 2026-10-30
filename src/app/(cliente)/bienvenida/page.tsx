import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { Welcome } from "@/components/client/welcome";

export default function Page() {
  if (!FEATURES.identityCheck) notFound();
  return <Welcome />;
}
