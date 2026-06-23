"use client";

import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates after it has stopped changing for `ms`
 * milliseconds. Used to throttle the expected-installment input into the cal request.
 */
export function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}
