"use client";

import { FEATURES } from "@/lib/features";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, History, ClipboardList, CreditCard, FileCheck2, FileText, House, MessageCircle, UserRound } from "lucide-react";
import type { Expediente } from "@/lib/data/types";
import { clientName, unreadFor, useAppState } from "@/lib/data/store";
import { casesOfClient, latestCase } from "@/lib/data/years";
import { useSignInRedirect } from "@/lib/data/use-sign-in-redirect";
import { API_MODE } from "@/lib/auth/config";
import { useRemoteCase, useRemoteClientCase } from "@/lib/api/use-remote";
import { useI18n } from "@/lib/i18n/use-i18n";
import { AppShell } from "@/components/ui/app-shell";
import { Loading } from "@/components/ui/primitives";

const ClientCtx = createContext<Expediente | null>(null);

/** The signed-in client's case. Only usable inside ClientShell. */
export function useClientExp() {
  const e = useContext(ClientCtx);
  if (!e) throw new Error("useClientExp outside ClientShell");
  return e;
}

export function ClientShell({ children }: { children: ReactNode }) {
  const { ready, session, exps, firm } = useAppState();
  const { t } = useI18n();
  const signedIn = session?.role === "cliente" ? exps[session.expId] : undefined;
  const exp = signedIn ? latestCase(exps, signedIn) : undefined;
  // API mode: after a reload the session is here before the case; load it (and keep it fresh) instead of signing out.
  const waiting = API_MODE && session?.role === "cliente" && !exp;
  useRemoteClientCase(waiting);
  useRemoteCase(exp?.id, false);
  useSignInRedirect(!!exp || waiting);
  const path = usePathname();
  const router = useRouter();
  // C1: until the client confirms who they are, the welcome page is the only page.
  const mustWelcome = FEATURES.identityCheck && !!exp && !exp.identityConfirmedAt && path !== "/bienvenida" && path !== "/verificacion";
  useEffect(() => {
    if (mustWelcome) router.replace("/bienvenida");
  }, [mustWelcome, router]);
  if (!ready || !exp || mustWelcome) return <Loading />;
  return (
    <AppShell
      who={clientName(exp) || t.common.unnamedClient}
      org={firm.name.trim() || undefined}
      nav={FEATURES.identityCheck && !exp.identityConfirmedAt ? [] : [
        { href: "/inicio", label: t.nav.home, icon: House },
        { href: "/declaracion", label: t.nav.declaration, short: t.nav.declShort, match: "/declaracion", icon: ClipboardList },
        { href: "/documentos", label: t.nav.documents, icon: FileText, phoneMore: true },
        { href: "/mensajes", label: t.nav.messages, badge: unreadFor(exp, "cliente"), icon: MessageCircle },
        ...(FEATURES.resultApproval && exp.result ? [{ href: "/resultado", label: t.nav.result, icon: FileCheck2 }] : []),
        ...(FEATURES.payments ? [{ href: "/pago", label: t.nav.pay, icon: CreditCard }] : []),
        ...(FEATURES.appointments ? [{ href: "/cita", label: t.nav.cita, icon: CalendarDays }] : []),
        ...(FEATURES.prefill && casesOfClient(exps, exp).length > 1 ? [{ href: "/historial", label: t.nav.history, icon: History }] : []),
        { href: "/perfil", label: t.nav.profile, icon: UserRound },
      ]}
    >
      <ClientCtx.Provider value={exp}>{children}</ClientCtx.Provider>
    </AppShell>
  );
}
