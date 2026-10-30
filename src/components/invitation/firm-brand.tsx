"use client";

import { useAppState } from "@/lib/data/store";
import { useFileUrl } from "@/lib/data/files";
import { Brand } from "@/components/ui/primitives";

/** The firm's logo and name (the firm behind this domain); PreRenta's brand when the firm has none. */
export function FirmBrand({ size = "md" }: { size?: "md" | "lg" }) {
  const { firm } = useAppState();
  const url = useFileUrl(firm.logo);
  const name = firm.name.trim();
  if (!name && !url) return <Brand />;
  return (
    <span className="flex items-center gap-3">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL from IndexedDB
        <img src={url} alt="" className={size === "lg" ? "size-12 rounded-lg object-contain" : "size-8 rounded-md object-contain"} />
      )}
      {name && <b className={size === "lg" ? "display-tight text-[22px] font-semibold" : "display-tight text-[17px] font-semibold"}>{name}</b>}
    </span>
  );
}
