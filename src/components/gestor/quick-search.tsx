"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, Contact, FolderOpen, Inbox, LayoutDashboard, Search, Settings, Wallet, type LucideIcon } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { clientName, useAppState } from "@/lib/data/store";
import { STATUSES } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { IconTile } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Hit = { key: string; href: string; icon: LucideIcon; title: string; meta?: string };

/** Opens the search from anywhere in the panel: Ctrl/⌘ + K, or "/" outside a text field. */
export function useQuickSearchKey(open: () => void) {
  useEffect(() => {
    const k = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
}

/** Quick search over the firm's cases (name, email, phone) and the panel's screens. */
export function QuickSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { exps } = useAppState();
  const { t, tr } = useI18n();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const pages = useMemo(() => {
    const all: [LucideIcon, string, string, boolean][] = [
      [Inbox, t.nav.cases, "/expedientes", true],
      [LayoutDashboard, t.side.board, "/panel", FEATURES.campaignBoard],
      [Contact, t.side.clients, "/clientes", true],
      [CalendarDays, t.side.appointments, "/citas", FEATURES.appointments],
      [Wallet, t.side.payments, "/cobros", FEATURES.payments],
      [Settings, t.side.settings, "/ajustes/despacho", FEATURES.firmSettings],
    ];
    return all.filter((x) => x[3]).map(([icon, title, href]): Hit => ({ key: href, href, icon, title }));
  }, [t]);

  const query = norm(q.trim());
  const hits = useMemo(() => {
    const cases = Object.values(exps)
      .map((e) => ({ e, name: clientName(e) || t.common.unnamedClient, hay: norm([clientName(e), e.answers.email, e.answers.telefono, e.remote?.displayName].filter((v) => typeof v === "string").join(" ")) }))
      .filter((x) => !query || x.hay.includes(query))
      .sort((a, b) => b.e.updatedAt.localeCompare(a.e.updatedAt))
      .slice(0, query ? 8 : 5)
      .map((x): Hit => ({
        key: x.e.id,
        href: `/expedientes/${x.e.id}`,
        icon: FolderOpen,
        title: x.name,
        meta: [tr(STATUSES.find((s) => s.id === x.e.status)!.label), typeof x.e.answers.email === "string" ? x.e.answers.email : ""].filter(Boolean).join(" · "),
      }));
    const screens = pages.filter((p) => !query || norm(p.title).includes(query));
    return { cases, screens, flat: [...cases, ...screens] };
  }, [exps, pages, query, t, tr]);

  const close = () => {
    setQ("");
    setAt(0);
    onClose();
  };
  const go = (h: Hit | undefined) => {
    if (!h) return;
    close();
    router.push(h.href);
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = hits.flat.length;
      if (n) setAt((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits.flat[at]);
    }
  };

  const group = (label: string, list: Hit[], offset: number) =>
    list.length > 0 && (
      <div role="group" aria-label={label} className="flex flex-col gap-0.5">
        <p className="px-3 pt-2 pb-1 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{label}</p>
        {list.map((h, i) => {
          const on = offset + i === at;
          return (
            <button
              key={h.key}
              id={`qs-${offset + i}`}
              type="button"
              role="option"
              aria-selected={on}
              onMouseMove={() => setAt(offset + i)}
              onClick={() => go(h)}
              className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", on && "bg-accent-soft")}
            >
              <IconTile icon={h.icon} size="xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium">{h.title}</span>
                {h.meta && <span className="block truncate text-[12.5px] text-muted">{h.meta}</span>}
              </span>
            </button>
          );
        })}
      </div>
    );

  return (
    <dialog
      ref={ref}
      aria-label={t.extra.search.open}
      onClose={close}
      onClick={(e) => e.target === ref.current && close()}
      className="mx-auto mt-[12vh] w-[min(560px,calc(100vw-32px))] rounded-xl bg-surface p-0 text-ink shadow-card backdrop:bg-[var(--scrim)]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="qs-list"
          aria-activedescendant={hits.flat.length ? `qs-${at}` : undefined}
          value={q}
          onChange={(e) => { setQ(e.target.value); setAt(0); }}
          onKeyDown={keys}
          placeholder={t.extra.search.placeholder}
          className="h-14 min-w-0 flex-1 bg-transparent text-[16px] outline-hidden"
        />
        <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-muted">Esc</kbd>
      </div>
      <div id="qs-list" role="listbox" className="flex max-h-[min(60vh,440px)] flex-col gap-1 overflow-y-auto p-2">
        {group(t.extra.search.cases, hits.cases, 0)}
        {group(t.extra.search.pages, hits.screens, hits.cases.length)}
        {!hits.flat.length && <p className="px-3 py-8 text-center text-[14px] text-muted">{t.extra.search.none(q.trim())}</p>}
      </div>
      <p className="border-t border-line px-4 py-2 text-[12px] text-muted max-sm:hidden">{t.extra.search.hint}</p>
    </dialog>
  );
}
