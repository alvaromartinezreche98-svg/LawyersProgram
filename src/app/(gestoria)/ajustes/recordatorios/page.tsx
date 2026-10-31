import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { ReminderSettings } from "@/components/gestor/settings/reminder-settings";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  return <ReminderSettings />;
}
