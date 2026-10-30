"use client";

import { FEATURES } from "@/lib/features";
import { useState } from "react";
import { SIGN_SLUG, STEP_SLUGS, sectionBySlug } from "@/lib/questionnaire/schema";
import { signingDone } from "@/lib/data/legal";
import { SignStep } from "@/components/client/sign-step";
import { clientName, useAppState } from "@/lib/data/store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { QuestionnaireForm } from "@/components/questionnaire/field-list";
import { ReviewBlock } from "@/components/questionnaire/review-block";
import { StepsNav } from "@/components/questionnaire/steps-nav";
import { PageTitle } from "@/components/ui/app-shell";
import { ButtonLink, Eyebrow, Notice } from "@/components/ui/primitives";
import { TopBar } from "./gestor-shell";

/** "Ver como cliente": the questionnaire exactly as the client sees it, read-only. */
export function ClientPreview({ id }: { id: string }) {
  const { exps, firm } = useAppState();
  const { t, tr } = useI18n();
  const [slug, setSlug] = useState(STEP_SLUGS[0]);
  const e = exps[id];
  const name = e ? clientName(e) || t.common.unnamedClient : "";
  const idx = STEP_SLUGS.indexOf(slug);
  const section = sectionBySlug(slug);

  return (
    <>
      <PageTitle>{t.titles.preview}</PageTitle>
      <TopBar
        crumbs={[{ label: t.list.title, href: "/expedientes" }, ...(e ? [{ label: name, href: `/expedientes/${id}` }] : []), { label: t.titles.preview }]}
        right={e && <ButtonLink href={`/expedientes/${id}`} size="sm">{t.preview.back}</ButtonLink>}
      />
      {!e ? (
        <p className="px-6 py-10 text-muted">{t.file.notFound}</p>
      ) : (
        <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
          <Notice>{t.preview.notice(name)}</Notice>
          <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <StepsNav answers={e.answers} current={slug} onSelect={setSlug} signDone={FEATURES.signing ? signingDone(e, firm) : undefined} />
            <section className="min-w-0 rounded-xl border border-line bg-surface px-4 py-7 sm:px-8 lg:px-10">
              <Eyebrow>{t.q.stepOf(idx + 1, STEP_SLUGS.length)}</Eyebrow>
              <h1 className="display-tight mt-1 mb-2 text-[clamp(20px,2vw,24px)] font-semibold">{section ? tr(section.title) : slug === SIGN_SLUG ? t.sign.title : t.q.review}</h1>
              {slug === SIGN_SLUG ? (
                <div className="mt-4">
                  <SignStep exp={e} readOnly />
                </div>
              ) : section ? (
                <>
                  {section.intro && <p className="mb-6 max-w-[62ch] text-muted">{tr(section.intro)}</p>}
                  <QuestionnaireForm fields={section.fields} answers={e.answers} onChange={() => {}} readOnly idBase={"pv-" + section.id} />
                </>
              ) : (
                <ReviewBlock answers={e.answers} sent={e.status !== "borrador"} onGo={setSlug} signDone={FEATURES.signing ? signingDone(e, firm) : undefined} />
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
