"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { ExpiredCard } from "@/components/expired-card";
import { PlanHeader } from "@/components/plan-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { useSheetSync } from "./use-sheet-sync";

/**
 * The sheet-sync waiting screen: an illustration plus a spinner while the plan's worksheet
 * is being copied, and the two states that end the wait without a hand-off — an expired
 * membership, or a plan / destination we can't resolve. All polling and navigation live in
 * `useSheetSync`; this component is presentation only.
 */
export function SheetSyncScreen() {
  const t = useTranslations("SheetSync");
  const { isInvalid, isExpired, isError } = useSheetSync();

  if (isExpired) return <ExpiredCard message={t("membershipExpired")} />;

  const errorMessage = isInvalid
    ? t("invalidDestination")
    : isError
      ? t("error")
      : null;

  if (errorMessage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-center text-base text-muted-foreground">
          {errorMessage}
        </p>
        <Button asChild variant="outline">
          <Link href="/plans">{t("backToPlans")}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <PlanHeader title={t("title")} />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
        {/* Decorative, and an SVG: nothing for the image optimizer to do (it also rejects
            SVGs unless `dangerouslyAllowSVG` is set), so serve it as-is. It is also this
            screen's LCP element — `priority` preloads it and drops the lazy-loading, so the
            wait doesn't start with a blank panel. */}
        <Image
          src="/construct.svg"
          alt=""
          width={300}
          height={200}
          unoptimized
          priority
          className="h-auto w-full max-w-[300px] md:max-w-[380px]"
        />
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          <p className="text-center text-base text-foreground">
            {t("syncing")}
          </p>
        </div>
      </div>
    </main>
  );
}
