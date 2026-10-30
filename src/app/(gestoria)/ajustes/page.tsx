import { notFound, redirect } from "next/navigation";
import { FEATURES } from "@/lib/features";

export default function Page() {
  if (!FEATURES.firmSettings) notFound();
  redirect("/ajustes/despacho");
}
