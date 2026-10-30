import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { Appointments } from "@/components/gestor/appointments";

export default function Page() {
  if (!FEATURES.appointments) notFound();
  return <Appointments />;
}
