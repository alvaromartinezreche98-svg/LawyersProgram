import { InvitationPage } from "@/components/invitation/invitation-page";

export default async function Page(props: PageProps<"/invitacion/[token]">) {
  const { token } = await props.params;
  return <InvitationPage token={decodeURIComponent(token)} />;
}
