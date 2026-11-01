"use client";

import { ImagePlus } from "lucide-react";
import { useState, type ReactElement } from "react";
import { FieldIcon } from "@/components/ui/field-icon";
import { actions, useAppState } from "@/lib/data/store";
import { deleteFile, putFile, useFileUrl } from "@/lib/data/files";
import type { Firm } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/use-i18n";
import { uid } from "@/lib/format";
import { Button, Card } from "@/components/ui/primitives";
import { Field, SectionHead, inputCls } from "./settings-layout";

const TEXT_FIELDS: { key: keyof Pick<Firm, "name" | "cif" | "address" | "phone" | "email">; type: string; ac: string; wide?: boolean }[] = [
// Two even columns: name | tax ID, phone | email, then the address across both.
  { key: "name", type: "text", ac: "organization" },
  { key: "cif", type: "text", ac: "off" },
  { key: "phone", type: "tel", ac: "tel" },
  { key: "email", type: "email", ac: "email" },
  { key: "address", type: "text", ac: "street-address", wide: true },
];

const wrap = (k: string, el: ReactElement) => (k === "phone" ? <FieldIcon kind="tel">{el}</FieldIcon> : k === "email" ? <FieldIcon kind="email">{el}</FieldIcon> : el);

/** G7 · Despacho: name, tax ID, contact details and logo. */
export function FirmSettings() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const f = t.settings.firm;

  return (
    <>
      <SectionHead title={f.title} intro={f.intro} />
      <Card pad="lg" className="flex flex-col gap-6">
        <Logo />
        <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          {TEXT_FIELDS.map((x) => (
            <Field key={x.key} id={`firm-${x.key}`} label={f[x.key]} className={x.wide ? "sm:col-span-2" : undefined}>
              {wrap(x.key, <input id={`firm-${x.key}`} type={x.type} autoComplete={x.ac} value={firm[x.key]} onChange={(e) => actions.updateFirm({ [x.key]: e.target.value })} className={x.key === "cif" ? inputCls + " font-mono" : inputCls} />)}
            </Field>
          ))}
        </div>
      </Card>
    </>
  );
}

function Logo() {
  const { firm } = useAppState();
  const { t } = useI18n();
  const f = t.settings.firm;
  const url = useFileUrl(firm.logo);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    const ref = { id: uid("logo-"), name: file.name, size: file.size, type: file.type };
    try {
      await putFile(ref.id, file);
      if (firm.logo) deleteFile(firm.logo.id).catch(() => {});
      actions.updateFirm({ logo: ref });
    } finally {
      setBusy(false);
    }
  }
  function remove() {
    if (firm.logo) deleteFile(firm.logo.id).catch(() => {});
    actions.updateFirm({ logo: null });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="grid size-20 shrink-0 place-items-center overflow-clip rounded-lg border border-line bg-sunk">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
          <img src={url} alt={f.logo} className="size-full object-contain p-2" />
        ) : (
          <span className="display-tight text-[20px] font-semibold text-accent">{(firm.name || "G").trim()[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <b className="text-[14px] font-semibold">{f.logo}</b>
        <p className="text-[12.5px] text-muted">{f.logoHint}</p>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="firm-logo" className="inline-flex h-(--control-h-sm) cursor-pointer items-center gap-2 rounded-md border border-transparent btn-fx btn-fx-soft bg-accent-soft text-accent hover:bg-accent-soft-hover px-3 text-[13px] font-medium transition-colors">
            <ImagePlus size={15} aria-hidden="true" />
            {busy ? t.upload.uploading : firm.logo ? f.logoReplace : f.logoUpload}
          </label>
          <input id="firm-logo" type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          {firm.logo && (
            <Button size="sm" variant="ghost" onClick={remove} className="text-bad hover:bg-bad-soft">
              {f.logoRemove}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
