import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ClientResult } from "@/components/client/client-result";

export default function Page() {
  if (!FEATURES.resultApproval) notFound();
  return <ClientResult />;
}
