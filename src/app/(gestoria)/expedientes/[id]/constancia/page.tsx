import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { CaseRecord } from "@/components/gestor/case-record";

export default async function Page(props: PageProps<"/expedientes/[id]/constancia">) {
  if (!FEATURES.signing && !FEATURES.resultApproval) notFound();
  const { id } = await props.params;
  return <CaseRecord id={id} />;
}
