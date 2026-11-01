import { useId } from "react";

/**
 * The gestoría's emblem, shown wherever the firm has not uploaded its own logo: a tax
 * document with a folded corner, its figures rising in three bars, the last in terracotta
 * (the return, prepared and growing). `light` is navy for light grounds; `dark` is white
 * for the navy sidebar.
 */
export function FirmEmblem({ size = 40, tone = "light", className }: { size?: number; tone?: "light" | "dark"; className?: string }) {
  const id = useId();
  const dark = tone === "dark";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-page`} x1="6" y1="2" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor={dark ? "#ffffff" : "#2e4a6b"} />
          <stop offset="1" stopColor={dark ? "#dfe7f0" : "#172a3e"} />
        </linearGradient>
      </defs>
      {/* the page, its top right corner folded */}
      <path d="M10 2.5h14.6c.9 0 1.8.4 2.5 1l7.4 7.4c.6.7 1 1.6 1 2.5V33.5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-27a4 4 0 0 1 4-4Z" fill={`url(#${id}-page)`} />
      <path d="M25.5 2.6v6.9a2.5 2.5 0 0 0 2.5 2.5h6.9" fill={dark ? "#b7c6d6" : "#4a6f96"} />
      {/* the figures: two in the page's ink, the last one in terracotta */}
      <rect x="11" y="23" width="4" height="9" rx="1.2" fill={dark ? "#20364f" : "#ffffff"} fillOpacity={dark ? 0.85 : 0.92} />
      <rect x="17.5" y="19" width="4" height="13" rx="1.2" fill={dark ? "#20364f" : "#ffffff"} fillOpacity={dark ? 0.85 : 0.92} />
      <rect x="24" y="15" width="4" height="17" rx="1.2" fill="#b45309" />
    </svg>
  );
}

/**
 * The gestoría's name set as a wordmark, two faces paired: the first words in the sans at a
 * medium weight, the last one in the serif (Source Serif, semibold), a touch larger, in the
 * brand's terracotta. `dark` is for the navy sidebar (white and light terracotta), `light` for
 * light grounds.
 */
export function FirmWordmark({ name, tone = "light", size = "md", className }: { name: string; tone?: "light" | "dark"; size?: "md" | "lg"; className?: string }) {
  const words = name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const dark = tone === "dark";
  return (
    <span className={`block min-w-0 truncate leading-tight ${size === "lg" ? "text-[20px]" : "text-[15.5px]"} ${className ?? ""}`}>
      <span className={`font-medium tracking-[-0.01em] ${dark ? "text-white" : "text-ink"}`}>{words.join(" ")}</span>
      {last && (
        <>
          {" "}
          <span className={`font-serif text-[1.12em] font-semibold tracking-[0.005em] ${dark ? "text-chrome-mark" : "text-copper-text"}`}>{last}</span>
        </>
      )}
    </span>
  );
}
