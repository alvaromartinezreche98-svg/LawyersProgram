"use client";

import { ErrorScreen } from "@/components/error-pages";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen {...props} />;
}
