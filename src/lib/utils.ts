import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Format a number as USD currency (e.g. 1234 → "$1,234.00"). Mirrors the webview helper. */
export function currencyFormatter(value: number) {
  return currencyFormat.format(value);
}
