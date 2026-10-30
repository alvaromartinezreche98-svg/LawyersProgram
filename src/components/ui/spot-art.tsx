/*
 * Spot illustrations: small line drawings in the design system's own colours
 * (brand navy strokes, copper accents, paper and white fills). Drawn by hand
 * in SVG so they stay crisp, light and on brand, and follow the theme tokens.
 * Decorative only: always aria-hidden next to a text that says the same.
 */
import type { ReactNode } from "react";

const S = { stroke: "var(--accent)", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
const PAPER = "var(--surface)";
const GROUND = "var(--bg)";
const COPPER = "var(--copper)";
const SOFT = "var(--icon-soft)";

function Art({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" focusable="false">
      {/* the plate every drawing sits on */}
      <ellipse cx="80" cy="104" rx="56" ry="7" fill={SOFT} />
      {children}
    </svg>
  );
}

/** Invitation: a letter with a QR code. */
function Invite() {
  return (
    <>
      <rect x="34" y="34" width="92" height="64" rx="6" {...S} fill={PAPER} />
      <path d="M34 40 L80 70 L126 40" {...S} />
      <rect x="92" y="14" width="40" height="40" rx="5" {...S} fill={PAPER} />
      <rect x="99" y="21" width="10" height="10" rx="1.5" fill="var(--accent)" />
      <rect x="115" y="21" width="10" height="10" rx="1.5" fill="var(--accent)" />
      <rect x="99" y="37" width="10" height="10" rx="1.5" fill="var(--accent)" />
      <rect x="116" y="38" width="4" height="4" fill={COPPER} />
      <rect x="121" y="43" width="4" height="4" fill={COPPER} />
    </>
  );
}

/** Sign in with email: an envelope and a key. */
function Email() {
  return (
    <>
      <rect x="30" y="30" width="80" height="58" rx="6" {...S} fill={PAPER} />
      <path d="M30 36 L70 62 L110 36" {...S} />
      <circle cx="116" cy="74" r="12" {...S} fill={PAPER} />
      <circle cx="116" cy="74" r="4" fill={COPPER} />
      <path d="M106 82 L92 96 M97 91 L101 95 M93 95 L96 98" {...S} />
    </>
  );
}

/** Questionnaire: a clipboard with ticked lines. */
function Questions() {
  return (
    <>
      <rect x="46" y="18" width="68" height="84" rx="6" {...S} fill={PAPER} />
      <rect x="64" y="12" width="32" height="12" rx="4" {...S} fill={SOFT} />
      {[40, 58, 76].map((y, i) => (
        <g key={y}>
          <rect x="56" y={y - 6} width="12" height="12" rx="3" {...S} fill={i < 2 ? "var(--accent)" : PAPER} />
          {i < 2 && <path d={`M59 ${y} l2.5 2.5 l4.5 -5`} stroke={PAPER} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <path d={`M76 ${y} H${i === 1 ? 96 : 104}`} {...S} />
        </g>
      ))}
      <circle cx="114" cy="92" r="9" fill={COPPER} />
      <path d="M110 92 l3 3 l5 -6" stroke={PAPER} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Upload: a phone photographing a document, arrow up. */
function Upload() {
  return (
    <>
      <rect x="28" y="40" width="58" height="58" rx="4" {...S} fill={PAPER} transform="rotate(-6 57 69)" />
      <path d="M38 58 H70 M38 68 H74 M38 78 H62" {...S} transform="rotate(-6 57 69)" />
      <rect x="78" y="16" width="46" height="84" rx="9" {...S} fill={PAPER} />
      <rect x="85" y="28" width="32" height="50" rx="3" fill={SOFT} />
      <path d="M101 66 V40 M92 49 L101 40 L110 49" stroke={COPPER} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M96 90 H106" {...S} />
    </>
  );
}

/** Sign and send: a page with a signature and a pen. */
function Sign() {
  return (
    <>
      <rect x="40" y="14" width="70" height="88" rx="5" {...S} fill={PAPER} />
      <path d="M52 32 H98 M52 44 H98 M52 56 H84" {...S} />
      <path d="M52 82 c6 -10 10 -10 12 -2 s6 6 10 -4 s6 6 12 0" stroke={COPPER} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M52 90 H98" stroke="var(--line-strong)" strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M128 30 L104 76 L100 86 L108 80 L132 34 Z" {...S} fill={SOFT} />
    </>
  );
}

/** The gestoría reviews: two chat bubbles. */
function Review() {
  return (
    <>
      <path d="M26 26 h64 a8 8 0 0 1 8 8 v26 a8 8 0 0 1 -8 8 h-40 l-14 12 v-12 h-10 a8 8 0 0 1 -8 -8 v-26 a8 8 0 0 1 8 -8 z" {...S} fill={PAPER} />
      <path d="M36 42 H86 M36 54 H70" {...S} />
      <path d="M134 50 h-50 a8 8 0 0 0 -8 8 v22 a8 8 0 0 0 8 8 h32 l12 10 v-10 h6 a8 8 0 0 0 8 -8 v-22 a8 8 0 0 0 -8 -8 z" fill={COPPER} stroke={COPPER} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M88 64 H124 M88 74 H112" stroke={PAPER} strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

/** The result: a return with a stamp of approval. */
function Result() {
  return (
    <>
      <rect x="36" y="14" width="72" height="88" rx="5" {...S} fill={PAPER} />
      <path d="M48 30 H82" {...S} />
      <path d="M48 46 H96 M48 58 H96 M48 70 H80" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" />
      <text x="46" y="92" fontFamily="var(--font-serif, Georgia, serif)" fontSize="12.5" fontWeight="600" fill="var(--accent)">412 €</text>
      <circle cx="116" cy="76" r="20" fill={GROUND} stroke={COPPER} strokeWidth="2.4" />
      <circle cx="116" cy="76" r="14" fill="none" stroke={COPPER} strokeWidth="1.4" strokeDasharray="2 3" />
      <path d="M108 76 l5 5 l10 -11" stroke={COPPER} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const PARTS = { invite: Invite, email: Email, questions: Questions, upload: Upload, sign: Sign, review: Review, result: Result };
export type SpotName = keyof typeof PARTS;

export function SpotArt({ name, className }: { name: SpotName; className?: string }) {
  const Part = PARTS[name];
  return (
    <Art className={className}>
      <Part />
    </Art>
  );
}
