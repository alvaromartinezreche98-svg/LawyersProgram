import { Suspense } from "react";
import { CaseList } from "@/components/gestor/case-list";

export default function Page() {
  // CaseList reads the status filter from ?estado=, which needs a Suspense boundary to prerender.
  return (
    <Suspense>
      <CaseList />
    </Suspense>
  );
}
