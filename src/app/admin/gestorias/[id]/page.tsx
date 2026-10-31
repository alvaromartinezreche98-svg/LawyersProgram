import { AdminFirm } from "@/components/admin/admin-firm";

export default async function Page(props: PageProps<"/admin/gestorias/[id]">) {
  const { id } = await props.params;
  return <AdminFirm id={id} />;
}
