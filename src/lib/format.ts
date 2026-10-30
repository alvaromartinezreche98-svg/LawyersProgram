/** "2026-03-10" → "10/03/2026" */
export const fmtDate = (d: string) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return dd ? `${dd}/${m}/${y}` : d;
};

/** ISO timestamp → "20/10 · 10:12" */
export const fmtTime = (iso: string | null | undefined, locale = "es-ES") => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" }) +
    " · " +
    d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  );
};

/** ISO timestamp → "10:12" */
export const fmtClock = (iso: string, locale = "es-ES") => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

export const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const fileExt = (name: string) => (name.split(".").pop() || "doc").slice(0, 4);

export const nowIso = () => new Date().toISOString();

export const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Day and month only ("29/10"), for dates within the tax year. */
export const fmtDayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
