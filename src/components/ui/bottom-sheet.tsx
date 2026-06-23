"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Minimal bottom sheet (no Radix dependency): a backdrop + a slide-up panel rendered
 * into a portal on `document.body`. Closes on backdrop click or Escape, and locks body
 * scroll while open. The slide-up uses tailwindcss-animate.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-8 duration-300 animate-in slide-in-from-bottom"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        {title && (
          <h2 className="mb-5 text-center text-lg font-semibold text-muted-foreground">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
