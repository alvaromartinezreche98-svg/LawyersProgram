import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ClientPayment } from "@/components/client/client-payment";

export default function Page() {
  if (!FEATURES.payments) notFound();
  return <ClientPayment />;
}
