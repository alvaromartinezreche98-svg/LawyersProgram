"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, LogIn, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, ButtonLink, Notice } from "@/components/ui/primitives";
import { field } from "./contact-page";
import { PublicShell } from "./public-shell";
import { FieldIcon } from "@/components/ui/field-icon";

/**
 * P6 on a gestoría's domain: its clients contact the gestoría, not PreRenta.
 * The details come from the gestoría's settings; nothing is invented when they
 * are missing. Clients with a case file are pointed to Mensajes.
 */
export function FirmContactPage() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const c = t.pub.firmContact;
  const name = firm.name.trim() || t.landing.yourFirm;
  const any = !!(firm.phone || firm.email || firm.address);
  const [from, setFrom] = useState("");
  const [mail, setMail] = useState("");
  const [msg, setMsg] = useState("");
  const [opened, setOpened] = useState(false);

  // No backend receives messages: the form opens the visitor's email app addressed to the gestoría (as on P6).
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = [msg, "", `${t.pub.contact.name}: ${from}`, `${t.pub.contact.email}: ${mail}`].join("\n");
    window.location.href = `mailto:${firm.email}?subject=${encodeURIComponent(c.subject(from))}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <PublicShell>
      <PageTitle>{c.title(name)}</PageTitle>
      <div className="mx-auto grid w-full max-w-page items-start gap-x-16 gap-y-10 px-4 pt-14 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:pt-20">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="border-b border-line pb-8">
            <p className="t-eyebrow text-accent">{c.eyebrow}</p>
            <h1 className="display-serif mt-4 text-[clamp(36px,5vw,56px)] leading-[1.02] font-semibold tracking-[-0.02em]">{c.title(name)}</h1>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-[27px] text-muted">{c.intro}</p>
          </header>

          {any ? (
            <dl className="ledger max-w-[560px]">
              {firm.phone && (
                <Row icon={Phone} label={c.phone}>
                  <a href={`tel:${firm.phone.replace(/\s+/g, "")}`} className="text-accent underline-offset-4 hover:underline">{firm.phone}</a>
                </Row>
              )}
              {firm.email && (
                <Row icon={Mail} label={c.email}>
                  <a href={`mailto:${firm.email}`} className="text-accent underline-offset-4 hover:underline">{firm.email}</a>
                </Row>
              )}
              {firm.address && <Row icon={MapPin} label={c.address}>{firm.address}</Row>}
            </dl>
          ) : (
            <p className="text-[15px] text-muted">{c.none}</p>
          )}

          {/* For people without a case file yet; only when the gestoría has published an email to receive it. */}
          {firm.email && (
            <form onSubmit={submit} className="flex max-w-[640px] flex-col gap-5 border-t border-line pt-8">
              <div>
                <h2 className="display-tight text-[20px] font-semibold">{c.formTitle}</h2>
                <p className="mt-1 text-[15px] text-muted">{c.formIntro(name)}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                  {t.pub.contact.name}
                  <input required value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="name" className={field} />
                </label>
                <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                  {t.pub.contact.email}
                  <FieldIcon kind="email"><input type="email" required value={mail} onChange={(e) => setMail(e.target.value)} autoComplete="email" className={field} /></FieldIcon>
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                {t.pub.contact.message}
                <textarea required rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} className={`${field} h-auto min-h-32`} />
              </label>
              <Button type="submit" variant="primary" size="lg" className="self-start">
                <Mail size={17} aria-hidden="true" />
                {t.pub.contact.send}
              </Button>
              {opened && <Notice tone="ok">{t.pub.contact.opened}</Notice>}
            </form>
          )}
        </div>

        {/* Clients with a case file write from Mensajes, where the answer lands next to their return. */}
        <aside className="on-dark flex flex-col items-start gap-4 rounded-xl bg-[var(--band)] px-7 py-8 text-[var(--band-ink)] sm:px-9 lg:sticky lg:top-24">
          <span className="grid size-11 place-items-center rounded-lg bg-white text-accent" aria-hidden="true">
            <MessageCircle size={22} strokeWidth={2.1} />
          </span>
          <p className="display-serif text-[22px] leading-7 font-semibold">{c.chatTitle}</p>
          <p className="text-[15px] leading-6 text-[var(--band-muted)]">{c.chatBody}</p>
          <ButtonLink href="/acceso?next=/mensajes" variant="inverse">
            <LogIn size={16} aria-hidden="true" />
            {c.chatCta}
            <ArrowRight size={16} aria-hidden="true" />
          </ButtonLink>
        </aside>
      </div>
    </PublicShell>
  );
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline-flex items-center gap-2">
        <Icon size={14} aria-hidden="true" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
