import { ClientPreview } from "@/components/gestor/client-preview";

export default async function Page(props: PageProps<"/expedientes/[id]/vista-cliente">) {
  const { id } = await props.params;
  return <ClientPreview id={id} />;
}
