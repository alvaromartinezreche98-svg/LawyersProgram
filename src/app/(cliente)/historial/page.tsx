import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ClientHistory } from "@/components/client/client-history";

export default function Page() {
  if (!FEATURES.prefill) notFound();
  return <ClientHistory />;
}
