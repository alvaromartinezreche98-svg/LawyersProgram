"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LangSwitch } from "@/components/ui/lang-switch";
import { IconTile } from "@/components/ui/icons";
import { Brand, ButtonLink } from "@/components/ui/primitives";

/** Where "Go to start" leads: the user's own area when signed in, the access page otherwise. */
export function useHomeHref() {
  const { session } = useAppState();
  return session?.role === "admin" ? "/admin/gestorias" : session?.role === "gestoria" ? "/expedientes" : session?.role === "cliente" ? "/inicio" : "/";
}

/** S1 · Full-page message for 404, errors and maintenance. */
export function StatusScreen({ icon, code, title, body, actions, footer }: { icon: LucideIcon; code?: string; title: string; body: string; actions?: ReactNode; footer?: ReactNode }) {
  const home = useHomeHref();
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-4 pt-6 sm:px-8">
        <Link href={home}>
          <Brand />
        </Link>
        <LangSwitch />
      </header>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-start justify-center gap-5 px-4 py-12 sm:px-8">
        <IconTile icon={icon} size="lg" tone="neutral" />
        <div>
          {code && <p className="figures font-mono text-[13px] tracking-wide text-muted">{code}</p>}
          <h1 className="display-serif mt-1 text-[clamp(24px,3vw,30px)] leading-tight font-semibold">{title}</h1>
          <p className="mt-2.5 max-w-[52ch] text-[15.5px] text-muted">{body}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {actions ?? (
            <ButtonLink href={home} variant="primary">
              {t.errors.home}
            </ButtonLink>
          )}
        </div>
        {footer && <div className="text-[13px] text-muted">{footer}</div>}
      </main>
    </div>
  );
}
