"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useRouter } from "@/i18n/navigation";
import { resolveSheetSyncTarget } from "@/lib/sheet-sync";

/** How often to re-check whether the worksheet has landed (mirrors the mobile screen). */
const POLL_MS = 3000;

/**
 * Waiting room between "the plan is paid" and "its worksheet exists" (mirrors the mobile
 * `plans/sheetSync`). Reads `planId` / `destination` from the URL, polls that plan type's
 * status endpoint, and as soon as the webhook's OneDrive copy lands it refreshes the plans
 * list cache and replaces this screen with the plan's entry route, carrying the new
 * `sheetId`.
 *
 * Polling stops on its own: once synced there is nothing left to wait for, and a plan with
 * no `paymentDetail` never syncs at all (the backend only triggers a copy for a paid plan),
 * so that state is terminal too and surfaces as `isExpired` rather than an endless spinner.
 * `SheetSyncScreen` consumes this and only renders.
 */
export function useSheetSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const { isAuthenticated } = useAuthToken();

  const target = useMemo(
    () => resolveSheetSyncTarget(destination),
    [destination],
  );
  const enabled = isAuthenticated && !!planId && !!target;

  const { data: status, isError } = useQuery({
    // `destination` picks the fetcher, so it belongs in the key.
    queryKey: ["sheetSync", destination, planId],
    enabled,
    queryFn: () => target!.getStatus(planId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.paymentDetail) return false;
      const sheet = data?.sheetDetail;
      const synced = sheet?.isSynced === true && !!sheet.driveItemId;
      return synced ? false : POLL_MS;
    },
  });

  // `isSynced` + `driveItemId` are written together by the webhook, and the mobile screen
  // additionally waits for the payment record — keep all three as the hand-off condition.
  const syncedSheetId =
    status?.paymentDetail && status.sheetDetail?.isSynced
      ? status.sheetDetail.driveItemId
      : undefined;

  useEffect(() => {
    if (!target || !syncedSheetId) return;
    // The list rows embed `sheetDetail`, so this tab's cached pages are now out of date.
    queryClient.invalidateQueries({ queryKey: ["plans", target.tabKey] });
    router.replace({
      pathname: target.destination,
      query: { planId, sheetId: syncedSheetId },
    });
  }, [target, syncedSheetId, planId, queryClient, router]);

  return {
    /** No plan, or a `destination` that isn't one of the ported entry routes. */
    isInvalid: !planId || !target,
    /** Paid-membership record gone: this plan can never sync. */
    isExpired: !!status && !status.paymentDetail,
    /** The status poll is failing; it keeps retrying, so this can clear on its own. */
    isError,
  };
}
