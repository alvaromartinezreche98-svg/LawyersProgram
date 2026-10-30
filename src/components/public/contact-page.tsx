"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { COMPANY, type CompanyKey } from "@/lib/company";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { Notice, cx } from "@/components/ui/primitives";
import { PublicShell } from "./public-shell";

type Kind = "gestoria" | "cliente" | "otro";

export const field =
  "h-(--control-h-lg) w-full rounded-md border border-line-strong bg-surface px-4 text-[16px] outline-hidden transition-colors placeholder:text-disabled hover:border-muted focus:border-focus focus:ring-4 focus:ring-focus/15";

/**
 * P6 · Contacto, editorial layout: the introduction and the form carry the
 * page; the company's details sit in a navy column beside it (below on
 * phones). There is no backend to receive messages yet, so the form opens the
 * visitor's email app with the message filled in, once the company email is
 * configured; until then a quiet note explains it after an attempt to send.
 */
export function ContactPage() {
  const { t } = useI18n();
  const c = t.pub.contact;
  const [kind, setKind] = useState<Kind>("gestoria");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");
  const [msg, setMsg] = useState("");
  const [opened, setOpened] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("tipo");
    if (k !== "cliente" && k !== "otro" && k !== "gestoria") return;
    const raf = requestAnimationFrame(() => setKind(k));
    return () => cancelAnimationFrame(raf);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!COMPANY.email) {
      setUnavailable(true);
      return;
    }
    const subject = `${c.kinds[kind]} · ${name}`;
    const body = [msg, "", `${c.name}: ${name}`, `${c.email}: ${email}`, kind === "gestoria" && firm ? `${c.firm}: ${firm}` : ""].filter((x) => x !== "").join("\n");
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <PublicShell>
      <PageTitle>{c.title}</PageTitle>
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-x-16 gap-y-12 px-4 pt-14 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:pt-20">
        {/* Introduction and form: the main column */}
        <div className="flex min-w-0 flex-col">
          <header className="border-b border-line pb-10">
            <p className="text-[12.5px] font-semibold tracking-[.14em] text-copper-text uppercase">{c.eyebrow}</p>
            <h1 className="display-serif mt-4 text-[clamp(44px,6vw,72px)] leading-[0.98] font-semibold tracking-[-0.02em]">{c.title}</h1>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-[27px] text-muted">{c.intro}</p>
          </header>

          <form onSubmit={submit} className="flex flex-col gap-7 pt-10">
            <fieldset>
              <legend className="mb-2.5 text-[14px] font-semibold">{c.kindLabel}</legend>
              {/* Segmented choice on real radios: arrow keys, labels and forms work as usual. */}
              <div className="grid gap-1 rounded-lg border border-line-strong bg-surface p-1 sm:grid-cols-3">
                {(["gestoria", "cliente", "otro"] as const).map((k) => (
                  <label
                    key={k}
                    className={cx(
                      "relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-center text-[15px] font-medium transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus",
                      kind === k ? "bg-accent text-accent-ink" : "text-muted hover:bg-hover hover:text-ink",
                    )}
                  >
                    <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="absolute inset-0 cursor-pointer opacity-0" />
                    {kind === k && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
                    {c.kinds[k]}
                  </label>
                ))}
              </div>
            </fieldset>
            {kind === "cliente" && <Notice>{c.clientNote}</Notice>}

            <div className="grid gap-7 sm:grid-cols-2">
              <Labeled id="ct-name" label={c.name}>
                <input id="ct-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
              </Labeled>
              <Labeled id="ct-email" label={c.email}>
                <input id="ct-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
              </Labeled>
            </div>
            {kind === "gestoria" && (
              <Labeled id="ct-firm" label={c.firm}>
                <input id="ct-firm" value={firm} onChange={(e) => setFirm(e.target.value)} autoComplete="organization" className={field} />
              </Labeled>
            )}
            <Labeled id="ct-msg" label={c.message}>
              <textarea id="ct-msg" required rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} className={cx(field, "h-auto min-h-40 resize-y py-3 leading-[24px]")} />
            </Labeled>

            <div className="flex flex-col-reverse gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[46ch] text-[13px] leading-5 text-muted">{c.privacy}</p>
              <button
                type="submit"
                className="group inline-flex h-(--control-h-lg) shrink-0 items-center justify-center gap-3 rounded-md bg-accent px-7 text-[16px] font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
              >
                {c.send}
                <ArrowRight size={18} aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1" />
              </button>
            </div>
            {unavailable && <Notice tone="info">{c.unavailable}</Notice>}
            {opened && <Notice tone="ok">{c.opened}</Notice>}
          </form>
        </div>

        {/* Company details: an editorial navy column */}
        <aside className="rounded-xl bg-[var(--band)] px-7 py-9 text-[var(--band-ink)] [--focus:#a9c8ff] sm:px-9 lg:sticky lg:top-24">
          <p className="text-[12px] font-semibold tracking-[.14em] text-[var(--band-copper)] uppercase">{c.details}</p>
          <dl className="mt-6">
            <Detail label={c.company}>{COMPANY.name || <PendingOnDark k="name" />}</Detail>
            <Detail label={c.email}>
              {COMPANY.email ? <a href={`mailto:${COMPANY.email}`} className="underline-offset-4 hover:underline">{COMPANY.email}</a> : <PendingOnDark k="email" />}
            </Detail>
            <Detail label={c.address}>{COMPANY.address || <PendingOnDark k="address" />}</Detail>
          </dl>
          <div className="mt-10 border-t border-[var(--band-line)] pt-8">
            <p className="display-serif text-[22px] leading-7 font-semibold">{c.clientsTitle}</p>
            <p className="mt-2 text-[15px] leading-6 text-[var(--band-muted)]">{c.clientsBox}</p>
            <Link
              href="/acceso"
              className="group mt-5 inline-flex h-(--control-h) items-center gap-2.5 rounded-md border border-[var(--band-ink)]/40 px-5 text-[15px] font-semibold transition-colors hover:border-[var(--band-ink)] hover:bg-[var(--band-ink)] hover:text-[var(--band)]"
            >
              {t.pub.nav.signIn}
              <ArrowRight size={16} aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1" />
            </Link>
          </div>
        </aside>
      </div>
    </PublicShell>
  );
}

export function Labeled({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-semibold">{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--band-line)] py-4 first:border-t-0 first:pt-0">
      <dt className="text-[12px] tracking-[.06em] text-[var(--band-muted)] uppercase">{label}</dt>
      <dd className="text-[17px] leading-6 break-words">{children}</dd>
    </div>
  );
}

/** The company detail is not configured yet: say so, never invent it. */
function PendingOnDark({ k }: { k: CompanyKey }) {
  const { t } = useI18n();
  return <span className="text-[15px] text-[var(--band-muted)] italic">{t.pub.legal.pending(t.pub.legal.fields[k])}</span>;
}
