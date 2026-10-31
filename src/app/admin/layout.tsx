import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURES.platformAdmin) notFound();
  return <AdminShell>{children}</AdminShell>;
}
