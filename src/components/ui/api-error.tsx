"use client";

import { usePathname } from "next/navigation";
import { isApiError } from "@/lib/api/client";
import { SIGN_IN_PATH } from "@/lib/auth/config";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, ButtonLink, Notice } from "./primitives";

/**
 * Explains a failed API call in plain words, with the one action that helps:
 * sign in again (401), reload the latest version (409, never overwrite), or
 * retry. Never shows the response body or the request.
 */
export function ApiErrorNotice({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useI18n();
  const path = usePathname();
  const kind = isApiError(error) ? error.kind : "server";
  const action =
    kind === "unauthenticated" ? <ButtonLink size="sm" variant="primary" href={`${SIGN_IN_PATH}?next=${encodeURIComponent(path)}`}>{t.sync.signIn}</ButtonLink>
    : kind === "conflict" ? onRetry && <Button size="sm" variant="primary" onClick={onRetry}>{t.sync.reload}</Button>
    : kind === "server" || kind === "network" ? onRetry && <Button size="sm" onClick={onRetry}>{t.sync.retry}</Button>
    : null;
  return (
    <Notice tone={kind === "invalid" || kind === "tooLarge" ? "warn" : "bad"} className={className}>
      {t.sync.error[kind]}
      {action && <div className="mt-2">{action}</div>}
    </Notice>
  );
}
