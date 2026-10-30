import { redirect } from "next/navigation";
import { STEP_SLUGS } from "@/lib/questionnaire/schema";

export default function Page() {
  redirect(`/declaracion/${STEP_SLUGS[0]}`);
}
