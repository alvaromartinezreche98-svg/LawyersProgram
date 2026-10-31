import { redirect } from "next/navigation";
import { AccessScreen } from "@/components/access-screen";
import { PublicHome } from "@/components/public/public-home";
import { PLATFORM_SITE } from "@/lib/site";

/** Links that used to open the access page on "/" (invitations, printed QRs, ?next= return links). */
const ACCESS_PARAMS = ["expediente", "alta", "next"];
// "/" and "/acceso" are the same entry page now; old links keep their query on /acceso.

/**
 * On a firm's domain "/" is that firm's entry page, led by the firm, with
 * sign-in (blueprint routing rule: the firm is identified by its domain). On
 * PreRenta's main domain (NEXT_PUBLIC_SITE=platform) it is the public home, P1.
 */
export default async function Page(props: PageProps<"/">) {
  const sp = await props.searchParams;
  if (typeof sp.expediente === "string") redirect(`/invitacion/${encodeURIComponent(sp.expediente)}`);
  if (ACCESS_PARAMS.some((k) => sp[k] !== undefined)) {
    const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v === undefined ? [] : [[k, v]])));
    redirect(`/acceso?${qs}`);
  }
  return PLATFORM_SITE ? <PublicHome /> : <AccessScreen />;
}
