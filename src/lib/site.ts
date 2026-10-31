/*
 * Which site this deployment is (Product Blueprint: the firm is identified by
 * its domain, and each firm runs its own deployment and API).
 *
 * - A gestoría's domain (default): "/" is that gestoría's entry page; header,
 *   footer and contact belong to the gestoría, with PreRenta credited as the
 *   platform. The pages that sell PreRenta to gestorías are not served here.
 * - PreRenta's main domain (NEXT_PUBLIC_SITE=platform): the public website of
 *   the sitemap (P1–P8), for visitors and gestorías looking for a solution.
 *
 * Inlined at build time, so server and client always agree.
 */
export const PLATFORM_SITE = process.env.NEXT_PUBLIC_SITE === "platform";
