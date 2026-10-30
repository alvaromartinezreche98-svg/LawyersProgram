import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { Payments } from "@/components/gestor/payments";

export default function Page() {
  if (!FEATURES.payments) notFound();
  return <Payments />;
}
