"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useMiniProgram } from "@/hooks/use-mini-program";
import { openPdf, pdfFileName, type PdfMeta } from "@/lib/pdf-viewer";

/**
 * Generate a sheet's PDF and open it. Shared by all six sheet screens — only the API call
 * differs, so each screen passes its own `generate`.
 *
 * `openPdf` decides where it lands: the client's native viewer page inside the Mini Program,
 * a new tab outside it. It rewrites the OSS host on both paths (see lib/oss.ts), so the
 * generated url is never handed over on the bucket's own host.
 *
 * The tab is opened only once the url arrives. Pre-opening one in the tap handler — the usual
 * trick for keeping the user-gesture stack alive across the await — was tried and removed: the
 * tab sits visibly blank for the whole render, and browsers that sever the opener reference
 * leave that blank tab behind AND open a second one for the PDF. The cost of not pre-opening
 * is that a strict popup blocker can swallow the new tab silently.
 *
 * The error string is passed in rather than read here. The six plan namespaces each carry
 * their own copy of the shared `_planCommon` keys, so a shared hook has no namespace to read
 * from — the same reason `ExpiredCard` and `PlanHeader` take their labels as props.
 */
export function useSheetPdf({
  generate,
  errorMessage,
  meta,
}: {
  generate: () => Promise<string>;
  errorMessage: string;
  /**
   * The sheet's customer / plan / premium facts, for the native viewer page (see
   * lib/pdf-viewer.ts). Each screen builds this above its own loading gate, so every field may
   * still be undefined on the first renders — an absent field is left out of the url, and the
   * download button this drives only exists once the sheet itself has rendered.
   */
  meta?: PdfMeta;
}) {
  const inMiniProgram = useMiniProgram();

  const { mutate, isPending } = useMutation({
    mutationFn: () => generate(),
    onSuccess: (url) =>
      openPdf(
        { url, name: pdfFileName(url), source: "plan", meta },
        Boolean(inMiniProgram),
      ),
    onError: () => toast.error(errorMessage),
  });

  return { isGenerating: isPending, onDownload: () => mutate() };
}
