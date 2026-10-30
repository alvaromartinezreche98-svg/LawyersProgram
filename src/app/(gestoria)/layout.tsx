import { GestorShell } from "@/components/gestor/gestor-shell";

export default function GestoriaLayout({ children }: { children: React.ReactNode }) {
  return <GestorShell>{children}</GestorShell>;
}
