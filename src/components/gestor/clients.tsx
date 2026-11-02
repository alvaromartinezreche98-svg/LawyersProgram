"use client";

import { FEATURES } from "@/lib/features";
import { API_MODE } from "@/lib/auth/config";
import { api } from "@/lib/api/endpoints";
import { FROM_API_STATUS } from "@/lib/api/mapping";
import type { ApiClientItem } from "@/lib/api/types";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ChevronDown, Mail, QrCode as QrIcon, RefreshCw, UserPlus, X } from "lucide-react";
import { actions, caseOrder, clientName, useAppState } from "@/lib/data/store";
import type { Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { CopyField } from "@/components/ui/copy-field";
import { QrCode } from "@/components/ui/qr-code";
import { Button, ButtonLink, Card, CardTitle, Loading, Notice, Pill, StatusPill, cx } from "@/components/ui/primitives";
import { PageHead } from "./page-head";
import { TopBar } from "./gestor-shell";
import { inputCls } from "./settings/settings-layout";
import { FieldIcon } from "@/components/ui/field-icon";

const AVATAR = ["bg-accent text-accent-ink"];
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/** Delivery 1 invitation links: they sign the client in on this browser (see access-screen). Older "/?…" links still forward to /acceso. */
export const inviteLink = (origin: string, id: string) => `${origin}/invitacion/${encodeURIComponent(id)}`;
export const firmLink = (origin: string) => `${origin}/acceso?alta=1`;

/** G4 · Clientes: the API's clients and invitations when connected, the browser demo otherwise. */
export function Clients() {
  return API_MODE ? <ApiClients /> : <DemoClients />;
}

/** Demo: invite clients by link or QR; each invitation creates their case in this browser. */
function DemoClients() {
  const { exps, firm } = useAppState();
  const { t, locale } = useI18n();
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const list = caseOrder(exps).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOrigin(window.location.origin));
    return () => cancelAnimationFrame(raf);
  }, []);

  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = actions.createClient(name.trim(), email.trim());
    setCreated(name.trim());
    setOpen(id);
    setName("");
    setEmail("");
  };

  return (
    <>
      <PageTitle>{t.titles.clients}</PageTitle>
      <TopBar crumbs={[{ label: t.clients.title }]} />
      <div className="grid items-start gap-5 px-4 py-5 max-sm:pt-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-x-10">
        <div className="flex min-w-0 flex-col gap-4">
          <PageHead title={t.clients.title} intro={t.clients.intro} />
          {created && <Notice tone="ok">{t.clients.created(created)}</Notice>}

          <div className="overflow-clip rounded-lg border border-line bg-surface">
            <div className="table-head hidden grid-cols-[minmax(0,1fr)_116px_120px_96px_156px] gap-4 md:grid">
              <span>{t.clients.cols.client}</span>
              <span>{t.clients.cols.status}</span>
              <span>{FEATURES.identityCheck ? t.clients.cols.identity : ""}</span>
              <span>{t.clients.cols.invited}</span>
              <span />
            </div>
            <ul>
              {list.map((e, i) => (
                <ClientRow key={e.id} exp={e} i={i} origin={origin} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} locale={locale} />
              ))}
            </ul>
          </div>
        </div>

        {/*
          The page's main action as a panel (navy rule, sunk ground, like the sign-in panel):
          the invite form always open; the gestoría's own QR behind a shortcut at its foot.
        */}
        <aside className="xl:sticky xl:top-6">
          <section aria-labelledby="inv-title" className="overflow-clip rounded-lg border border-line border-t-[3px] border-t-accent bg-sunk">
            <div className="flex flex-col gap-3 p-5">
              <h2 id="inv-title" className="flex items-center gap-2 text-[16px] font-semibold">
                <UserPlus size={17} className="text-accent" aria-hidden="true" />
                {t.clients.invite}
              </h2>
              <form onSubmit={create} className="flex flex-col gap-2.5">
                <label className="sr-only" htmlFor="cl-name">{t.clients.name}</label>
                <input id="cl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.clients.name} autoComplete="off" className={inputCls} />
                <label className="sr-only" htmlFor="cl-email">{t.clients.email}</label>
                <FieldIcon kind="email"><input id="cl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.clients.email} autoComplete="off" className={inputCls} /></FieldIcon>
                <Button type="submit" variant="primary" size="lg">
                  <UserPlus size={16} aria-hidden="true" />
                  {t.clients.create}
                </Button>
              </form>
            </div>
            <button
              type="button"
              aria-expanded={qrOpen}
              aria-controls="firm-qr"
              onClick={() => setQrOpen(!qrOpen)}
              className="flex w-full items-center gap-3 border-t border-line bg-surface px-5 py-3.5 text-left transition-colors hover:bg-hover"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-icon-soft text-icon" aria-hidden="true">
                <QrIcon size={18} />
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-semibold">{t.clients.firmQr}</span>
              <ChevronDown size={16} className={cx("shrink-0 text-muted motion-safe:transition-[rotate] motion-safe:duration-200", qrOpen && "rotate-180")} aria-hidden="true" />
            </button>
            {qrOpen && (
              <div id="firm-qr" className="flex flex-col gap-3 border-t border-line bg-surface px-5 pt-1 pb-5">
                <p className="text-[13.5px] text-muted">{t.clients.firmQrBody}</p>
                {origin && (
                  <>
                    <QrCode value={firmLink(origin)} size={148} downloadName={`qr-${(firm.name || "gestoria").toLowerCase().replace(/\s+/g, "-")}`} downloadLabel={t.clients.downloadQr} />
                    <CopyField value={firmLink(origin)} label={t.clients.link} copyLabel={t.clients.copy} copiedLabel={t.clients.copied} />
                  </>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

// Phones: the status as a small coloured dot before its name (the same colours as the board's columns).
const STATUS_DOT: Record<Expediente["status"], string> = { borrador: "bg-line-strong", enviado: "bg-info", revision: "bg-warn", listo: "bg-ok" };

function ClientRow({ exp: e, i, origin, open, onToggle, locale }: { exp: Expediente; i: number; origin: string; open: boolean; onToggle: () => void; locale: string }) {
  const { t, status: statusLabel } = useI18n();
  const name = clientName(e) || t.common.unnamedClient;
  const link = origin ? inviteLink(origin, e.id) : "";
  const { firm } = useAppState();
  const firmName = firm.name.trim() || t.landing.yourFirm;
  const mail = typeof e.answers.email === "string" ? e.answers.email : "";
  const first = (clientName(e) || "").split(/\s+/)[0] ?? "";
  // The panel mounts collapsed and expands on the next frame, so opening animates as well.
  const [everOpened, setEverOpened] = useState(open);
  const [expanded, setExpanded] = useState(open);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (open) setEverOpened(true);
      requestAnimationFrame(() => setExpanded(open));
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);
  return (
    <li className="border-t border-line first:border-t-0">
      {/* Phones: one compact line per client (avatar, name, a small status dot with the email under it, a QR icon button); from md the table row. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_116px_120px_96px_156px] md:gap-x-4 md:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", AVATAR[i % AVATAR.length])}>{initials(name)}</span>
          <span className="min-w-0">
            <Link href={`/expedientes/${e.id}`} className="block truncate text-[14.5px] leading-5 font-medium hover:underline">
              {name}
            </Link>
            <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] leading-[18px] text-muted">
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-ink/75 md:hidden">
                <span className={cx("size-2 rounded-full", STATUS_DOT[e.status])} aria-hidden="true" />
                {statusLabel(e.status)}
                <span aria-hidden="true" className="font-normal text-muted">·</span>
              </span>
              <span className="truncate">{typeof e.answers.email === "string" && e.answers.email ? e.answers.email : t.list.noEmail}</span>
            </span>
          </span>
        </div>
        {/* cells are flex rows centred on the row, so labels sit at the same height whatever their content */}
        <span className="hidden items-center md:flex md:justify-self-start">
          <StatusPill status={e.status} />
        </span>
        <span className={FEATURES.identityCheck ? "hidden items-center md:flex" : "hidden"}>
          <Pill tone={e.identityConfirmedAt ? "ok" : "neutral"}>{e.identityConfirmedAt ? t.clients.identity.ok : t.clients.identity.no}</Pill>
        </span>
        <span className="figures hidden text-[12.5px] text-muted md:block">{fmtTime(e.createdAt, locale)}</span>
        <Button size="sm" onClick={onToggle} aria-expanded={open} aria-controls={`inv-${e.id}`} aria-label={open ? t.clients.hide : t.clients.show} title={open ? t.clients.hide : t.clients.show} className={cx("justify-self-end [&_svg]:shrink-0 max-md:size-10 max-md:px-0", open && "max-md:bg-accent max-md:text-accent-ink")}>
          <QrIcon size={14} aria-hidden="true" className="max-md:size-[18px]" />
          <span className="max-md:hidden">{open ? t.clients.hide : t.clients.show}</span>
          <ChevronDown size={14} className={cx("max-md:hidden motion-safe:transition-[rotate] motion-safe:duration-200 motion-safe:ease-out", open && "rotate-180")} aria-hidden="true" />
        </Button>
      </div>
      {/*
        Opens and closes by animating the row height (grid rows 0fr ↔ 1fr), so there is no jump.
        Mounted on first open and kept after closing (inert), so closing can animate too.
      */}
      {(open || everOpened) && link && (
        <div
          id={`inv-${e.id}`}
          inert={!open}
          className={cx("grid border-line bg-surface motion-safe:transition-[grid-template-rows,border-color] motion-safe:duration-300 motion-safe:ease-out", expanded ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t border-transparent")}
        >
        <div className="min-h-0 overflow-hidden">
        {/* Two columns at every width: the QR (and its download) on the left, the link and actions beside it;
            on phones the actions stack full width in that column, so the panel stays short. */}
        <div className="flex items-start gap-3 px-4 py-4 sm:gap-4">
          <QrCode value={link} size={132} downloadName={`invitacion-${e.id}`} downloadLabel={t.clients.downloadQr} className="shrink-0 max-sm:[&>div:first-child]:size-[112px]!" />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 max-sm:gap-2">
            <span className="text-[13.5px] font-medium max-sm:text-[13px]">{t.clients.link}</span>
            <CopyField compact value={link} label={t.clients.link} copyLabel={t.clients.copy} copiedLabel={t.clients.copied} />
            <span className="flex flex-wrap gap-2 max-sm:flex-col max-sm:[&>*]:justify-center">
              {/* A ready-made email in the gestoría's own mail app: nothing is sent from PreRenta. */}
              <ButtonLink href={`mailto:${encodeURIComponent(mail)}?subject=${encodeURIComponent(t.clients.emailSubject(firmName))}&body=${encodeURIComponent(t.clients.emailBody(first, firmName, link))}`} size="sm" variant="outline">
                <Mail size={14} aria-hidden="true" />
                {t.clients.sendEmail}
              </ButtonLink>
              <ButtonLink href={`/expedientes/${e.id}`} size="sm" variant="primary">
                {t.clients.openCase}
                <ArrowRight size={14} aria-hidden="true" />
              </ButtonLink>
            </span>
          </div>
        </div>
        </div>
        </div>
      )}
    </li>
  );
}

/** The link a client opens to accept their invitation. The code travels in the fragment, so it never reaches a server log. */
export const apiInviteLink = (origin: string, code: string) => `${origin}/entrar#code=${encodeURIComponent(code)}`;

type Fresh = { clientId: string; name: string; code: string; expiresAt: string };
const INVITE_TONE = { open: "info", expired: "warn", accepted: "ok", none: "neutral" } as const;

/**
 * API mode: clients come from /v1/clients. A new client, or a new invitation,
 * returns the code once; it is shown here as a link and a QR drawn in the
 * browser (never sent to a QR service) until the page is left.
 */
function ApiClients() {
  const { t, locale } = useI18n();
  const c = t.clients;
  const [items, setItems] = useState<ApiClientItem[] | null>(null);
  const [origin, setOrigin] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<Fresh | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const load = async () => {
    const all: ApiClientItem[] = [];
    let cursor: string | undefined;
    do {
      const page = await api.clients(cursor);
      all.push(...page.items);
      cursor = page.next_cursor ?? undefined;
    } while (cursor && all.length < 2000);
    setItems(all.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setOrigin(window.location.origin);
      load().catch(() => setItems([]));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setNotice(null);
    try {
      await f();
      await load();
    } catch {
      setNotice({ tone: "bad", text: c.api.failed });
    } finally {
      setBusy(false);
    }
  };

  const create = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    void run(async () => {
      const r = await api.createClient(n);
      setFresh({ clientId: r.client.id, name: r.client.display_name, code: r.invitation.code, expiresAt: r.invitation.expires_at });
      setNotice({ tone: "ok", text: c.created(n) });
      setName("");
    });
  };
  const reissue = (x: ApiClientItem) =>
    run(async () => {
      const inv = await api.reissueInvitation(x.id);
      setFresh({ clientId: x.id, name: x.display_name, code: inv.code, expiresAt: inv.expires_at });
    });
  const revoke = (x: ApiClientItem) =>
    run(async () => {
      await api.revokeInvitation(x.id);
      if (fresh?.clientId === x.id) setFresh(null);
      setNotice({ tone: "ok", text: c.api.revoked });
    });

  const link = fresh && origin ? apiInviteLink(origin, fresh.code) : "";

  return (
    <>
      <PageTitle>{t.titles.clients}</PageTitle>
      <TopBar crumbs={[{ label: c.title }]} />
      <div className="grid items-start gap-5 px-4 py-5 max-sm:pt-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-x-10">
        <div className="flex min-w-0 flex-col gap-4">
          <PageHead title={c.title} intro={c.api.intro} />
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

          {items === null ? (
            <Loading />
          ) : (
            <div className="@container overflow-clip rounded-lg border border-line bg-surface">
              <div className="table-head hidden grid-cols-[minmax(0,1fr)_160px_150px_96px_auto] gap-4 @4xl:grid">
                <span>{c.cols.client}</span>
                <span>{c.cols.status}</span>
                <span>{c.link}</span>
                <span>{c.cols.invited}</span>
                <span className="w-[200px]" />
              </div>
              {items.length === 0 && <p className="px-4 py-6 text-[14px] text-muted">{c.api.empty}</p>}
              <ul>
                {items.map((x, i) => {
                  const kase = x.cases[0];
                  const st = kase ? FROM_API_STATUS[kase.status as keyof typeof FROM_API_STATUS] : undefined;
                  return (
                    <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 @4xl:grid-cols-[minmax(0,1fr)_160px_150px_96px_auto]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", AVATAR[i % AVATAR.length])}>{initials(x.display_name)}</span>
                        {kase ? (
                          <Link href={`/expedientes/${kase.id}`} className="min-w-0 truncate font-medium hover:underline">{x.display_name}</Link>
                        ) : (
                          <span className="min-w-0 truncate font-medium">{x.display_name}</span>
                        )}
                      </div>
                      <span className="justify-self-end @4xl:justify-self-start">{st ? <StatusPill status={st} /> : <Pill>{c.api.noCase}</Pill>}</span>
                      <span className="flex flex-col gap-0.5">
                        <Pill tone={INVITE_TONE[x.invitation.status]} className="self-start">{c.api.state[x.invitation.status]}</Pill>
                        {x.invitation.status === "open" && x.invitation.expires_at && (
                          <span className="text-[12px] text-muted">{c.api.expires(fmtTime(x.invitation.expires_at, locale))}</span>
                        )}
                      </span>
                      <span className="figures hidden text-[12.5px] text-muted @4xl:block">{fmtTime(x.created_at, locale)}</span>
                      <span className="col-span-2 flex flex-wrap gap-2 @4xl:col-span-1 @4xl:w-[200px] @4xl:justify-end">
                        {!x.bound && (
                          <Button size="sm" onClick={() => void reissue(x)} disabled={busy}>
                            <RefreshCw size={14} aria-hidden="true" />
                            {c.api.reissue}
                          </Button>
                        )}
                        {x.invitation.status === "open" && (
                          <Button size="sm" variant="ghost" onClick={() => void revoke(x)} disabled={busy} aria-label={`${c.api.revoke}: ${x.display_name}`}>
                            <X size={14} aria-hidden="true" />
                            <span className="@4xl:sr-only">{c.api.revoke}</span>
                          </Button>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-[calc(var(--app-header,64px)+1.25rem)]">
          <Card >
            <CardTitle>{c.invite}</CardTitle>
            <form onSubmit={create} className="flex flex-col gap-2.5">
              <label className="sr-only" htmlFor="cl-name">{c.name}</label>
              <input id="cl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={c.name} autoComplete="off" className={inputCls} />
              <Button type="submit" variant="primary" loading={busy}>
                <UserPlus size={16} aria-hidden="true" />
                {c.create}
              </Button>
            </form>
          </Card>

          {fresh && link && (
            <Card className="flex flex-col gap-4">
              <CardTitle>{fresh.name}</CardTitle>
              <Notice tone="warn">{c.api.once}</Notice>
              <QrCode value={link} size={168} downloadName={`invitacion-${initials(fresh.name).toLowerCase()}`} downloadLabel={c.downloadQr} />
              <CopyField value={link} label={c.link} copyLabel={c.copy} copiedLabel={c.copied} />
              <p className="text-[12.5px] text-muted">{c.api.expires(fmtTime(fresh.expiresAt, locale))}</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
