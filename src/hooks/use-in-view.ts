"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reports whether the attached element is within `rootMargin` of the viewport, via a
 * callback ref + IntersectionObserver (robust to the element mounting/unmounting).
 * Used to drive infinite scroll: attach `ref` to a sentinel at the end of the list and
 * fetch the next page when `inView` flips true. No external dependency.
 */
export function useInView<T extends Element = HTMLDivElement>(
  rootMargin = "200px",
) {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { rootMargin },
      );
      observerRef.current.observe(node);
    },
    [rootMargin],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, inView };
}
