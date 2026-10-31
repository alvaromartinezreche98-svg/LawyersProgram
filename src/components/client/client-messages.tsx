"use client";

import { ClipboardList, FileText, MessageCircle } from "lucide-react";
import { useState } from "react";
import { collectDocs, overall } from "@/lib/questionnaire/progress";
import { sectionBySlug } from "@/lib/questionnaire/schema";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ChatBox } from "@/components/chat/chat-box";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { ButtonLink, Card, Eyebrow, ProgressBar } from "@/components/ui/primitives";
import { useClientExp } from "./client-shell";

/** C5 · Mensajes: chat with the gestoría, with the state of the case alongside. */
export function ClientMessages() {
  const exp = useClientExp();
  const { t } = useI18n();
  const { p, tr } = usePlatformText();
  // "?sobre=<section>" (from the questionnaire guide) starts the message with the section's name.
  // This page only renders after the store is ready in the browser, so reading the URL here is safe.
  const [draft] = useState(() => {
    const sec = sectionBySlug(new URLSearchParams(window.location.search).get("sobre") ?? "");
    return sec ? p.guide.askDraft(tr(sec.short)) : "";
  });
  const tt = overall(exp.answers);
  const missing = collectDocs(exp.answers).filter((d) => !d.files.length).length;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.messages}</PageTitle>
      <div>
        <Eyebrow>{t.nav.messages}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.msgs.title}</h1>
        <p className="mt-2 text-muted">{t.msgs.sub}</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-clip">
          <ChatBox exp={exp} side="cliente" height="h-[clamp(360px,calc(100dvh-450px),640px)]" initialDraft={draft} />
        </Card>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--app-header,64px)+1.5rem)]">
          <Card className="soft-wash flex flex-col gap-3 p-5">
            <IconTile icon={MessageCircle} tone="info" />
            <h2 className="display-tight text-[16px] font-semibold">{t.msgs.sideTitle}</h2>
            <p className="text-sm text-muted">{t.msgs.sideBody}</p>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <IconTile icon={ClipboardList} size="sm" />
              <span className="flex-1 text-sm font-semibold">{t.q.progress}</span>
              <b className="font-mono text-sm font-medium">{tt.pct} %</b>
            </div>
            <ProgressBar pct={tt.pct} />
            <ButtonLink href="/declaracion" size="sm">
              {t.msgs.goQuestionnaire}
            </ButtonLink>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <IconTile icon={FileText} size="sm" tone={missing ? "warn" : "ok"} />
              <span className="flex-1 text-sm">{missing ? t.home.docsMissing(missing) : t.home.docsDone}</span>
            </div>
            <ButtonLink href="/documentos" size="sm">
              {t.msgs.goDocuments}
            </ButtonLink>
          </Card>
        </aside>
      </div>
    </div>
  );
}
