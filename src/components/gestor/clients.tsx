"use client";

import { FEATURES } from "@/lib/features";
import { API_MODE } from "@/lib/auth/config";
import { api } from "@/lib/api/endpoints";
import { FROM_API_STATUS } from "@/lib/api/mapping";
import type { ApiClientItem } from "@/lib/api/types";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, QrCode as QrIcon, RefreshCw, UserPlus, X } from "lucide-react";
import { actions, caseOrder, clientName, useAppState } from "@/lib/data/store";
import type { Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { CopyField } from "@/components/ui/copy-field";
import { QrCode } from "@/components/ui/qr-code";
import { Button, ButtonLink, Card, CardTitle, Loading, Notice, Pill, StatusPill, cx } from "@/components/ui/primitives";
import { TopBar } from "./gestor-shell";
import { inputCls } from "./settings/settings-layout";

const AVATAR = ["bg-accent-soft text-accent", "bg-info-soft text-info", "bg-warn-soft text-warn", "bg-ok-soft text-ok"];
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
      <div className="grid items-start gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h1 className="display-tight text-[clamp(20px,2vw,24px)] font-semibold">{t.clients.title}</h1>
            <p className="mt-1 max-w-[64ch] text-[14px] text-muted">{t.clients.intro}</p>
          </div>
          {created && <Notice tone="ok">{t.clients.created(created)}</Notice>}

          <div className="overflow-clip rounded-lg border border-line bg-surface">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_150px_130px_120px_auto] gap-4 border-b border-line bg-sunk px-4 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase md:grid">
              <span>{t.clients.cols.client}</span>
              <span>{t.clients.cols.status}</span>
              <span>{FEATURES.identityCheck ? t.clients.cols.identity : ""}</span>
              <span>{t.clients.cols.invited}</span>
              <span className="w-[130px]" />
            </div>
            <ul>
              {list.map((e, i) => (
                <ClientRow key={e.id} exp={e} i={i} origin={origin} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} locale={locale} />
              ))}
            </ul>
          </div>
          <p className="text-[12.5px] text-muted">{t.clients.demoNote}</p>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-16">
          <Card className="p-5">
            <CardTitle>{t.clients.invite}</CardTitle>
            <form onSubmit={create} className="flex flex-col gap-2.5">
              <label className="sr-only" htmlFor="cl-name">{t.clients.name}</label>
              <input id="cl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.clients.name} autoComplete="off" className={inputCls} />
              <label className="sr-only" htmlFor="cl-email">{t.clients.email}</label>
              <input id="cl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.clients.email} autoComplete="off" className={inputCls} />
              <Button type="submit" variant="primary">
                <UserPlus size={16} aria-hidden="true" />
                {t.clients.create}
              </Button>
            </form>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <CardTitle>{t.clients.firmQr}</CardTitle>
            <p className="text-[13.5px] text-muted">{t.clients.firmQrBody}</p>
            {origin && (
              <>
                <QrCode value={firmLink(origin)} size={168} downloadName={`qr-${(firm.name || "gestoria").toLowerCase().replace(/\s+/g, "-")}`} downloadLabel={t.clients.downloadQr} />
                <CopyField value={firmLink(origin)} label={t.clients.link} copyLabel={t.clients.copy} copiedLabel={t.clients.copied} />
              </>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function ClientRow({ exp: e, i, origin, open, onToggle, locale }: { exp: Expediente; i: number; origin: string; open: boolean; onToggle: () => void; locale: string }) {
  const { t } = useI18n();
  const name = clientName(e) || t.common.unnamedClient;
  const link = origin ? inviteLink(origin, e.id) : "";
  return (
    <li className="border-t border-line first:border-t-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_150px_130px_120px_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", AVATAR[i % AVATAR.length])}>{initials(name)}</span>
          <span className="min-w-0">
            <Link href={`/expedientes/${e.id}`} className="block truncate font-medium hover:underline">
              {name}
            </Link>
            <span className="block truncate text-[12.5px] text-muted">{typeof e.answers.email === "string" && e.answers.email ? e.answers.email : t.list.noEmail}</span>
          </span>
        </div>
        <span className="justify-self-end md:justify-self-start">
          <StatusPill status={e.status} />
        </span>
        <span className={FEATURES.identityCheck ? "hidden md:block" : "hidden"}>
          <Pill tone={e.identityConfirmedAt ? "ok" : "neutral"}>{e.identityConfirmedAt ? t.clients.identity.ok : t.clients.identity.no}</Pill>
        </span>
        <span className="figures hidden text-[12.5px] text-muted md:block">{fmtTime(e.createdAt, locale)}</span>
        <Button size="sm" onClick={onToggle} aria-expanded={open} className="col-span-2 justify-self-start md:col-span-1 md:w-[130px]">
          <QrIcon size={14} aria-hidden="true" />
          {open ? t.clients.hide : t.clients.show}
          <ChevronDown size={14} className={cx("motion-safe:transition-[rotate] motion-safe:duration-200 motion-safe:ease-out", open && "rotate-180")} aria-hidden="true" />
        </Button>
      </div>
      {open && link && (
        <div className="flex flex-col gap-4 border-t border-line bg-sunk px-4 py-4 sm:flex-row sm:items-start">
          <QrCode value={link} size={132} downloadName={`invitacion-${e.id}`} downloadLabel={t.clients.downloadQr} />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <span className="text-[13.5px] font-medium">{t.clients.link}</span>
            <CopyField value={link} label={t.clients.link} copyLabel={t.clients.copy} copiedLabel={t.clients.copied} />
            <ButtonLink href={`/expedientes/${e.id}`} size="sm" className="self-start">
              {t.clients.openCase}
            </ButtonLink>
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
      <div className="grid items-start gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h1 className="display-tight text-[clamp(20px,2vw,24px)] font-semibold">{c.title}</h1>
            <p className="mt-1 max-w-[64ch] text-[14px] text-muted">{c.api.intro}</p>
          </div>
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

          {items === null ? (
            <Loading />
          ) : (
            <div className="overflow-clip rounded-lg border border-line bg-surface">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_150px_160px_100px_auto] gap-4 border-b border-line bg-sunk px-4 py-2 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase md:grid">
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
                    <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_150px_160px_100px_auto]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", AVATAR[i % AVATAR.length])}>{initials(x.display_name)}</span>
                        {kase ? (
                          <Link href={`/expedientes/${kase.id}`} className="min-w-0 truncate font-medium hover:underline">{x.display_name}</Link>
                        ) : (
                          <span className="min-w-0 truncate font-medium">{x.display_name}</span>
                        )}
                      </div>
                      <span className="justify-self-end md:justify-self-start">{st ? <StatusPill status={st} /> : <Pill>{c.api.noCase}</Pill>}</span>
                      <span className="flex flex-col gap-0.5">
                        <Pill tone={INVITE_TONE[x.invitation.status]} className="self-start">{c.api.state[x.invitation.status]}</Pill>
                        {x.invitation.status === "open" && x.invitation.expires_at && (
                          <span className="text-[12px] text-muted">{c.api.expires(fmtTime(x.invitation.expires_at, locale))}</span>
                        )}
                      </span>
                      <span className="figures hidden text-[12.5px] text-muted md:block">{fmtTime(x.created_at, locale)}</span>
                      <span className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:w-[200px] md:justify-end">
                        {!x.bound && (
                          <Button size="sm" onClick={() => void reissue(x)} disabled={busy}>
                            <RefreshCw size={14} aria-hidden="true" />
                            {c.api.reissue}
                          </Button>
                        )}
                        {x.invitation.status === "open" && (
                          <Button size="sm" variant="ghost" onClick={() => void revoke(x)} disabled={busy} aria-label={`${c.api.revoke}: ${x.display_name}`}>
                            <X size={14} aria-hidden="true" />
                            <span className="md:sr-only">{c.api.revoke}</span>
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
          <Card className="p-5">
            <CardTitle>{c.invite}</CardTitle>
            <form onSubmit={create} className="flex flex-col gap-2.5">
              <label className="sr-only" htmlFor="cl-name">{c.name}</label>
              <input id="cl-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={c.name} autoComplete="off" className={inputCls} />
              <Button type="submit" variant="primary" disabled={busy}>
                <UserPlus size={16} aria-hidden="true" />
                {c.create}
              </Button>
            </form>
          </Card>

          {fresh && link && (
            <Card className="flex flex-col gap-3 p-5">
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
