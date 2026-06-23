"use client";

import { useTranslations } from "next-intl";

/**
 * Full-screen "membership expired" state, shown when the plan status has no
 * `paymentDetail`. Mirrors the mobile ExpiredCard.
 */
export function ExpiredCard() {
  const t = useTranslations("SavingPlan");
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-center text-base text-muted-foreground">
        {t("membershipExpired")}
      </p>
    </main>
  );
}
