"use client";

import { cn } from "@/lib/utils";

/**
 * Minimal controlled switch (no Radix dependency) — a button styled as a toggle. Mirrors the
 * subset of the shadcn Switch API we use: `checked`, `onCheckedChange`, `disabled`, `id`.
 */
export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  id,
  className,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-500" : "bg-input",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
