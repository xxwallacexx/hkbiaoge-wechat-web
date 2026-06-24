/**
 * Brochure (handbook) list runtime config, shared by the `/brochures` page. The types live in
 * `@/types` (see types/brochure.ts). The six `key`s are the backend `HandbookType` values, sent
 * verbatim as the `handbookType` query param.
 */

import type { BrochureTab } from "@/types";

export const PAGE_SIZE = 20;

export const BROCHURE_TABS: readonly BrochureTab[] = [
  { key: "SAVING", labelKey: "tabSaving" },
  { key: "CI", labelKey: "tabCi" },
  { key: "LIVING", labelKey: "tabLiving" },
  { key: "WHOLELIFE", labelKey: "tabWholelife" },
  { key: "MEDICAL", labelKey: "tabMedical" },
  { key: "RETIREMENT", labelKey: "tabRetirement" },
] as const;

export const DEFAULT_BROCHURE_TAB = BROCHURE_TABS[0];

/** Resolve a `?tab=` value to a tab, falling back to the default for unknown values. */
export function resolveBrochureTab(
  key: string | null | undefined,
): BrochureTab {
  return BROCHURE_TABS.find((t) => t.key === key) ?? DEFAULT_BROCHURE_TAB;
}
