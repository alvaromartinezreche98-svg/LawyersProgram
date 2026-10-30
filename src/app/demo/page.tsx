import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { DemoPage } from "@/components/public/demo-page";

export default function Page() {
  if (!FEATURES.publicSite) notFound();
  return <DemoPage />;
}
