"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { cx } from "./primitives";

/** QR code for a URL, drawn as SVG in the theme's ink colour, with an optional PNG download. */
export function QrCode({ value, size = 160, className, downloadName, downloadLabel }: { value: string; size?: number; className?: string; downloadName?: string; downloadLabel?: string }) {
  const [svg, setSvg] = useState<{ for: string; markup: string } | null>(null);
  useEffect(() => {
    if (!value) return;
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#20364f", light: "#ffffff" } })
      .then((markup) => alive && setSvg({ for: value, markup }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  const download = async () => {
    const url = await QRCode.toDataURL(value, { width: 1024, margin: 2, color: { dark: "#20364f", light: "#ffffff" } });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadName ?? "qr"}.png`;
    a.click();
  };

  return (
    <div className={cx("flex flex-col items-start gap-2", className)}>
      <div
        role="img"
        aria-label={value}
        className="overflow-clip rounded-md border border-line bg-white p-1.5 [&_svg]:block [&_svg]:size-full"
        style={{ width: size, height: size }}
        // Markup generated locally by the qrcode library from `value`.
        dangerouslySetInnerHTML={svg && svg.for === value ? { __html: svg.markup } : undefined}
      />
      {downloadLabel && (
        <button type="button" onClick={download} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
          <Download size={14} aria-hidden="true" />
          {downloadLabel}
        </button>
      )}
    </div>
  );
}
