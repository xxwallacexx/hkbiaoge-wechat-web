"use client";

import { useEffect, useState } from "react";

import { wechat } from "@/lib/wechat";

/**
 * Detects whether the page is running inside a WeChat Mini Program web-view.
 * Returns `null` until the (async, client-only) check resolves.
 */
export function useMiniProgram() {
  const [inMiniProgram, setInMiniProgram] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    wechat.isMiniProgram().then((v) => {
      if (active) setInMiniProgram(v);
    });
    return () => {
      active = false;
    };
  }, []);

  return inMiniProgram;
}
