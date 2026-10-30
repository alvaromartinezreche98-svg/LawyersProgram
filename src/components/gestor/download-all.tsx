"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { collectDocs } from "@/lib/questionnaire/progress";
import { SCHEMA } from "@/lib/questionnaire/schema";
import { clientName } from "@/lib/data/store";
import { getFile } from "@/lib/data/files";
import type { Expediente } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { makeZip, saveBlob } from "@/lib/zip";
import { cx } from "@/components/ui/primitives";

/**
 * "Descargar todo": every file of the case in one .zip, in folders by
 * questionnaire section ("2 Unidad familiar/Título de familia numerosa - …").
 * Files come from this browser (demo) or from the API, one at a time.
 */
export function DownloadAll({ exp, className }: { exp: Expediente; className?: string }) {
  const { t, tr } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const docs = collectDocs(exp.answers).filter((d) => d.files.length);
  if (!docs.length) return null;

  const run = async () => {
    setState("busy");
    try {
      const files: { name: string; blob: Blob }[] = [];
      for (const d of docs) {
        const n = SCHEMA.findIndex((s) => s.slug === d.section);
        const folder = n >= 0 ? `${n + 1} ${tr(SCHEMA[n].short)}` : d.section;
        const what = [tr(d.label), d.context && tr(d.context)].filter(Boolean).join(" - ").replace(/\//g, "-").slice(0, 90);
        for (const f of d.files) {
          const blob = f.remote ? await (await import("@/lib/api/endpoints")).api.downloadDocument(f.remote, f.id) : await getFile(f.id);
          if (!blob) continue;
          files.push({ name: `${folder}/${what}/${f.name.replace(/\//g, "-")}`, blob });
        }
      }
      if (!files.length) throw new Error("no files");
      const who = (clientName(exp) || exp.id).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
      saveBlob(await makeZip(files), `${who}-renta-${exp.ejercicio}.zip`);
      setState("idle");
    } catch {
      setState("failed");
    }
  };

  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      {state === "failed" && <span role="alert" className="text-[12.5px] font-medium text-bad">{t.extra.zip.failed}</span>}
      <button type="button" onClick={run} disabled={state === "busy"} className="inline-flex h-(--control-h-sm) items-center gap-1.5 rounded-md bg-accent-soft px-3 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft-hover disabled:opacity-60">
        {state === "busy" ? <span className="size-3.5 rounded-full border-2 border-accent/30 border-t-accent motion-safe:animate-spin" aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
        {state === "busy" ? t.extra.zip.preparing : t.extra.zip.download}
      </button>
    </span>
  );
}
