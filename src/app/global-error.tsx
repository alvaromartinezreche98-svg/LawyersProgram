"use client";

import Link from "next/link";
import "./globals.css";

/*
 * Last resort when the root layout itself fails. It replaces the whole
 * document, so it cannot rely on the app's state or translations: both
 * languages are shown at once.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-bg font-sans text-[15px] text-ink">
        <title>Error · PreRenta</title>
        <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center gap-6 px-4 py-12 sm:px-8">
          <b className="text-[19px] font-semibold">
            Pre<span className="text-copper-text">Renta</span>
          </b>
          <div lang="es">
            <h1 className="text-[26px] leading-tight font-semibold">Algo ha fallado</h1>
            <p className="mt-2 text-muted">No hemos podido cargar la página. Sus datos no se han perdido. Inténtelo de nuevo en unos segundos.</p>
          </div>
          <div lang="en">
            <h2 className="text-[20px] leading-tight font-semibold">Something went wrong</h2>
            <p className="mt-2 text-muted">We could not load the page. Your data has not been lost. Please try again in a few seconds.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => retry()} className="h-(--control-h) rounded-md bg-accent px-4 font-medium text-accent-ink">
              Reintentar · Try again
            </button>
            <Link href="/" className="inline-flex h-(--control-h) items-center rounded-md border border-line-strong bg-surface px-4 font-medium">
              Inicio · Home
            </Link>
          </div>
          {error.digest && <p className="font-mono text-[12.5px] text-muted">Ref. {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
