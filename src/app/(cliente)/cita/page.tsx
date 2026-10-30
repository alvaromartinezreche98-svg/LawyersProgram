import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ClientAppointment } from "@/components/client/client-appointment";

export default function Page() {
  if (!FEATURES.appointments) notFound();
  return <ClientAppointment />;
}
