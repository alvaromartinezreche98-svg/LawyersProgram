import { notFound } from "next/navigation";
import { STEP_SLUGS } from "@/lib/questionnaire/schema";
import { Questionnaire } from "@/components/client/questionnaire";

export function generateStaticParams() {
  return STEP_SLUGS.map((paso) => ({ paso }));
}

export default async function Page(props: PageProps<"/declaracion/[paso]">) {
  const { paso } = await props.params;
  if (!STEP_SLUGS.includes(paso)) notFound();
  return <Questionnaire slug={paso} />;
}
