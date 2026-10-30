import { EnterWithCode } from "@/components/auth/enter-with-code";

export const metadata = { title: "Entrar · PreRenta" };

/** Invitation links from the firm: /entrar#code=<one-time code>. */
export default function Page() {
  return <EnterWithCode />;
}
