"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarCheck, ClipboardList, LayoutDashboard, QrCode, TriangleAlert } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { useI18n } from "@/lib/i18n/use-i18n";
import { PageTitle } from "@/components/ui/app-shell";
import { HUES, IconTile } from "@/components/ui/icons";
import { Notice, cx } from "@/components/ui/primitives";
import { Labeled, field } from "./contact-page";
import { PublicShell } from "./public-shell";

const SEE_ICONS = [QrCode, ClipboardList, TriangleAlert, LayoutDashboard];

/**
 * P5 · Solicitar demo, for gestorías. Same mechanism as the contact page: with
 * no backend to receive it yet, the request opens the visitor's email app
 * filled in, once the company email is configured.
 */
export function DemoPage() {
  const { t } = useI18n();
  const c = t.extra.demo;
  const pc = t.pub.contact;
  const [f, setF] = useState({ name: "", firm: "", email: "", phone: "", size: "", msg: "" });
  const [opened, setOpened] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!COMPANY.email) {
      setUnavailable(true);
      return;
    }
    const body = [
      `${c.name}: ${f.name}`,
      `${c.firm}: ${f.firm}`,
      `${c.email}: ${f.email}`,
      f.phone && `${c.phone}: ${f.phone}`,
      f.size && `${c.size}: ${f.size}`,
      f.msg && `\n${f.msg}`,
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(c.subject(f.firm))}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <PublicShell>
      <PageTitle>{c.title}</PageTitle>
      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-x-16 gap-y-12 px-4 pt-14 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:pt-20">
        <div className="flex min-w-0 flex-col">
          <header className="border-b border-line pb-10">
            <p className="text-[12.5px] font-semibold tracking-[.14em] text-copper-text uppercase">{c.eyebrow}</p>
            <h1 className="display-serif mt-4 text-[clamp(40px,5.4vw,64px)] leading-[1] font-semibold tracking-[-0.02em]">{c.title}</h1>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-[27px] text-muted">{c.intro}</p>
          </header>

          <form onSubmit={submit} className="flex flex-col gap-7 pt-10">
            <div className="grid gap-7 sm:grid-cols-2">
              <Labeled id="dm-name" label={c.name}>
                <input id="dm-name" required value={f.name} onChange={set("name")} autoComplete="name" className={field} />
              </Labeled>
              <Labeled id="dm-firm" label={c.firm}>
                <input id="dm-firm" required value={f.firm} onChange={set("firm")} autoComplete="organization" className={field} />
              </Labeled>
              <Labeled id="dm-email" label={c.email}>
                <input id="dm-email" type="email" required value={f.email} onChange={set("email")} autoComplete="email" className={field} />
              </Labeled>
              <Labeled id="dm-phone" label={c.phone}>
                <input id="dm-phone" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" className={field} />
              </Labeled>
            </div>
            <Labeled id="dm-size" label={c.size}>
              <select id="dm-size" value={f.size} onChange={set("size")} className={cx(field, "sm:max-w-[320px]")}>
                <option value="">—</option>
                {c.sizes.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </Labeled>
            <Labeled id="dm-msg" label={c.message}>
              <textarea id="dm-msg" rows={4} value={f.msg} onChange={set("msg")} className={cx(field, "h-auto min-h-28 resize-y py-3 leading-[24px]")} />
            </Labeled>

            <div className="flex flex-col-reverse gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[46ch] text-[13px] leading-5 text-muted">{pc.privacy}</p>
              <button type="submit" className="group inline-flex h-(--control-h-lg) shrink-0 items-center justify-center gap-3 rounded-md bg-accent px-7 text-[16px] font-semibold text-accent-ink transition-colors hover:bg-accent-hover">
                {c.send}
                <ArrowRight size={18} aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1" />
              </button>
            </div>
            {unavailable && <Notice tone="info">{pc.unavailable}</Notice>}
            {opened && <Notice tone="ok">{pc.opened}</Notice>}
          </form>
        </div>

        {/* What the demo covers */}
        <aside className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-7 shadow-sheet lg:sticky lg:top-24">
          <p className="flex items-center gap-3">
            <IconTile icon={CalendarCheck} tone="teal" />
            <span className="display-serif text-[22px] leading-7 font-semibold">{c.seeTitle}</span>
          </p>
          <ul className="flex flex-col gap-4">
            {c.see.map((x, i) => (
              <li key={x} className="flex items-start gap-3 text-[15px] leading-6">
                <IconTile icon={SEE_ICONS[i]} tone={HUES[i % HUES.length]} size="xs" className="mt-0.5" />
                {x}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </PublicShell>
  );
}
