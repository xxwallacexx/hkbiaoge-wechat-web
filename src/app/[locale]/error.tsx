"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/report-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    captureError(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="container mx-auto max-w-md space-y-4 p-4 text-center">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Button onClick={() => reset()}>{t("retry")}</Button>
    </main>
  );
}
