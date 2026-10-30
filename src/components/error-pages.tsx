"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Compass, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/primitives";
import { StatusScreen, useHomeHref } from "./status-screen";

export function NotFoundScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const home = useHomeHref();
  return (
    <>
      <PageTitle>{t.errors.notFound.title}</PageTitle>
      <StatusScreen
        icon={Compass}
        code="404"
        title={t.errors.notFound.title}
        body={t.errors.notFound.body}
        actions={<>
          <ButtonLink href={home} variant="primary">{t.errors.home}</ButtonLink>
          <Button onClick={() => router.back()}>{t.errors.back}</Button>
        </>}
      />
    </>
  );
}

export function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();
  const home = useHomeHref();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <PageTitle>{t.errors.error.title}</PageTitle>
      <StatusScreen
        icon={CloudOff}
        code="500"
        title={t.errors.error.title}
        body={t.errors.error.body}
        actions={<>
          <Button variant="primary" onClick={() => retry()}>{t.errors.error.retry}</Button>
          <ButtonLink href={home}>{t.errors.home}</ButtonLink>
        </>}
        footer={error.digest ? t.errors.error.ref(error.digest) : undefined}
      />
    </>
  );
}

export function MaintenanceScreen() {
  const { t } = useI18n();
  return (
    <>
      <PageTitle>{t.errors.maintenance.title}</PageTitle>
      <StatusScreen icon={Wrench} title={t.errors.maintenance.title} body={t.errors.maintenance.body} actions={<Button variant="primary" onClick={() => window.location.reload()}>{t.errors.error.retry}</Button>} />
    </>
  );
}
