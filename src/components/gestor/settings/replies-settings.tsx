"use client";

import { Plus, Trash2 } from "lucide-react";
import { actions, useAppState } from "@/lib/data/store";
import type { QuickReply } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button, Card, Notice, cx } from "@/components/ui/primitives";
import { SectionHead, inputCls } from "./settings-layout";

/** G7 · Respuestas rápidas: the gestoría's own chat shortcuts. The first edit copies PreRenta's into the firm's list. */
export function RepliesSettings() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const r = t.extra.replies;
  const own = !!firm.replies;
  const list: QuickReply[] = firm.replies ?? t.chat.quick.map((q) => ({ ...q }));
  const save = (next: QuickReply[] | undefined) => actions.updateFirm({ replies: next });
  const patch = (i: number, p: Partial<QuickReply>) => save(list.map((q, j) => (j === i ? { ...q, ...p } : q)));

  return (
    <>
      <SectionHead title={r.title} intro={r.intro} />
      <Card pad="lg" className="flex flex-col gap-4">
        <Notice tone={own ? "ok" : "info"}>{own ? r.custom : r.builtIn}</Notice>
        <ul className="flex flex-col gap-4">
          {list.map((q, i) => (
            <li key={i} className="grid gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-start">
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                {r.label}
                <input value={q.label} maxLength={32} onChange={(e) => patch(i, { label: e.target.value })} className={cx(inputCls, "font-normal")} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                {r.text}
                <textarea value={q.text} rows={2} onChange={(e) => patch(i, { text: e.target.value })} className={cx(inputCls, "h-auto resize-y py-2 leading-relaxed font-normal")} />
              </label>
              <Button variant="danger" size="sm" className="sm:mt-6" onClick={() => save(list.filter((_, j) => j !== i))}>
                <Trash2 size={14} aria-hidden="true" />
                {r.remove}
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" onClick={() => save([...list, { label: "", text: "" }])}>
            <Plus size={14} aria-hidden="true" />
            {r.add}
          </Button>
          {own && <Button variant="ghost" size="sm" onClick={() => save(undefined)}>{r.reset}</Button>}
        </div>
      </Card>
    </>
  );
}
