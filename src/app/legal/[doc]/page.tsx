import { notFound } from "next/navigation";
import { LEGAL_DOCS, legalDoc } from "@/lib/legal/content";
import { LegalPage } from "@/components/public/legal-page";

export const dynamicParams = false;
export const generateStaticParams = () => LEGAL_DOCS.map((d) => ({ doc: d.slug }));

export default async function Page(props: PageProps<"/legal/[doc]">) {
  const { doc } = await props.params;
  const d = legalDoc(doc);
  if (!d) notFound();
  return <LegalPage doc={d} />;
}
