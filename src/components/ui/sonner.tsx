"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * App-wide toast surface (sonner). Mounted once in the locale layout; fire toasts with
 * `toast.error(...)` / `toast(...)` from "sonner". Positioned top-center to match the
 * mobile app's transient top toasts.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
