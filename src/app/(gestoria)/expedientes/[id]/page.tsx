import { CaseFile } from "@/components/gestor/case-file";

export default async function Page(props: PageProps<"/expedientes/[id]">) {
  const { id } = await props.params;
  return <CaseFile id={id} />;
}
