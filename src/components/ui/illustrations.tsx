"use client";

import { useId, type ReactNode } from "react";
import { cx } from "./primitives";

/*
 * Original line illustrations for PreRenta: flat sheets with hairline borders,
 * navy seals and a copper header rule, drawn from the theme tokens so they
 * work in light and dark mode. Decorative only (aria-hidden).
 */

function Art({ children, className }: { children: (id: string) => ReactNode; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 240 180" className={cx("h-auto w-full", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--glass-hi)" />
          <stop offset="1" stopColor="var(--glass-lo)" />
        </linearGradient>
        <linearGradient id={`seal${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      {children(id)}
    </svg>
  );
}

const Shadow = ({ cx: x = 120, w = 72 }: { cx?: number; w?: number }) => <ellipse cx={x} cy="166" rx={w} ry="7" fill="var(--ink)" opacity="0.07" />;
const Sheet = ({ id, x, y, w, h, r = 0, lines = 5 }: { id: string; x: number; y: number; w: number; h: number; r?: number; lines?: number }) => (
  <g transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x} y={y} width={w} height={h} rx="10" fill={`url(#glass${id})`} stroke="var(--glass-edge)" strokeWidth="1.5" />
    <rect x={x + 12} y={y + 14} width={w * 0.42} height="7" rx="3.5" fill="var(--copper)" opacity="0.8" />
    {Array.from({ length: lines }, (_, i) => (
      <rect key={i} x={x + 12} y={y + 32 + i * 13} width={(w - 24) * (i % 3 === 2 ? 0.6 : 1)} height="5" rx="2.5" fill="var(--glass-line)" />
    ))}
  </g>
);

/** Two tax documents and a check seal — the client's return. */
export function ReturnArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      {(id) => (
        <>
          <Shadow />
          <Sheet id={id} x={58} y={34} w={84} h={108} r={-9} />
          <Sheet id={id} x={98} y={24} w={86} h={114} r={6} />
          <circle cx="176" cy="124" r="25" fill={`url(#seal${id})`} />
          <circle cx="176" cy="124" r="25" fill="none" stroke="var(--glass-edge)" strokeWidth="2" opacity="0.7" />
          <path d="m165 124 7.5 7.5L188 116" fill="none" stroke="var(--accent-ink)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Art>
  );
}

/** A sheet flying off with a check — return sent to the gestoría. */
export function SentArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      {(id) => (
        <>
          <Shadow w={60} />
          <Sheet id={id} x={60} y={44} w={82} h={104} r={-6} lines={4} />
          <path d="M120 84 206 46 178 132 156 108 196 56 146 100Z" fill={`url(#glass${id})`} stroke="var(--glass-edge)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M146 100 156 108 150 124Z" fill="var(--copper)" opacity="0.8" />
          <circle cx="82" cy="132" r="18" fill={`url(#seal${id})`} />
          <path d="m74 132 5.5 5.5L91 126" fill="none" stroke="var(--accent-ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Art>
  );
}

/** Two speech bubbles — chat with the gestoría. */
export function ChatArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      {(id) => (
        <>
          <Shadow w={64} />
          <path d="M54 44h92a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H90l-20 16v-16H54a12 12 0 0 1-12-12V56a12 12 0 0 1 12-12Z" fill={`url(#glass${id})`} stroke="var(--glass-edge)" strokeWidth="1.5" />
          <rect x="58" y="62" width="70" height="6" rx="3" fill="var(--glass-line)" />
          <rect x="58" y="78" width="48" height="6" rx="3" fill="var(--glass-line)" />
          <path d="M112 92h74a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12h-6v14l-18-14h-50a12 12 0 0 1-12-12v-30a12 12 0 0 1 12-12Z" fill={`url(#seal${id})`} opacity="0.92" />
          <circle cx="132" cy="119" r="4.5" fill="var(--accent-ink)" />
          <circle cx="149" cy="119" r="4.5" fill="var(--accent-ink)" opacity="0.85" />
          <circle cx="166" cy="119" r="4.5" fill="var(--accent-ink)" opacity="0.7" />
        </>
      )}
    </Art>
  );
}

/** An open folder with papers — documents. */
export function FolderArt({ className }: { className?: string }) {
  return (
    <Art className={className}>
      {(id) => (
        <>
          <Shadow w={76} />
          <Sheet id={id} x={78} y={26} w={74} h={92} r={-7} lines={4} />
          <Sheet id={id} x={100} y={30} w={74} h={92} r={5} lines={4} />
          <path d="M50 80a10 10 0 0 1 10-10h34l12 12h74a10 10 0 0 1 10 10v54a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10Z" fill={`url(#seal${id})`} opacity="0.88" />
          <path d="M50 96h140v50a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10Z" fill={`url(#glass${id})`} stroke="var(--glass-edge)" strokeWidth="1.5" />
        </>
      )}
    </Art>
  );
}
