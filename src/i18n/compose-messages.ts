type Messages = Record<string, Record<string, string>>;

/**
 * The six plan screens share a large amount of chrome (form fields, premium
 * labels, the whole withdrawal sheet). Rather than copy those strings into
 * every `*Plan` namespace — and again across all three locale files — the
 * shared strings are defined ONCE per locale under `_`-prefixed groups in
 * `messages/<locale>.json` and spread back into each plan namespace here, at
 * load time.
 *
 * Plan-specific keys are spread LAST so a plan can still override a shared
 * label. The `_`-prefixed groups are destructured out and never reach the
 * client, so consumers keep calling `useTranslations("SavingPlan")` unchanged.
 *
 * Which groups each plan receives is intentional and mirrored by
 * `compose-messages.test.ts`; see the PLAN_GROUPS map there.
 */
export function composeMessages(raw: Messages): Messages {
  const { _planCommon, _withdrawal, _basicInfo, _healthArea, ...rest } = raw;

  return {
    ...rest,
    SavingPlan: { ..._planCommon, ..._withdrawal, ...raw.SavingPlan },
    CouponPlan: {
      ..._planCommon,
      ..._basicInfo,
      ..._withdrawal,
      ...raw.CouponPlan,
    },
    CiPlan: { ..._planCommon, ..._basicInfo, ..._healthArea, ...raw.CiPlan },
    WholelifePlan: {
      ..._planCommon,
      ..._basicInfo,
      ..._healthArea,
      ..._withdrawal,
      ...raw.WholelifePlan,
    },
    UnitLinkedPlan: {
      ..._planCommon,
      ..._basicInfo,
      ..._healthArea,
      ..._withdrawal,
      ...raw.UnitLinkedPlan,
    },
    AnnuityPlan: {
      ..._planCommon,
      ..._basicInfo,
      ..._withdrawal,
      ...raw.AnnuityPlan,
    },
  };
}
