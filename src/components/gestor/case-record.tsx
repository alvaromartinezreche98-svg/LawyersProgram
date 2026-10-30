"use client";

import { Printer } from "lucide-react";
import { LEGAL_KINDS } from "@/lib/data/legal";
import { clientName, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { fmtTime } from "@/lib/format";
import { PageTitle } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/primitives";
import { TopBar } from "./gestor-shell";

/**
 * S3 · Constancia: the client's signatures (data protection, mandate) and
 * their approval of the result, as a printable sheet. "Imprimir o guardar
 * PDF" uses the browser's print dialog; the panel chrome is hidden in print.
 */
export function CaseRecord({ id }: { id: string }) {
  const { exps, firm } = useAppState();
  const { t, locale } = useI18n();
  const r = t.extra.record;
  const e = exps[id];
  if (!e) return <p className="px-6 py-10 text-muted">{t.file.notFound}</p>;
  const name = clientName(e) || t.common.unnamedClient;
  const sigs = LEGAL_KINDS.flatMap((k) => (e.signatures?.[k] ? [{ k, s: e.signatures[k]! }] : []));
  const res = e.result;
  const ok = res?.approval && res.approval.version === res.version ? res.approval : null;
  const th = "border-b border-line py-2 pr-4 text-left text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase";
  const td = "border-b border-line py-2.5 pr-4 align-top text-[14px]";

  return (
    <>
      <PageTitle>{r.title}</PageTitle>
      <div className="print:hidden">
        <TopBar
          crumbs={[{ label: t.list.title, href: "/expedientes" }, { label: name, href: `/expedientes/${id}` }, { label: r.title }]}
          right={<ButtonLink href={`/expedientes/${id}`} size="sm">{t.preview.back}</ButtonLink>}
        />
      </div>
      <div className="flex flex-col gap-5 px-4 py-6 sm:px-6 print:p-0">
        <div className="flex justify-end print:hidden">
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" />
            {r.print}
          </Button>
        </div>

        <article className="mx-auto flex w-full max-w-[780px] flex-col gap-8 rounded-xl border border-line bg-surface p-8 shadow-sheet sm:p-12 print:max-w-none print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-col gap-1 border-b-2 border-ink pb-5">
            <p className="text-[12px] font-semibold tracking-[.12em] text-accent uppercase">{firm.name || r.firm}</p>
            <h1 className="display-serif text-[28px] leading-tight font-semibold">{r.title}</h1>
            <p className="text-[14px] text-muted">{r.intro}</p>
          </header>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] sm:grid-cols-4">
            {[
              [r.client, name],
              [r.nif, typeof e.answers.dni === "string" && e.answers.dni ? e.answers.dni : "—"],
              [r.year, String(e.ejercicio)],
              [r.caseId, e.id],
            ].map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col">
                <dt className="text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-3">
            <h2 className="text-[16px] font-semibold">{r.signatures}</h2>
            {sigs.length ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr><th className={th}>{r.doc}</th><th className={th}>{r.version}</th><th className={th}>{r.signedAt}</th><th className={th}>{r.signer}</th></tr>
                </thead>
                <tbody>
                  {sigs.map(({ k, s }) => (
                    <tr key={k}>
                      <td className={td}>
                        {k === "privacy" ? t.settings.legal.privacy : t.settings.legal.mandate}
                        <span className="block text-[12.5px] text-muted">{s.fileName}</span>
                      </td>
                      <td className={td + " figures"}>v{s.version}</td>
                      <td className={td + " figures"}>{fmtTime(s.signedAt, locale)}</td>
                      <td className={td}>
                        {s.signerName}
                        <span className="block font-mono text-[12.5px] text-muted">{s.signerId}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[14px] text-muted">{r.noSignatures}</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[16px] font-semibold">{r.approval}</h2>
            {res && ok ? (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] sm:grid-cols-4">
                <div className="flex flex-col"><dt className="text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{r.result}</dt><dd className="figures font-medium">{t.result.kind[res.kind]} {res.amount} €</dd></div>
                <div className="flex flex-col"><dt className="text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{r.version}</dt><dd className="figures font-medium">v{ok.version}</dd></div>
                <div className="flex flex-col"><dt className="text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{r.approvedAt}</dt><dd className="figures font-medium">{fmtTime(ok.approvedAt, locale)}</dd></div>
                <div className="flex flex-col"><dt className="text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase">{r.approvedBy}</dt><dd className="font-medium">{ok.approvedBy}</dd></div>
              </dl>
            ) : (
              <p className="text-[14px] text-muted">{r.noApproval}</p>
            )}
          </section>

          <footer className="flex flex-col gap-1 border-t border-line pt-4 text-[12px] text-muted">
            <p>{r.note}</p>
            <p>{r.generated(fmtTime(new Date().toISOString(), locale))}</p>
          </footer>
        </article>
      </div>
    </>
  );
}
