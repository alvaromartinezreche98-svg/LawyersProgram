import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";
import "@/styles/main.scss";

// latin-ext covers Valencian (l·l, à, è, ò, ç) alongside Spanish and English.
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"], weight: ["600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "PreRenta", template: "%s · PreRenta" },
  description: "Su renta, preparada con su gestoría y sin papeles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Browsers and extensions add attributes to <html>/<body> before React loads
  // (Chrome on iOS: __gcrremoteframetoken; Grammarly, ColorZilla); ignore those, one level deep only.
  return (
    <html lang="es" suppressHydrationWarning className={`${plex.variable} ${plexMono.variable} ${serif.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full bg-bg font-sans text-[15px] leading-normal text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
