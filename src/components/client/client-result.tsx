"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FileCheck2, MessageCircle, ThumbsUp } from "lucide-react";
import { actions, clientName } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { IconTile } from "@/components/ui/icons";
import { Button, ButtonLink, Card, EmptyState, Eyebrow, Notice } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { useClientExp } from "./client-shell";

/** C6 · Resultado: the client reviews the result and gives their approval (conformidad). */
export function ClientResult() {
  const exp = useClientExp();
  const { t, locale } = useI18n();
  const r = exp.result;
  const url = useFileUrl(r?.file ?? null);
  const [ok, setOk] = useState(false);
  const [asking, setAsking] = useState(false);
  const approved = !!r?.approval && r.approval.version === r.version;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>{t.titles.result}</PageTitle>
      <div>
        <Eyebrow>{t.home.eyebrow(exp.ejercicio)}</Eyebrow>
        <h1 className="display-serif mt-1.5 text-[clamp(22px,2.2vw,26px)] font-semibold">{t.result.title}</h1>
        {r && <p className="mt-2 text-muted">{t.result.intro}</p>}
      </div>

      {!r ? (
        <Card>
          <EmptyState inset iconTone="green" icon={FileCheck2} title={t.result.none} />
        </Card>
      ) : (
        <Card className="overflow-clip">
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-5">
            <div>
              <span className={r.kind === "devolver" ? "text-[13px] font-medium text-ok" : "text-[13px] font-medium text-warn"}>{t.result.kind[r.kind]}</span>
              <b className="figures mt-1 block text-[32px] leading-none font-semibold">{r.amount} €</b>
            </div>
            <span className="text-[12.5px] text-muted">{t.resultG.sentOn(fmtTime(r.sentAt, locale), r.version)}</span>
          </div>
          {(r.file || r.note) && (
            <div className="flex flex-col gap-3 border-t border-line px-5 py-4">
              {r.file && (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-sunk px-3 py-2 text-[14px]">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted">{t.result.draft}: </span>
                    {r.file.name}
                  </span>
                  {url && (
                    <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                      {t.result.open}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
              {r.note && (
                <p className="text-[14px]">
                  <span className="font-medium">{t.result.note}: </span>
                  {r.note}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-line bg-sunk px-5 py-4">
            {approved ? (
              <div className="flex items-center gap-3">
                <IconTile icon={ThumbsUp} tone="ok" />
                <span className="text-[14.5px] text-ok">{t.result.approved(fmtTime(r.approval!.approvedAt, locale))}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="lg" onClick={() => { setOk(false); setAsking(true); }}>
                    <ThumbsUp size={16} aria-hidden="true" />
                    {t.result.approve}
                  </Button>
                  <Link href="/mensajes" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline">
                    <MessageCircle size={15} aria-hidden="true" />
                    {t.result.questions}
                  </Link>
                </div>
              </>
            )}
            <p className="text-[12.5px] text-muted">{t.result.record}</p>
          </div>
        </Card>
      )}
      {!approved && r && <Notice tone="info">{t.result.banner(t.result.kind[r.kind], `${r.amount} €`)}</Notice>}
      {r && (
        <Dialog
          open={asking}
          title={t.result.confirmTitle}
          onClose={() => setAsking(false)}
          footer={
            <>
              <ButtonLink href="/mensajes" size="lg"><MessageCircle size={17} aria-hidden="true" />{t.home.doubts}</ButtonLink>
              <Button
                variant="primary"
                size="lg"
                disabled={!ok}
                onClick={() => {
                  actions.approveResult(exp.id, clientName(exp));
                  setAsking(false);
                }}
              >
                {t.result.approve}
              </Button>
            </>
          }
        >
          <dl className="grid grid-cols-[minmax(110px,35%)_1fr] gap-x-3 gap-y-1.5 text-[15px]">
            <dt className="text-muted">{t.result.resultLabel}</dt>
            <dd className="figures font-semibold">{t.result.kind[r.kind]} {r.amount} €</dd>
            <dt className="text-muted">{t.result.versionLabel}</dt>
            <dd>{t.result.versionValue(r.version, fmtTime(r.sentAt, locale))}</dd>
          </dl>
          <p>{t.result.confirmBody(`${t.result.kind[r.kind].toLowerCase()} ${r.amount} €`)}</p>
          <label className="flex cursor-pointer items-start gap-3 leading-[22px]">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
            {t.result.confirm}
          </label>
        </Dialog>
      )}
    </div>
  );
}
