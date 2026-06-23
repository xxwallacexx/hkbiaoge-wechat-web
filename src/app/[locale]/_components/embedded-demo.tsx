"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useMiniProgram } from "@/hooks/use-mini-program";
import { api } from "@/lib/api/client";
import { wechat } from "@/lib/wechat";

/**
 * Demonstrates the full embedding flow in one screen:
 *  - detect whether we're inside a Mini Program web-view (useMiniProgram)
 *  - report auth state (token captured from the web-view URL)
 *  - make a data call through the shared axios instance + TanStack Query
 *  - offer a "back to Mini Program" action via the bridge when embedded
 */
export function EmbeddedDemo() {
  const t = useTranslations("App");
  const { ready, isAuthenticated, error } = useAuthToken();
  const inMiniProgram = useMiniProgram();

  // Triggered by a button so the page renders clean even with no backend in dev.
  const ping = useMutation({
    mutationFn: async () => {
      const res = await api.get("/health");
      return res.data;
    },
  });

  return (
    // Full-height, vertically-centered column. Mobile-first sizing targets iPhone XR
    // (~414px, base styles); the `md:` step (>=768px) covers iPad Air (~820px).
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4 md:max-w-lg md:space-y-6">
        <header className="space-y-1 py-2 md:space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("subtitle")}
          </p>
        </header>

        <Card>
          <CardHeader className="md:p-8">
            <CardTitle className="text-base md:text-lg">
              {inMiniProgram === null
                ? t("envChecking")
                : inMiniProgram
                  ? t("envMiniProgram")
                  : t("envBrowser")}
            </CardTitle>
            <CardDescription className="md:text-base">
              {!ready
                ? t("loading")
                : error
                  ? t("authError")
                  : isAuthenticated
                    ? t("authed")
                    : t("notAuthed")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 md:p-8 md:pt-0">
            <Button
              size="lg"
              className="h-12 w-full text-base"
              onClick={() => ping.mutate()}
              disabled={ping.isPending}
            >
              {ping.isPending ? t("loading") : t("ping")}
            </Button>
            {ping.isSuccess && (
              <p className="text-sm text-green-600 md:text-base">
                {t("pingOk")}
              </p>
            )}
            {ping.isError && (
              <p className="text-sm text-destructive md:text-base">
                {t("pingFail")}
              </p>
            )}

            {inMiniProgram && (
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full text-base"
                onClick={() => wechat.navigateBack()}
              >
                {t("back")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
