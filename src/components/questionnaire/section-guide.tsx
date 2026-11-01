"use client";

import Link from "next/link";
import { ArrowDown, CircleCheck, Compass, FileUp, MessageCircle } from "lucide-react";
import type { Expediente } from "@/lib/data/types";
import type { Field } from "@/lib/questionnaire/types";
import { sectionBySlug } from "@/lib/questionnaire/schema";
import { collectDocs, firstOpenAnchor, progressOf } from "@/lib/questionnaire/progress";
import { usePlatformText } from "@/lib/i18n/messages-platform";
import { cx } from "@/components/ui/primitives";

/** The question an anchor ("q-<field>[-<item>]") points at, searched through follow-ups and groups. */
function fieldFor(fields: Field[], anchor: string): Field | null {
  for (const x of fields) {
    if (anchor === `q-${x.id}` || anchor.startsWith(`q-${x.id}-`)) return x;
    const hit = fieldFor([...(x.kids ?? []), ...(x.fields ?? [])], anchor);
    if (hit) return hit;
  }
  return null;
}

/**
 * C3 · Guidance while filling in (sitemap decision 2), first version without
 * AI: worked out from the answers themselves — what is left, the next question
 * still open, the documents this section still needs — and a direct line to
 * the gestoría. An AI assistant can later answer inside this same panel.
 */
export function SectionGuide({ exp, slug, onGo }: { exp: Expediente; slug: string; onGo: (anchor: string) => void }) {
  const { p, tr } = usePlatformText();
  const g = p.guide;
  const section = sectionBySlug(slug);
  if (!section) return null;
  const prog = progressOf(section.fields, exp.answers);
  const left = prog.total - prog.done;
  const next = firstOpenAnchor(section.fields, exp.answers);
  const nextField = next ? fieldFor(section.fields, next) : null;
  const docs = collectDocs(exp.answers).filter((d) => d.section === slug && !d.files.length);

  return (
    <aside aria-label={g.title} className="mb-6 rounded-lg border border-line bg-sunk/60 pad-card">
      <p className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold">
        <Compass size={16} className="text-accent" aria-hidden="true" />
        {g.title}
      </p>
      <div className={cx("grid gap-4", (nextField || docs.length > 0) && "md:grid-cols-2")}>
        <div className="flex min-w-0 flex-col gap-2">
          {left === 0 ? (
            <p className="flex items-center gap-2 text-[14px] text-ok"><CircleCheck size={16} aria-hidden="true" />{g.complete}</p>
          ) : (
            <p className="text-[14px]">{g.left(left)}</p>
          )}
          {nextField && next && (
            <>
              <span className="t-label text-muted uppercase">{g.next}</span>
              <span className="text-[14.5px] leading-snug font-medium">{tr(nextField.label)}</span>
              <button type="button" onClick={() => onGo(next)} className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-accent underline-offset-4 hover:underline">
                {g.go}
                <ArrowDown size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        {docs.length > 0 && (
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex items-center gap-2 text-[14px] font-medium text-copper-text"><FileUp size={15} aria-hidden="true" />{g.docs(docs.length)}</span>
            <ul className="flex flex-col gap-1">
              {docs.map((d) => (
                <li key={`${d.field}:${d.item ?? ""}`}>
                  <button type="button" onClick={() => onGo(`q-${d.field}${d.item ? `-${d.item}` : ""}`)} className="text-left text-[13.5px] leading-snug text-ink/85 underline-offset-4 hover:text-accent hover:underline">
                    {tr(d.label)}{d.context ? ` · ${tr(d.context)}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <Link href={`/mensajes?sobre=${encodeURIComponent(slug)}`} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-accent underline-offset-4 hover:underline">
          <MessageCircle size={15} aria-hidden="true" />
          {g.ask}
        </Link>
      </div>
    </aside>
  );
}
