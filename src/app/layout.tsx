import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Outfit, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";
import "@/styles/main.scss";

// latin-ext covers Valencian (l·l, à, è, ò, ç) alongside Spanish and English.
// The platform's face: Inter (variable, every weight), clear figures for tables and amounts.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"], weight: ["600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });
// The entry page's headlines only: a sharp, modern geometric sans at a medium-bold weight.
const headline = Plus_Jakarta_Sans({ variable: "--font-headline", subsets: ["latin", "latin-ext"], weight: ["600", "700"] });
// The entry pages' hero headline: a clean geometric sans.
const hero = Outfit({ variable: "--font-hero", subsets: ["latin", "latin-ext"], weight: ["600", "700"] });

// On phones the on-screen keyboard shrinks the layout (dvh follows it), so the chat's box stays in view above it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: { default: "PreRenta", template: "%s · PreRenta" },
  description: "Su renta, preparada con su gestoría y sin papeles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Browsers and extensions add attributes to <html>/<body> before React loads
  // (Chrome on iOS: __gcrremoteframetoken; Grammarly, ColorZilla); ignore those, one level deep only.
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${plexMono.variable} ${serif.variable} ${headline.variable} ${hero.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full bg-bg font-sans text-[15px] leading-normal text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
