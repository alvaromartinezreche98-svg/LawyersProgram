"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { cx } from "@/components/ui/primitives";

/**
 * Horizontal carousel of feature cards: native scroll with snap (touch,
 * trackpad and keyboard work as usual), arrow buttons and a progress line.
 * No autoplay: the visitor moves it.
 */
export function FeatureCarousel({ items, icons, labels }: { items: [string, string][]; icons: LucideIcon[]; labels: { prev: string; next: string; label: string } }) {
  const track = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ progress: 0, start: true, end: false, view: 0.3 });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPos({ progress: max > 0 ? el.scrollLeft / max : 1, start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4, view: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1 });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  const arrow = "btn-fx btn-fx-soft grid size-11 place-items-center rounded-full border border-transparent bg-accent-soft text-accent hover:bg-accent-soft-hover disabled:cursor-default disabled:opacity-40";

  return (
    <div className="flex flex-col gap-6">
      <ul
        ref={track}
        onScroll={measure}
        aria-label={labels.label}
        tabIndex={0}
        className="-ml-4 mr-[calc(50%-50vw)] flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto pt-1 pr-8 pb-3 pl-4 [scrollbar-width:none] sm:-ml-8 sm:scroll-px-8 sm:pl-8 [&::-webkit-scrollbar]:hidden"
      >
        {items.map(([title, d], i) => {
          const Icon = icons[i];
          return (
            <li
              key={title}
              className="group relative flex w-[min(80vw,288px)] shrink-0 snap-start flex-col gap-4 overflow-hidden rounded-xl border border-line bg-bg pad-card transition-[translate,box-shadow,border-color,background-color] duration-300 ease-out hover:border-accent/30 hover:bg-surface hover:shadow-[0_14px_30px_-14px_rgb(var(--accent-rgb)/0.35)] motion-safe:hover:-translate-y-1"
            >
              <span className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-icon-soft text-icon transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-ink" aria-hidden="true">
                  <Icon size={24} strokeWidth={2} />
                </span>
                <span className="display-serif text-[30px] leading-none font-semibold text-line-strong/40 transition-colors duration-300 group-hover:text-accent/25" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
              <b className="mt-2 text-[17px] leading-6 font-semibold">{title}</b>
              <span className="text-[14.5px] leading-[22px] text-muted">{d}</span>
              {/* Brand rule that grows on hover */}
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100" aria-hidden="true" />
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-5">
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <span
            className="absolute inset-y-0 rounded-full bg-accent transition-[left] duration-150 ease-out"
            style={{ width: `${Math.max(pos.view, 0.12) * 100}%`, left: `${pos.progress * (1 - Math.max(pos.view, 0.12)) * 100}%` }}
          />
        </div>
        <span className="flex gap-2">
          <button type="button" onClick={() => go(-1)} disabled={pos.start} aria-label={labels.prev} className={cx(arrow)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(1)} disabled={pos.end} aria-label={labels.next} className={cx(arrow)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </span>
      </div>
    </div>
  );
}
